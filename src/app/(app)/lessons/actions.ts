'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTeacherId, requireRole } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

/**
 * Biểu mẫu sau buổi học.
 *
 * VÌ SAO TỒN TẠI — ba con số đo được ngày 15/09/2026, trước khi có màn hình này:
 *
 *   · 314 / 458 buổi hoàn tất KHÔNG sinh dòng trả lương. Nguyên nhân duy nhất
 *     là thiếu giờ vào – giờ ra (`fn_generate_payable_lesson` đòi `v_has_time`).
 *     Hệ quả: chi phí giáo viên trong sổ chỉ bằng khoảng một phần ba thực tế,
 *     nên mọi con số lợi nhuận đều sai theo hướng nguy hiểm — cao hơn sự thật.
 *   · 458 / 458 buổi không có nội dung bài học.
 *   · 458 / 458 buổi không có video.
 *
 * Cả ba đều là cùng một nguyên nhân: không có chỗ nào để nhập. Buổi học chỉ vào
 * hệ thống khi chạy script nhập tay từ báo cáo PDF và sheet feedback.
 *
 * Nên biểu mẫu này BẮT BUỘC bốn thứ — giờ vào, giờ ra, tiêu đề nội dung, link
 * video — và từ chối lưu nếu thiếu. Đó là lý do nó tồn tại; nới ra là mất tác
 * dụng. Phần nhận xét chi tiết (điểm mạnh, điểm cần sửa, bài tập) để trống ở
 * bước này và được soạn sau ở bước duyệt báo cáo.
 */
const lessonLogSchema = z
  .object({
    class_id: z.string().uuid('Chưa chọn lớp'),
    teacher_id: z.string().uuid('Chưa chọn giáo viên'),
    lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày học không hợp lệ'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ vào không hợp lệ'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ ra không hợp lệ'),
    topic: z.string().trim().min(3, 'Tiêu đề nội dung phải có ít nhất 3 ký tự').max(300),
    video_url: z
      .string()
      .trim()
      .url('Link video phải là một đường dẫn đầy đủ, bắt đầu bằng https://'),
    video_url_2: z.string().trim().url('Link video phần 2 không hợp lệ').optional(),
    is_free: z.enum(['0', '1']).default('0'),
    is_makeup: z.enum(['0', '1']).default('0'),
    quick_notes: z.string().trim().max(4000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.end_time <= v.start_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'Giờ ra phải sau giờ vào',
        path: ['end_time'],
      })
    }
  })

/** Giờ Việt Nam (UTC+7) — hệ thống không phục vụ múi giờ nào khác. */
const VN_OFFSET = '+07:00'

function vnTimestamp(date: string, time: string): string {
  return `${date}T${time}:00${VN_OFFSET}`
}

/**
 * Ghi nhận một buổi đã dạy xong, kèm nội dung và video.
 *
 * THỨ TỰ DƯỚI ĐÂY LÀ BẮT BUỘC, không phải tuỳ ý (xem supabase/data-imports/README.md):
 *
 *   1. Tạo buổi học ở trạng thái `scheduled`. Trigger doanh thu
 *      `trg_lesson_consume_all` chỉ chạy khi trạng thái ĐỔI sang `completed`;
 *      tạo thẳng `completed` thì không sinh dòng doanh thu nào.
 *   2. Điểm danh cho toàn bộ học viên đang hoạt động của lớp. `fn_generate_payable_lesson`
 *      đòi số dòng điểm danh phải bằng đúng sĩ số, thiếu một em là không sinh lương.
 *   3. Đánh dấu buổi miễn phí — SAU khi điểm danh, vì `tg_attendance_defaults`
 *      ghi đè `is_billable` lúc INSERT.
 *   4. Chuyển sang `completed`. Đến đây doanh thu và lương mới được sinh.
 *   5. Báo cáo buổi học và video.
 *
 * Làm sai thứ tự thì dữ liệu vẫn lưu, không có lỗi nào hiện ra, nhưng sổ sách
 * sai. Đó là lý do toàn bộ luồng nằm trong một hàm chứ không rải ra nhiều nơi.
 */
