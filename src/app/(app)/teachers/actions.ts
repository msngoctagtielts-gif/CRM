'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

const teacherSchema = z.object({
  full_name: z.string().min(2, 'Tên giáo viên quá ngắn').max(120),
  display_name: z.string().max(80).optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  phone: z.string().max(30).optional(),
  nationality: z.string().max(60).optional(),
  hired_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bio: z.string().max(2000).optional(),
  rate_30: z.coerce.number().min(0).optional(),
  rate_60: z.coerce.number().min(0).optional(),
  rate_90: z.coerce.number().min(0).optional(),
})

export async function createTeacher(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(teacherSchema, formData)
  if (!parsed.ok) return parsed

  const { rate_30, rate_60, rate_90, ...teacher } = parsed.data
  const supabase = await createClient()

  const { data: created, error } = await supabase
    .from('teachers')
    .insert({ ...teacher, created_by: user.id })
    .select('id')
    .single()

  if (error || !created) return { ok: false, error: friendlyDbError(error?.message ?? '') }

  const rates = (
    [
      [30, rate_30],
      [60, rate_60],
      [90, rate_90],
    ] as const
  )
    .filter(([, amount]) => amount !== undefined && amount > 0)
    .map(([minutes, amount]) => ({
      teacher_id: created.id,
      scope: 'duration' as const,
      duration_minutes: minutes,
      rate_amount: amount!,
      created_by: user.id,
    }))

  if (rates.length > 0) {
    const { error: rateError } = await supabase.from('teacher_rates').insert(rates)
    if (rateError) {
      return {
        ok: false,
        error: 'Đã lưu giáo viên nhưng chưa lưu được đơn giá. Hãy thêm đơn giá lại.',
      }
    }
  }

  revalidatePath('/teachers')
  return { ok: true, message: `Đã thêm giáo viên ${teacher.full_name}.` }
}

