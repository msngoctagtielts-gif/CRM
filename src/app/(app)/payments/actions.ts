'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, loiTuHam, parseForm, type ActionResult } from '@/lib/actions'

const paymentSchema = z.object({
  student_id: z.string().uuid('Chưa chọn học viên'),
  enrollment_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày thanh toán không hợp lệ'),
  method: z.enum(['cash', 'bank_transfer', 'other']),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Ghi nhận một lần thu tiền.
 *
 * Đây là DÒNG TIỀN, không phải doanh thu. Doanh thu chỉ được ghi nhận khi buổi
 * học hoàn tất (xem lesson_consumptions trong migration 0006).
 */
export async function recordPayment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(paymentSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()

  // --- Gắn tiền vào đúng hợp đồng ------------------------------------------
  // Tiền không gắn hợp đồng thì KHÔNG trừ công nợ của ai: nó nằm trong sổ quỹ
  // nhưng học viên vẫn hiện đang nợ. Trước đây ô chọn hợp đồng để trống là
  // chuyện bình thường, nên sai sót này im lặng và chỉ lộ ra khi đối chiếu cuối
  // kỳ. Giờ hệ thống tự tìm hợp đồng, và chỉ hỏi lại khi thật sự không đoán được.
  let enrollmentId = parsed.data.enrollment_id ?? null

  if (enrollmentId) {
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('id', enrollmentId)
      .maybeSingle()

    if (!enrollment || enrollment.student_id !== parsed.data.student_id) {
      return { ok: false, error: 'Hợp đồng học phí không thuộc học viên đã chọn.' }
    }
  } else {
    const { data: candidates } = await supabase
      .from('student_enrollments')
      .select('id, enrollment_code')
      .eq('student_id', parsed.data.student_id)
      .in('status', ['active', 'paused'])
      .order('start_date', { ascending: false })

    const list = candidates ?? []
    if (list.length === 1) {
      enrollmentId = list[0].id
    } else if (list.length > 1) {
      return {
        ok: false,
        error: `Học viên này có ${list.length} hợp đồng đang hiệu lực — chọn đúng hợp đồng để tiền trừ vào đúng chỗ.`,
      }
    }
    // list.length === 0: cho phép ghi nhận nhưng sẽ nói rõ ở thông báo cuối.
  }

  // --- Gắn tiếp vào phiếu học phí tháng, nếu có ----------------------------
  // Hợp đồng đóng cuối tháng thu theo phiếu. Không gắn vào phiếu thì phiếu mãi
  // ở trạng thái chưa thu, dù tiền đã về.
  let statementId: string | null = null
  let statementLabel = ''

  if (enrollmentId) {
    const { data: statement } = await supabase
      .from('tuition_statements')
      .select('id, period_label, net_amount, paid_amount, period_start, period_end')
      .eq('enrollment_id', enrollmentId)
      .in('status', ['issued', 'partial'])
      .order('period_start', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (statement) {
      statementId = statement.id
      statementLabel = statement.period_label ?? ''
    }
  }

  const { error } = await supabase.from('payments').insert({
    ...parsed.data,
    enrollment_id: enrollmentId,
    statement_id: statementId,
    status: 'confirmed',
    recorded_by: user.id,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  // Tính lại phiếu để trạng thái bám theo số tiền vừa thu.
  if (statementId) {
    const { data: st } = await supabase
      .from('tuition_statements')
      .select('enrollment_id, period_start, period_end')
      .eq('id', statementId)
      .maybeSingle()
    if (st) {
      await supabase.rpc('fn_build_tuition_statement', {
        p_enrollment_id: st.enrollment_id,
        p_period_start: st.period_start,
        p_period_end: st.period_end,
      })
    }
  }

  revalidatePath('/payments')
  revalidatePath('/statements')
  revalidatePath('/month-end')
  revalidatePath('/dashboard')
  revalidatePath(`/students/${parsed.data.student_id}`)

  if (!enrollmentId) {
    return {
      ok: true,
      message:
        'Đã ghi nhận thanh toán, NHƯNG học viên chưa có hợp đồng nào đang hiệu lực nên tiền này chưa trừ vào công nợ. Tạo hợp đồng rồi ghi lại cho đúng sổ.',
    }
  }

  return {
    ok: true,
    message: statementId
      ? `Đã ghi nhận thanh toán và trừ vào phiếu học phí tháng ${statementLabel}.`.replace('  ', ' ')
      : 'Đã ghi nhận thanh toán và trừ vào công nợ của hợp đồng.',
  }
}

/**
 * Hợp đồng học phí.
 *
 * Hai hình thức đóng khác nhau về bản chất (D1):
 *   · `prepaid_package` — mua trước một gói, buộc phải có số buổi và tổng tiền
 *   · `monthly_postpaid` — học trước, cuối tháng đối soát; số buổi và tổng tiền
 *     chỉ biết khi chốt tháng nên để trống
 * Ràng buộc `chk_enrollment_prepaid_shape` trong CSDL cũng nói đúng điều này,
 * nên biểu mẫu phải hỏi khác nhau thay vì ép mọi hợp đồng thành gói trả trước.
 */
const PAYER_PATTERN = /^(student|parent):[0-9a-f-]{36}$|^new$|^$/i

const enrollmentSchema = z
  .object({
    student_id: z.string().uuid('Chưa chọn học viên'),
    class_id: z.string().uuid().optional(),
    program_id: z.string().uuid().optional(),
    tuition_package_id: z.string().uuid().optional(),
    billing_mode: z.enum(['prepaid_package', 'monthly_postpaid', 'undetermined']),
    lessons_purchased: z.coerce.number().positive('Số buổi phải lớn hơn 0').optional(),
    price_per_lesson: z.coerce.number().min(0, 'Đơn giá không được âm'),
    discount_amount: z.coerce.number().min(0).default(0),
    monthly_discount_amount: z.coerce.number().min(0).default(0),
    headcount: z.coerce.number().int().min(1).max(30).default(1),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    agreement_notes: z.string().max(2000).optional(),
    payer: z.string().regex(PAYER_PATTERN, 'Người đóng học phí không hợp lệ').optional(),
    payer_new_name: z.string().max(200).optional(),
    payer_new_phone: z.string().max(40).optional(),
    payer_note: z.string().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.billing_mode === 'prepaid_package') {
      if (!v.lessons_purchased) {
        ctx.addIssue({
          code: 'custom',
          message: 'Gói trả trước phải ghi rõ số buổi đã mua',
          path: ['lessons_purchased'],
        })
        return
      }
      if (v.discount_amount > v.lessons_purchased * v.price_per_lesson) {
        ctx.addIssue({
          code: 'custom',
          message: 'Giảm giá không thể lớn hơn tổng học phí',
          path: ['discount_amount'],
        })
      }
    }
    if (v.payer === 'new' && !v.payer_new_name?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nhập tên người đứng tên đóng học phí',
        path: ['payer_new_name'],
      })
    }
  })

/**
 * Tạo hợp đồng học phí. Đơn giá lấy theo từng học viên — hệ thống không có giá
 * cố định toàn trung tâm (mục VII của yêu cầu).
 */
export async function createEnrollment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(enrollmentSchema, formData)
  if (!parsed.ok) return parsed

  const {
    discount_amount,
    lessons_purchased,
    payer,
    payer_new_name,
    payer_new_phone,
    payer_note,
    ...rest
  } = parsed.data

  const supabase = await createClient()

  // Người đứng tên đóng. Không chỉ định ai = chính học viên đóng (D13, D14).
  let payerStudentId: string | null = null
  let payerParentId: string | null = null

  if (payer === 'new') {
    const { data: created, error } = await supabase
      .from('parents')
      .insert({
        full_name: payer_new_name!.trim(),
        phone: payer_new_phone?.trim() || null,
        notes: payer_note?.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error || !created) return { ok: false, error: friendlyDbError(error?.message ?? '') }
    payerParentId = created.id
  } else if (payer?.startsWith('student:')) {
    payerStudentId = payer.slice('student:'.length)
    if (payerStudentId === rest.student_id) payerStudentId = null
  } else if (payer?.startsWith('parent:')) {
    payerParentId = payer.slice('parent:'.length)
  }

  const isPrepaid = rest.billing_mode === 'prepaid_package'
  const net = isPrepaid ? lessons_purchased! * rest.price_per_lesson - discount_amount : null

  const { data: enrollment, error } = await supabase
    .from('student_enrollments')
    .insert({
      ...rest,
      lessons_purchased: isPrepaid ? lessons_purchased! : null,
      discount_amount,
      net_amount: net,
      payer_student_id: payerStudentId,
      payer_parent_id: payerParentId,
      payer_note: payer_note?.trim() || null,
      status: 'active',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !enrollment) return { ok: false, error: friendlyDbError(error?.message ?? '') }

  // Ghi luôn mốc đơn giá đầu tiên để lịch sử giá đầy đủ ngay từ đầu; các mốc
  // sau thêm bằng addTuitionRate.
  const { error: rateError } = await supabase.from('tuition_rates').insert({
    enrollment_id: enrollment.id,
    price_per_lesson: rest.price_per_lesson,
    effective_from: rest.start_date,
    evidence_note: 'Đơn giá lúc lập hợp đồng',
    created_by: user.id,
  })
  if (rateError) return { ok: false, error: friendlyDbError(rateError.message) }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  revalidatePath(`/students/${rest.student_id}`)
  return {
    ok: true,
    message: isPrepaid
      ? 'Đã tạo hợp đồng gói trả trước.'
      : 'Đã tạo hợp đồng đóng cuối tháng. Số buổi và tổng tiền sẽ chốt theo phiếu học phí từng tháng.',
  }
}

const tuitionRateSchema = z.object({
  enrollment_id: z.string().uuid('Chưa chọn hợp đồng'),
  price_per_lesson: z.coerce.number().min(0, 'Đơn giá không được âm'),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hiệu lực không hợp lệ'),
  evidence_note: z.string().max(500).optional(),
})

/**
 * Thêm một mốc đơn giá học phí mới cho hợp đồng đã có (D11).
 *
 * Ca thật: Bé Ngân 179.000 ₫ đến 31/08/2026, rồi 190.000 ₫ từ 01/09/2026. Buổi
 * đã dạy trước ngày đổi giá vẫn giữ nguyên số tiền cũ, vì `fn_resolve_tuition_rate`
 * tra theo NGÀY HỌC chứ không theo giá hiện hành.
 *
 * Mốc cũ được đóng lại vào hôm trước ngày hiệu lực mới, để hai khoảng không
 * chồng nhau và việc tra giá luôn cho một kết quả duy nhất.
 */
export async function addTuitionRate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(tuitionRateSchema, formData)
  if (!parsed.ok) return parsed

  const { enrollment_id, price_per_lesson, effective_from, evidence_note } = parsed.data
  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('student_enrollments')
    .select('student_id')
    .eq('id', enrollment_id)
    .maybeSingle()

  if (!enrollment) return { ok: false, error: 'Không tìm thấy hợp đồng học phí.' }

  const dayBefore = new Date(`${effective_from}T00:00:00Z`)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)
  const closeAt = dayBefore.toISOString().slice(0, 10)

  if (closeAt >= effective_from) {
    return { ok: false, error: 'Ngày hiệu lực không hợp lệ.' }
  }

  const { error: closeError } = await supabase
    .from('tuition_rates')
    .update({ effective_to: closeAt })
    .eq('enrollment_id', enrollment_id)
    .is('effective_to', null)
    .lte('effective_from', closeAt)

  if (closeError) return { ok: false, error: friendlyDbError(closeError.message) }

  const { error } = await supabase.from('tuition_rates').insert({
    enrollment_id,
    price_per_lesson,
    effective_from,
    evidence_note: evidence_note?.trim() || null,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/payments')
  revalidatePath(`/students/${enrollment.student_id}`)
  return { ok: true, message: `Đã thêm mốc đơn giá áp dụng từ ${effective_from}.` }
}

/* -------------------------------------------------------------------------
 * SỬA và HUỶ phiếu thu.
 *
 * KHÔNG CÓ XOÁ, và đó là cố ý. Một bản ghi tiền đã tồn tại là bằng chứng có
 * người đã gõ nó vào; nếu gõ sai thì phải thấy được là đã sai, ai sửa và vì
 * sao. Xoá cứng làm sổ sách khớp một cách giả tạo — nhìn vào không ai biết
 * từng có một phiếu 7.227.000₫ nhập nhầm.
 *
 * Huỷ đổi trạng thái sang `cancelled`. Các view công nợ đã lọc theo
 * status = 'confirmed' nên phiếu huỷ tự động rơi khỏi mọi con số, mà vẫn còn
 * trong sổ để đối chiếu.
 * ---------------------------------------------------------------------- */

const suaPhieuThuSchema = z.object({
  payment_id: z.string().uuid(),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày thanh toán không hợp lệ')
    .optional(),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0').optional(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  ly_do: z.string().trim().min(5, 'Lý do phải có ít nhất 5 ký tự').max(500),
})

export async function suaPhieuThu(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(suaPhieuThuSchema, formData)
  if (!parsed.ok) return parsed

  const d = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_sua_phieu_thu', {
    p_payment_id: d.payment_id,
    p_payment_date: d.payment_date ?? null,
    p_amount: d.amount ?? null,
    p_reference: d.reference ?? null,
    p_notes: d.notes ?? null,
    p_ly_do: d.ly_do,
  })
  if (error) return { ok: false, error: loiTuHam(error.message) }

  revalidatePath('/payments')
  revalidatePath('/doi-soat')
  return { ok: true, message: 'Đã sửa phiếu thu và ghi vào nhật ký.' }
}

const huyPhieuThuSchema = z.object({
  payment_id: z.string().uuid(),
  ly_do: z.string().trim().min(5, 'Lý do phải có ít nhất 5 ký tự').max(500),
  xac_nhan: z.literal('HUY', { message: 'Gõ đúng chữ HUY để xác nhận' }),
})

export async function huyPhieuThu(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(huyPhieuThuSchema, formData)
  if (!parsed.ok) return parsed

  const d = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_huy_phieu_thu', {
    p_payment_id: d.payment_id,
    p_ly_do: d.ly_do,
  })
  if (error) return { ok: false, error: loiTuHam(error.message) }

  revalidatePath('/payments')
  revalidatePath('/doi-soat')
  return {
    ok: true,
    message: 'Đã huỷ phiếu thu. Phiếu vẫn còn trong sổ nhưng không còn tính vào công nợ.',
  }
}
