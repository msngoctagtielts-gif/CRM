'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { friendlyDbError, type ActionResult } from '@/lib/actions'
import { localInputToISO, minutesBetween } from '@/lib/time'
import type { TablesUpdate } from '@/types/database.types'

const ATTENDANCE_VALUES = [
  'present',
  'late',
  'absent_excused',
  'absent_unexcused',
  'no_show',
] as const
const RATING_VALUES = ['excellent', 'good', 'average', 'needs_improvement', 'concerning'] as const
const HOMEWORK_VALUES = ['completed', 'partial', 'not_done', 'not_assigned'] as const

const reportSchema = z.object({
  lesson_id: z.string().uuid(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  lesson_content: z.string().max(4000).optional(),
  homework_title: z.string().max(200).optional(),
  homework_description: z.string().max(4000).optional(),
  homework_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recording_url: z.string().url('Link recording phải bắt đầu bằng http:// hoặc https://').optional(),
  teacher_comments: z.string().max(4000).optional(),
  next_lesson_recommendation: z.string().max(2000).optional(),
  mark_completed: z.string().optional(),
})

/**
 * Lưu báo cáo giảng dạy cho một buổi học.
 *
 * Gom tất cả vào một action để giáo viên chỉ phải bấm lưu một lần trên điện
 * thoại. Lưu nháp được phép thiếu trường; trạng thái ĐỦ/THIẾU do database tự
 * tính lại (fn_refresh_report_status) nên không thể lệch với cảnh báo.
 */
export async function saveTeachingReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()

  const raw: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && value !== '') raw[key] = value
  }

  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message }
  }
  const input = parsed.data
  const supabase = await createClient()

  // RLS: giáo viên không dạy buổi này sẽ không đọc được ⇒ dừng ngay.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, class_id, teacher_id, scheduled_start_at, scheduled_end_at, status')
    .eq('id', input.lesson_id)
    .maybeSingle()

  if (!lesson) return { ok: false, error: 'Không tìm thấy buổi học, hoặc bạn không có quyền.' }

  const startISO = localInputToISO(input.start_time)
  const endISO = localInputToISO(input.end_time)

  if (startISO && endISO && Date.parse(endISO) <= Date.parse(startISO)) {
    return { ok: false, error: 'Giờ kết thúc phải sau giờ bắt đầu.' }
  }

  // 1) Buổi học: ghi giờ thực tế; đánh dấu đã dạy khi giáo viên xác nhận.
  //    Chính việc chuyển sang 'completed' mới bắt đầu đếm hạn 10 giờ.
  const lessonUpdate: TablesUpdate<'lessons'> = {}
  if (startISO) lessonUpdate.actual_start_at = startISO
  if (endISO) lessonUpdate.actual_end_at = endISO
  if (input.mark_completed === 'on' && lesson.status !== 'completed') {
    lessonUpdate.status = 'completed'
  }
  if (Object.keys(lessonUpdate).length > 0) {
    const { error } = await supabase.from('lessons').update(lessonUpdate).eq('id', lesson.id)
    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  // 2) Điểm danh — phải ghi trước khi sinh buổi tính lương.
  const { data: roster } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', lesson.class_id)
    .eq('status', 'active')

  const attendanceRows = (roster ?? [])
    .map((r) => {
      const value = raw[`attendance_${r.student_id}`]
      if (!value || !(ATTENDANCE_VALUES as readonly string[]).includes(value)) return null
      return {
        lesson_id: lesson.id,
        student_id: r.student_id,
        status: value as (typeof ATTENDANCE_VALUES)[number],
        recorded_by: user.id,
        recorded_at: new Date().toISOString(),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (attendanceRows.length > 0) {
    const { error } = await supabase
      .from('attendance')
      .upsert(attendanceRows, { onConflict: 'lesson_id,student_id' })
    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  // 3) Bài tập về nhà (bảng homework là nguồn sự thật cho kiểm tra "đã có bài tập")
  if (input.homework_title) {
    const { data: existing } = await supabase
      .from('homework')
      .select('id')
      .eq('lesson_id', lesson.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    const payload = {
      lesson_id: lesson.id,
      class_id: lesson.class_id,
      title: input.homework_title,
      description: input.homework_description,
      due_date: input.homework_due_date,
      assigned_by: user.id,
    }

    const { error } = existing
      ? await supabase.from('homework').update(payload).eq('id', existing.id)
      : await supabase.from('homework').insert({ ...payload, created_by: user.id })

    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  // 4) Recording
  if (input.recording_url) {
    const { data: existing } = await supabase
      .from('recordings')
      .select('id')
      .eq('lesson_id', lesson.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    const payload = {
      lesson_id: lesson.id,
      class_id: lesson.class_id,
      url: input.recording_url,
      provider: detectProvider(input.recording_url),
      uploaded_by: user.id,
    }

    const { error } = existing
      ? await supabase.from('recordings').update(payload).eq('id', existing.id)
      : await supabase.from('recordings').insert(payload)

    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  // 5) Báo cáo. Trạng thái và danh sách trường thiếu do trigger tự tính.
  const { data: report, error: reportError } = await supabase
    .from('teaching_reports')
    .upsert(
      {
        lesson_id: lesson.id,
        class_id: lesson.class_id,
        teacher_id: lesson.teacher_id,
        start_time: startISO,
        end_time: endISO,
        duration_minutes: minutesBetween(startISO, endISO),
        lesson_content: input.lesson_content,
        homework_summary: input.homework_title
          ? [input.homework_title, input.homework_description].filter(Boolean).join(' — ')
          : undefined,
        teacher_comments: input.teacher_comments,
        next_lesson_recommendation: input.next_lesson_recommendation,
        submitted_at: new Date().toISOString(),
        created_by: user.id,
      },
      { onConflict: 'lesson_id' },
    )
    .select('id, status, missing_fields')
    .single()

  if (reportError || !report) {
    return { ok: false, error: friendlyDbError(reportError?.message ?? '') }
  }

  // 6) Nhận xét riêng từng học viên (lớp nhóm có nhiều dòng)
  const feedbackRows = (roster ?? [])
    .map((r) => {
      const attitude = raw[`attitude_${r.student_id}`]
      const performance = raw[`performance_${r.student_id}`]
      const comments = raw[`comments_${r.student_id}`]
      const homework = raw[`homework_completion_${r.student_id}`]
      if (!attitude && !performance && !comments && !homework) return null
      return {
        report_id: report.id,
        student_id: r.student_id,
        attitude: pick(attitude, RATING_VALUES),
        performance: pick(performance, RATING_VALUES),
        comments: comments ?? null,
        homework_completion: pick(homework, HOMEWORK_VALUES),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (feedbackRows.length > 0) {
    const { error } = await supabase
      .from('teaching_report_students')
      .upsert(feedbackRows, { onConflict: 'report_id,student_id' })
    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  revalidatePath('/reports')
  revalidatePath(`/reports/${lesson.id}`)
  revalidatePath('/dashboard')

  // Đọc lại trạng thái sau khi trigger chạy để nói đúng còn thiếu gì.
  const { data: fresh } = await supabase
    .from('teaching_reports')
    .select('status, missing_fields')
    .eq('id', report.id)
    .single()

  const missing = fresh?.missing_fields ?? []
  if (missing.length === 0) {
    return { ok: true, message: 'Đã nộp báo cáo đầy đủ. Cảm ơn bạn.' }
  }

  return {
    ok: true,
    message: `Đã lưu. Báo cáo còn thiếu: ${missing.map(labelOf).join(', ')}.`,
  }
}

/** Founder duyệt báo cáo — sau khi duyệt, giáo viên không sửa được nữa (RLS). */
export async function approveReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  if (user.role_code !== 'founder') {
    return { ok: false, error: 'Chỉ Founder được duyệt báo cáo.' }
  }

  const reportId = String(formData.get('report_id') ?? '')
  if (!z.string().uuid().safeParse(reportId).success) {
    return { ok: false, error: 'Thiếu mã báo cáo.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('teaching_reports')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: String(formData.get('review_notes') ?? '') || null,
    })
    .eq('id', reportId)

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/reports')
  return { ok: true, message: 'Đã duyệt báo cáo.' }
}

function pick<T extends readonly string[]>(
  value: string | undefined,
  allowed: T,
): T[number] | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T[number]) : null
}

function detectProvider(url: string): string {
  if (/drive\.google|docs\.google/i.test(url)) return 'google_drive'
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube'
  if (/zoom\.us/i.test(url)) return 'zoom'
  return 'other'
}

const MISSING_LABEL: Record<string, string> = {
  homework: 'bài tập về nhà',
  recording: 'link recording',
  teacher_comments: 'nhận xét giáo viên',
  start_time: 'giờ bắt đầu',
  end_time: 'giờ kết thúc',
}

function labelOf(field: string): string {
  return MISSING_LABEL[field] ?? field
}