const rateSchema = z.object({
  teacher_id: z.string().uuid(),
  duration_minutes: z.coerce.number().refine((v) => [30, 60, 90].includes(v), {
    message: 'Thời lượng chỉ nhận 30, 60 hoặc 90 phút',
  }),
  rate_amount: z.coerce.number().min(0, 'Đơn giá không được âm'),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * Thêm đơn giá mới cho giáo viên.
 *
 * Không sửa đơn giá cũ: số tiền của các buổi đã dạy đã được đóng băng trong
 * teacher_payable_lessons, nên đơn giá mới chỉ áp dụng từ effective_from.
 */
export async function addTeacherRate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(rateSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { error } = await supabase.from('teacher_rates').insert({
    teacher_id: parsed.data.teacher_id,
    scope: 'duration',
    duration_minutes: parsed.data.duration_minutes,
    rate_amount: parsed.data.rate_amount,
    effective_from: parsed.data.effective_from,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/teachers')
  return { ok: true, message: 'Đã thêm đơn giá mới.' }
}

const inviteSchema = z.object({
  teacher_id: z.string().uuid('Chưa chọn giáo viên'),
  email: z.string().email('Email không hợp lệ'),
})

/**
 * Tạo tài khoản đăng nhập cho một giáo viên và trả về đường dẫn mời.
 *
 * VÌ SAO KHÔNG ĐẶT MẬT KHẨU TẠM RỒI GỬI QUA ZALO:
 * mật khẩu tạm nằm lại vĩnh viễn trong lịch sử chat của cả hai bên, và gần như
 * không ai đổi nó sau lần đăng nhập đầu. Cách này sinh một đường dẫn dùng một
 * lần; giáo viên bấm vào, tự đặt mật khẩu của mình. Trung tâm không bao giờ
 * biết mật khẩu đó.
 *
 * VÌ SAO KHÔNG GỬI EMAIL: dịch vụ gửi thư sẵn có của Supabase bị giới hạn vài
 * thư mỗi giờ và hay rơi vào hộp spam. Đường dẫn được trả về màn hình để
 * Founder tự gửi qua Zalo — kênh mà giáo viên chắc chắn đọc.
 *
 * Quyền của tài khoản mới là `teacher`, do trigger tg_handle_new_auth_user đọc
 * từ metadata. Giáo viên KHÔNG thấy được doanh thu, lợi nhuận, hay lương của
 * người khác — RLS chặn ở tầng cơ sở dữ liệu, không phải ở giao diện.
 */
export async function inviteTeacher(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(inviteSchema, formData)
  if (!parsed.ok) return parsed

  const { teacher_id, email } = parsed.data
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, full_name, display_name, user_id')
    .eq('id', teacher_id)
    .maybeSingle()

  if (!teacher) return { ok: false, error: 'Không tìm thấy giáo viên.' }
  if (teacher.user_id) {
    return { ok: false, error: `${teacher.full_name} đã có tài khoản rồi.` }
  }

  // Service role: tạo tài khoản là việc chỉ máy chủ được làm. Khoá này không
  // bao giờ đi ra trình duyệt — `import 'server-only'` trong admin.ts chặn.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

  const { data: invited, error: inviteError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      data: { full_name: teacher.full_name, role_code: 'teacher' },
    },
  })

  if (inviteError || !invited?.user) {
    const thongBao = /already been registered|already exists/i.test(inviteError?.message ?? '')
      ? 'Email này đã có tài khoản trong hệ thống. Dùng email khác, hoặc gỡ tài khoản cũ trước.'
      : 'Không tạo được tài khoản. Kiểm tra lại email.'
    return { ok: false, error: thongBao }
  }

  // Gắn tài khoản vào hồ sơ giáo viên. Thiếu bước này thì giáo viên đăng nhập
  // được nhưng `current_teacher_id()` trả null, nên không thấy lớp nào của mình.
  const { error: linkError } = await supabase
    .from('teachers')
    .update({ user_id: invited.user.id, email })
    .eq('id', teacher_id)

  if (linkError) {
    return {
      ok: false,
      error:
        'Đã tạo tài khoản nhưng chưa gắn được vào hồ sơ giáo viên. Báo lại để xử lý thủ công.',
    }
  }

  revalidatePath('/teachers')

  const duongDan = invited.properties?.action_link ?? ''
  return {
    ok: true,
    message:
      `Đã tạo tài khoản cho ${teacher.display_name ?? teacher.full_name}. ` +
      `Gửi đường dẫn này cho cô qua Zalo — dùng một lần rồi hết hiệu lực:\n\n${duongDan}`,
  }
}

const revokeSchema = z.object({
  teacher_id: z.string().uuid('Chưa chọn giáo viên'),
})

/**
 * Gỡ tài khoản đăng nhập của một giáo viên.
 *
 * Dùng khi: mời nhầm email, giáo viên nghỉ việc, hoặc thử xong muốn dọn.
 *
 * Xoá tài khoản Auth là đủ — chuỗi khoá ngoại tự dọn phần còn lại:
 *   auth.users  --ON DELETE CASCADE-->  public.users
 *   public.users --ON DELETE SET NULL--> teachers.user_id
 *
 * KHÔNG xoá hồ sơ giáo viên, KHÔNG xoá buổi học, KHÔNG xoá dòng lương. Giáo
 * viên nghỉ việc vẫn phải tra được đã dạy bao nhiêu buổi và còn nợ lương bao
 * nhiêu — đó là sổ sách, không phải quyền truy cập.
 */
export async function revokeTeacherAccount(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(revokeSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, full_name, display_name, user_id')
    .eq('id', parsed.data.teacher_id)
    .maybeSingle()

  if (!teacher) return { ok: false, error: 'Không tìm thấy giáo viên.' }
  if (!teacher.user_id) return { ok: false, error: 'Giáo viên này chưa có tài khoản.' }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.deleteUser(teacher.user_id)
  if (error) return { ok: false, error: 'Không gỡ được tài khoản. Thử lại sau.' }

  // Chuỗi ON DELETE đã đưa user_id về null. Xoá nốt email để lần mời sau không
  // tự điền một địa chỉ đã bị gỡ.
  await supabase.from('teachers').update({ email: null }).eq('id', teacher.id)

  revalidatePath('/teachers')
  return {
    ok: true,
    message:
      `Đã gỡ tài khoản của ${teacher.display_name ?? teacher.full_name}. ` +
      'Hồ sơ, buổi học và dòng lương giữ nguyên.',
  }
}