export async function logLesson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole(['founder', 'teacher'])
  const parsed = parseForm(lessonLogSchema, formData)
  if (!parsed.ok) return parsed

  const d = parsed.data
  const supabase = await createClient()

  // Giáo viên chỉ được ghi buổi của chính mình. RLS trong CSDL vẫn là hàng rào
  // chính; kiểm tra ở đây để báo lỗi rõ ràng thay vì một lỗi quyền khó hiểu.
  if (user.role_code === 'teacher') {
    const myTeacherId = await getCurrentTeacherId()
    if (!myTeacherId) {
      return { ok: false, error: 'Tài khoản này chưa được gắn với hồ sơ giáo viên nào.' }
    }
    if (myTeacherId !== d.teacher_id) {
      return { ok: false, error: 'Chỉ ghi được buổi học do chính mình dạy.' }
    }
  }

  const startAt = vnTimestamp(d.lesson_date, d.start_time)
  const endAt = vnTimestamp(d.lesson_date, d.end_time)

  // Chặn ghi trùng: cùng lớp, cùng ngày, cùng giờ bắt đầu.
  const { data: trung } = await supabase
    .from('lessons')
    .select('id')
    .eq('class_id', d.class_id)
    .eq('lesson_date', d.lesson_date)
    .eq('scheduled_start_at', startAt)
    .maybeSingle()

  if (trung) {
    return {
      ok: false,
      error: 'Buổi học này đã được ghi rồi (cùng lớp, cùng ngày, cùng giờ bắt đầu).',
    }
  }

  const { data: hocVien } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', d.class_id)
    .eq('status', 'active')

  if (!hocVien || hocVien.length === 0) {
    return {
      ok: false,
      error: 'Lớp này chưa có học viên nào đang hoạt động. Thêm học viên vào lớp trước.',
    }
  }

  // --- Bước 1: tạo buổi học ở trạng thái scheduled --------------------------
  const { data: buoi, error: loiTao } = await supabase
    .from('lessons')
    .insert({
      class_id: d.class_id,
      teacher_id: d.teacher_id,
      lesson_date: d.lesson_date,
      scheduled_start_at: startAt,
      scheduled_end_at: endAt,
      actual_start_at: startAt,
      actual_end_at: endAt,
      status: 'scheduled',
      is_makeup: d.is_makeup === '1',
      topic: d.topic,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (loiTao || !buoi) return { ok: false, error: friendlyDbError(loiTao?.message ?? '') }

  /** Xoá buổi vừa tạo khi một bước sau thất bại, để không để lại buổi dở dang. */
  const huyBo = async (thongBao: string): Promise<ActionResult> => {
    await supabase.from('lessons').delete().eq('id', buoi.id)
    return { ok: false, error: thongBao }
  }

  // --- Bước 2: điểm danh ----------------------------------------------------
  const { error: loiDiemDanh } = await supabase.from('attendance').insert(
    hocVien.map((h) => ({
      lesson_id: buoi.id,
      student_id: h.student_id,
      status: 'present' as const,
    })),
  )
  if (loiDiemDanh) return huyBo(friendlyDbError(loiDiemDanh.message))

  // --- Bước 3: buổi miễn phí (phải sau bước 2) ------------------------------
  if (d.is_free === '1') {
    const { error: loiMienPhi } = await supabase
      .from('attendance')
      .update({ is_billable: false })
      .eq('lesson_id', buoi.id)
    if (loiMienPhi) return huyBo(friendlyDbError(loiMienPhi.message))
  }

  // --- Bước 4: hoàn tất — doanh thu và lương sinh ra ở đây -------------------
  const { error: loiHoanTat } = await supabase
    .from('lessons')
    .update({ status: 'completed' })
    .eq('id', buoi.id)
  if (loiHoanTat) return huyBo(friendlyDbError(loiHoanTat.message))

  // --- Bước 5: báo cáo buổi học --------------------------------------------
  // Để `status = 'draft'`: giờ và nội dung đã có thật, nhưng nhận xét chi tiết
  // chưa viết. Không đánh dấu `submitted` khi báo cáo chưa đủ chữ.
  const { error: loiBaoCao } = await supabase.from('teaching_reports').insert({
    lesson_id: buoi.id,
    class_id: d.class_id,
    teacher_id: d.teacher_id,
    report_date: d.lesson_date,
    // `teaching_reports.start_time` / `end_time` là timestamptz chứ không phải
    // time — phải gửi mốc thời gian đầy đủ, không gửi "20:00".
    start_time: startAt,
    end_time: endAt,
    lesson_content: d.topic,
    teacher_comments: d.quick_notes?.trim() || null,
    status: 'draft',
    // Enum `report_author` chỉ có teacher | ai | ai_edited_by_teacher. Nội dung ở
    // bước này (giờ dạy, tiêu đề bài) do giáo viên cung cấp, kể cả khi Founder là
    // người gõ hộ — nên ghi 'teacher'. Khi AI soạn phần nhận xét ở bước sau, giá
    // trị chuyển thành 'ai', rồi 'ai_edited_by_teacher' sau khi giáo viên duyệt.
    authored_by: 'teacher',
    created_by: user.id,
  })
  if (loiBaoCao) return huyBo(friendlyDbError(loiBaoCao.message))

  // --- Bước 5b: video -------------------------------------------------------
  // `mirrored_at` để trống có nghĩa: video đang nằm trên tài khoản của giáo viên,
  // trung tâm chưa sở hữu bản sao nào (migration 0019).
  const videos = [d.video_url, d.video_url_2].filter(Boolean) as string[]
  const { error: loiVideo } = await supabase.from('recordings').insert(
    videos.map((url, i) => ({
      lesson_id: buoi.id,
      class_id: d.class_id,
      url,
      provider: 'zoom_teacher',
      title: videos.length > 1 ? `Phần ${i + 1}` : null,
      visible_to_parent: true,
    })),
  )
  if (loiVideo) return huyBo(friendlyDbError(loiVideo.message))

  revalidatePath('/lessons')
  revalidatePath('/classes')
  revalidatePath('/dashboard')
  revalidatePath('/payroll')

  return {
    ok: true,
    message:
      d.is_free === '1'
        ? 'Đã ghi buổi học. Buổi này miễn phí nên không tính học phí, nhưng vẫn tính lương giáo viên.'
        : 'Đã ghi buổi học. Học phí và lương giáo viên đã được tính.',
  }
}
