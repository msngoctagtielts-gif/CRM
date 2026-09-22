'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder, requireUser } from '@/lib/auth'
import { friendlyDbError, loiTuHam, type ActionResult } from '@/lib/actions'
import { localInputToISO, minutesBetween } from '@/lib/time'
import { MISSING_FIELD } from '@/lib/labels'
import {
  classifyVideoSource,
  studentLabelFor,
  type FeedbackDraft,
  giayTuChuoi,
} from '@/lib/ai/feedback'
import { draftLessonFeedback, isAIConfigured, xacMinhBuoiHocTuVideo } from '@/lib/ai/provider'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

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
  homework_sentence_patterns: z.string().max(2000).optional(),
  homework_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  recording_url: z.string().url('Link video phải bắt đầu bằng http:// hoặc https://').optional(),
  video_timestamp: z.string().max(100).optional(),
  student_quote: z.string().max(2000).optional(),
  strengths: z.string().max(4000).optional(),
  improvements: z.string().max(4000).optional(),
  teacher_comments: z.string().max(4000).optional(),
  next_lesson_recommendation: z.string().max(2000).optional(),
  mark_completed: z.string().optional(),
  // Chỉ Founder gửi ba trường dưới đây; server vẫn kiểm lại quyền.
  qc_reviewed: z.string().optional(),
  qc_strengths_deep: z.string().optional(),
  qc_improvements_deep: z.string().optional(),
  qc_notes: z.string().max(2000).optional(),
})

/**
 * Lưu báo cáo giảng dạy cho một buổi học.
 *
 * Gom tất cả vào một action để giáo viên chỉ phải bấm lưu một lần trên điện
 * thoại. Lưu nháp được phép thiếu trường; điểm chất lượng và trạng thái
 * ĐẠT/THIẾU do database tự tính lại (fn_score_report_qc, fn_refresh_report_status)
 * nên giao diện không thể nói lệch với cảnh báo.
 */
export async function saveTeachingReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const isFounder = user.role_code === 'founder'

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
  //    Chính việc chuyển sang 'completed' mới bắt đầu đếm hạn nộp báo cáo.
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

  // 3) Bài tập về nhà. Bảng homework là nguồn sự thật cho hai tiêu chí chất
  //    lượng: "có bài tập" và "bài tập có mẫu câu".
  //    Mẫu câu có thể được nhập khi bài tập đã tồn tại, nên phải cho phép sửa
  //    chỉ mẫu câu mà không bắt nhập lại tên bài.
  if (input.homework_title || input.homework_sentence_patterns) {
    const { data: existing } = await supabase
      .from('homework')
      .select('id, title')
      .eq('lesson_id', lesson.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    const payload = {
      lesson_id: lesson.id,
      class_id: lesson.class_id,
      title: input.homework_title ?? existing?.title ?? 'Bài tập buổi học',
      description: input.homework_description ?? null,
      sentence_patterns: input.homework_sentence_patterns ?? null,
      due_date: input.homework_due_date ?? null,
      assigned_by: user.id,
    }

    const { error } = existing
      ? await supabase.from('homework').update(payload).eq('id', existing.id)
      : await supabase.from('homework').insert({ ...payload, created_by: user.id })

    if (error) return { ok: false, error: friendlyDbError(error.message) }
  }

  // 4) Video buổi học
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

  // 5) Báo cáo. Điểm QC, trạng thái và danh sách trường thiếu do trigger tính.
  //    Nếu nội dung đang do AI viết mà giáo viên sửa đi, phải ghi lại là "AI
  //    viết, giáo viên sửa" (D6) — Founder cần phân biệt được ba trường hợp khi
  //    đọc báo cáo, chứ không chỉ biết là có AI tham gia.
  const { data: previous } = await supabase
    .from('teaching_reports')
    .select('authored_by, strengths, improvements, student_quote')
    .eq('lesson_id', lesson.id)
    .maybeSingle()

  const teacherEditedAIText =
    previous?.authored_by === 'ai' &&
    ((input.strengths ?? '') !== (previous.strengths ?? '') ||
      (input.improvements ?? '') !== (previous.improvements ?? '') ||
      (input.student_quote ?? '') !== (previous.student_quote ?? ''))

  const reportPayload: TablesInsert<'teaching_reports'> = {
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
    student_quote: input.student_quote,
    video_timestamp: input.video_timestamp,
    strengths: input.strengths,
    improvements: input.improvements,
    teacher_comments: input.teacher_comments,
    next_lesson_recommendation: input.next_lesson_recommendation,
    submitted_at: new Date().toISOString(),
    created_by: user.id,
  }

  if (teacherEditedAIText) reportPayload.authored_by = 'ai_edited_by_teacher'

  // Hai tiêu chí "đủ sâu" là KẾT LUẬN CHẤM, không phải dữ liệu giáo viên nhập.
  // Chỉ ghi khi Founder thực sự gửi phần chấm, nếu không sẽ vô tình xoá điểm đã
  // chấm mỗi lần giáo viên lưu lại báo cáo.
  if (isFounder && input.qc_reviewed === '1') {
    reportPayload.qc_strengths_deep = input.qc_strengths_deep === 'on'
    reportPayload.qc_improvements_deep = input.qc_improvements_deep === 'on'
    reportPayload.qc_notes = input.qc_notes ?? null
  }

  const { data: report, error: reportError } = await supabase
    .from('teaching_reports')
    .upsert(reportPayload, { onConflict: 'lesson_id' })
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

  // Đọc lại sau khi trigger chạy để nói đúng điểm và còn thiếu gì.
  const { data: fresh } = await supabase
    .from('teaching_reports')
    .select('status, missing_fields, qc_score')
    .eq('id', report.id)
    .single()

  const missing = fresh?.missing_fields ?? []
  const score = fresh?.qc_score
  const scoreText = score === null || score === undefined ? '' : ` Điểm chất lượng: ${score}/100.`

  if (missing.length === 0) {
    return { ok: true, message: `Đã nộp báo cáo đầy đủ.${scoreText} Cảm ơn bạn.` }
  }

  // Thiếu giờ dạy là việc nghiêm trọng hơn thiếu tiêu chí chất lượng — nói rõ.
  const missingTime = missing.filter((f) => f === 'start_time' || f === 'end_time')
  if (missingTime.length > 0) {
    return {
      ok: true,
      message: `Đã lưu, nhưng còn thiếu ${missingTime.map(labelOf).join(' và ')}. Buổi này CHƯA được tính lương cho tới khi có đủ ngày giờ dạy.`,
    }
  }

  return {
    ok: true,
    message: `Đã lưu.${scoreText} Còn thiếu: ${missing.map(labelOf).join(', ')}.`,
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

/**
 * Đánh dấu đã gửi báo cáo cho phụ huynh.
 *
 * Đây là một BƯỚC RIÊNG do người bấm, không tự động — kể cả khi nội dung do AI
 * viết (giả định A13 trong PROJECT_PLAN.md). Quá hạn mà chưa bấm sẽ sinh cảnh
 * báo qua fn_alert_not_sent_to_parent.
 */
export async function markReportSentToParent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()

  const reportId = String(formData.get('report_id') ?? '')
  if (!z.string().uuid().safeParse(reportId).success) {
    return { ok: false, error: 'Thiếu mã báo cáo.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teaching_reports')
    .update({ sent_to_parent_at: new Date().toISOString(), sent_to_parent_by: user.id })
    .eq('id', reportId)
    .select('lesson_id')
    .maybeSingle()

  if (error) return { ok: false, error: friendlyDbError(error.message) }
  if (!data) return { ok: false, error: 'Không tìm thấy báo cáo, hoặc bạn không có quyền.' }

  revalidatePath('/reports')
  revalidatePath(`/reports/${data.lesson_id}`)
  return { ok: true, message: 'Đã ghi nhận gửi phụ huynh.' }
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

/** Dùng chung từ điển với giao diện để thông báo và cảnh báo không nói lệch nhau. */
function labelOf(field: string): string {
  return (MISSING_FIELD[field] ?? field).toLowerCase()
}

const aiDraftSchema = z.object({
  lesson_id: z.string().uuid(),
  transcript: z.string().max(40000).optional(),
})

/**
 * Kết quả soạn nháp: kèm luôn nội dung để biểu mẫu điền ngay vào các ô, khỏi
 * phải tải lại trang và mất những gì giáo viên đang gõ dở.
 */
export type AIDraftResult =
  | { ok: true; message: string; draft: FeedbackDraft }
  | { ok: false; error: string }

/**
 * Nhờ AI soạn NHÁP nhận xét cho một buổi học (D6).
 *
 * Ba điều cố ý làm chặt:
 *
 *   · Kết quả là **bản nháp** ghi vào báo cáo, KHÔNG gửi phụ huynh. Gửi phụ
 *     huynh vẫn là một bước riêng do người bấm (giả định A13).
 *   · Chỉ gửi ra dịch vụ ngoài những gì cần để viết nhận xét: tên gọi, tuổi,
 *     tên lớp, nội dung buổi học. Họ tên đầy đủ, số điện thoại, thông tin phụ
 *     huynh và mọi số liệu tài chính không rời khỏi hệ thống.
 *   · Không có nguồn nghe được thì trích dẫn và timestamp bị xoá ở phía máy
 *     chủ, kể cả khi model cố điền (`enforceNoFabrication`).
 *
 * Hai tiêu chí "đủ sâu" KHÔNG được AI tự bật — vẫn do Founder chấm, và trigger
 * `trg_guard_qc_verdict` chặn ở tầng cơ sở dữ liệu.
 */
export async function draftFeedbackWithAI(
  lessonId: string,
  transcript: string,
): Promise<AIDraftResult> {
  const user = await requireUser()

  const parsed = aiDraftSchema.safeParse({
    lesson_id: lessonId,
    transcript: transcript.trim() || undefined,
  })
  if (!parsed.success) return { ok: false, error: 'Thiếu mã buổi học.' }

  if (!isAIConfigured()) {
    return {
      ok: false,
      error:
        'Chưa bật tính năng AI. Founder cần tạo khoá miễn phí ở Google AI Studio rồi đặt vào biến môi trường GOOGLE_AI_API_KEY.',
    }
  }

  const supabase = await createClient()

  // RLS: giáo viên không dạy buổi này đọc không ra dòng nào ⇒ dừng ngay.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, class_id, teacher_id, lesson_date, duration_minutes, classes(name)')
    .eq('id', parsed.data.lesson_id)
    .maybeSingle()

  if (!lesson) return { ok: false, error: 'Không tìm thấy buổi học, hoặc bạn không có quyền.' }

  const [{ data: roster }, { data: report }, { data: recording }] = await Promise.all([
    supabase
      .from('class_students')
      .select('students(full_name, nickname, date_of_birth)')
      .eq('class_id', lesson.class_id)
      .eq('status', 'active')
      .limit(10),
    supabase
      .from('teaching_reports')
      .select('id, lesson_content, teacher_comments')
      .eq('lesson_id', lesson.id)
      .maybeSingle(),
    supabase
      .from('recordings')
      .select('url')
      .eq('lesson_id', lesson.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ])

  const students = (roster ?? [])
    .map(
      (r) =>
        r.students as {
          full_name: string
          nickname: string | null
          date_of_birth: string | null
        } | null,
    )
    .filter((s): s is NonNullable<typeof s> => s !== null)

  const label =
    students.length === 1
      ? studentLabelFor(students[0].full_name, students[0].nickname)
      : students.map((s) => studentLabelFor(s.full_name, s.nickname)).join(', ') || 'học viên'

  const videoUrl = recording?.url ?? ''
  const cls = lesson.classes as { name: string } | null

  const result = await draftLessonFeedback({
    studentLabel: label,
    studentAge: students.length === 1 ? ageFromBirthDate(students[0].date_of_birth) : null,
    className: cls?.name ?? '',
    lessonDate: lesson.lesson_date,
    durationMinutes: lesson.duration_minutes,
    lessonContent: report?.lesson_content ?? '',
    teacherNotes: report?.teacher_comments ?? '',
    transcript: parsed.data.transcript ?? '',
    videoUrl,
    videoSource: classifyVideoSource(videoUrl),
  })

  if (!result.ok) return { ok: false, error: result.error }

  const draft = result.draft

  // Ghi vào báo cáo. Chỉ điền những ô AI thực sự viết được, không xoá nội dung
  // giáo viên đã gõ bằng chuỗi rỗng.
  const payload: TablesUpdate<'teaching_reports'> = { authored_by: 'ai' }
  if (draft.strengths) payload.strengths = draft.strengths
  if (draft.improvements) payload.improvements = draft.improvements
  if (draft.student_quote) payload.student_quote = draft.student_quote
  if (draft.video_timestamp) payload.video_timestamp = draft.video_timestamp
  if (draft.lesson_content && !report?.lesson_content) payload.lesson_content = draft.lesson_content
  if (draft.next_lesson_recommendation) {
    payload.next_lesson_recommendation = draft.next_lesson_recommendation
  }

  const { error } = report
    ? await supabase.from('teaching_reports').update(payload).eq('id', report.id)
    : await supabase.from('teaching_reports').insert({
        ...payload,
        lesson_id: lesson.id,
        class_id: lesson.class_id,
        teacher_id: lesson.teacher_id,
        created_by: user.id,
      })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  // Mẫu câu bài tập nằm ở bảng homework, không phải báo cáo.
  if (draft.homework_sentence_patterns) {
    const { data: existing } = await supabase
      .from('homework')
      .select('id, sentence_patterns')
      .eq('lesson_id', lesson.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (existing && !existing.sentence_patterns) {
      await supabase
        .from('homework')
        .update({ sentence_patterns: draft.homework_sentence_patterns })
        .eq('id', existing.id)
    }
  }

  // Độ dài THẬT của video, để đối chiếu với giờ dạy giáo viên khai.
  //
  // Founder chốt ngày 15/09/2026: từ tháng 9 giáo viên bắt buộc ghi giờ vào và
  // giờ ra, và phải "căn cứ vào video để biết mức độ chính xác và trung thực
  // của giáo viên". Khai 60 phút mà video dài 28 phút thì con số đó cần được
  // hỏi lại — nhưng chỉ hỏi được nếu có vế thứ hai để so.
  //
  // `enforceNoFabrication` đã xoá trường này khi AI không xem được video, nên
  // tới đây còn giá trị nghĩa là AI thật sự đã mở được video.
  const giay = giayTuChuoi(draft.video_duration)
  if (giay !== null) {
    await supabase
      .from('recordings')
      .update({ duration_seconds: giay })
      .eq('lesson_id', lesson.id)
      .is('duration_seconds', null)
  }

  revalidatePath(`/reports/${lesson.id}`)
  revalidatePath('/classes')

  const notes: string[] = ['AI đã viết bản nháp — hãy đọc lại và sửa trước khi gửi phụ huynh.']
  if (result.dropped.length > 0) {
    notes.push(
      `Chưa điền được ${result.dropped.join(' và ')} vì không có bản ghi lời thoại và không mở được video. Dán transcript rồi bấm lại, hoặc tự điền.`,
    )
  }
  if (draft.source_note) notes.push(draft.source_note)

  return { ok: true, message: notes.join(' '), draft }
}

/** Tuổi tính theo năm tròn. Trả null khi chưa có ngày sinh. */
function ageFromBirthDate(value: string | null): number | null {
  if (!value) return null
  const born = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let age = now.getUTCFullYear() - born.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - born.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1
  return age >= 0 && age < 120 ? age : null
}

/* -------------------------------------------------------------------------
 * XÁC MINH BUỔI HỌC TỪ VIDEO — thay cho script chạy tay.
 *
 * Cô Ngọc, 22/09/2026: gộp về một đường AI duy nhất.
 *
 * Trước đây việc này nằm ở scripts/phan-tich-video/phan-tich.mjs: biến môi
 * trường riêng, model riêng, và phải mở máy chạy lệnh. Giờ là một nút bấm,
 * dùng đúng khoá GOOGLE_AI_API_KEY đã có sẵn cho chức năng soạn nháp nhận xét.
 *
 * HAI ĐIỀU CỐ Ý GIỮ CHẶT
 *   · Kết quả KHÔNG ghi đè duration_minutes. Lương giáo viên và học phí phụ
 *     huynh vẫn tính theo số giáo viên khai. Máy chỉ cho thấy độ lệch; đổi tiền
 *     là quyết định của người.
 *   · Chỉ điền vào ô còn trống. Giáo viên đã mô tả không khí lớp rồi thì máy
 *     không được xoá đi (thực hiện bằng coalesce trong fn_ghi_xac_minh).
 * ---------------------------------------------------------------------- */

export type XacMinhActionResult =
  | { ok: true; message: string; canhBao: string[] }
  | { ok: false; error: string }

export async function xacMinhBuoiHoc(lessonId: string): Promise<XacMinhActionResult> {
  await requireFounder()

  if (!isAIConfigured()) {
    return {
      ok: false,
      error:
        'Chưa bật tính năng AI. Tạo khoá miễn phí ở Google AI Studio rồi đặt vào biến môi trường GOOGLE_AI_API_KEY.',
    }
  }

  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, lesson_date, duration_minutes, classes(name)')
    .eq('id', lessonId)
    .maybeSingle()

  if (!lesson) return { ok: false, error: 'Không tìm thấy buổi học.' }

  const { data: recordings } = await supabase
    .from('recordings')
    .select('url')
    .eq('lesson_id', lessonId)
    .eq('status', 'active')

  // Gemini đọc được YouTube vì Google tự tải từ phía họ. Zoom Clips là link
  // riêng tư nên không dịch vụ nào lấy được — lọc ra trước để báo cho đúng
  // thay vì gọi rồi nhận lỗi khó hiểu.
  const youtube = (recordings ?? [])
    .map((r) => r.url)
    .filter((url): url is string => classifyVideoSource(url) === 'youtube')

  if (youtube.length === 0) {
    return {
      ok: false,
      error:
        'Buổi này chưa có video YouTube. Zoom Clips là link riêng tư nên không dịch vụ nào tải về được — nhờ giáo viên tải bản ghi lên YouTube, để chế độ Unlisted là đủ.',
    }
  }

  const cls = lesson.classes as { name: string } | null

  const ketQua = await xacMinhBuoiHocTuVideo({
    className: cls?.name ?? '',
    lessonDate: lesson.lesson_date,
    phutKhai: lesson.duration_minutes,
    videoUrls: youtube,
  })

  if (!ketQua.ok) return { ok: false, error: ketQua.error }

  const { error } = await supabase.rpc('fn_ghi_xac_minh', {
    p_lesson_id: lessonId,
    p_phut_thuc_te: ketQua.ketQua.phut_thuc_te,
    p_thoi_gian_hv_noi: ketQua.ketQua.thoi_gian_hv_noi,
    p_khong_khi_lop: ketQua.ketQua.khong_khi_lop || null,
    p_gian_doan: ketQua.ketQua.gian_doan.length > 0 ? ketQua.ketQua.gian_doan : null,
    p_nguon: 'gemini',
  })
  if (error) return { ok: false, error: loiTuHam(error.message) }

  const khai = lesson.duration_minutes
  const that = ketQua.ketQua.phut_thuc_te
  const lech = khai !== null && that !== null ? that - khai : null

  revalidatePath(`/reports/${lessonId}`)
  revalidatePath('/xac-minh')
  revalidatePath('/mat-xich')

  return {
    ok: true,
    canhBao: ketQua.daBo,
    message:
      that === null
        ? 'Máy đã xem video nhưng không đo được số phút. Kết quả khác đã ghi lại.'
        : `Giáo viên khai ${khai ?? '?'} phút, máy đo được ${that} phút` +
          (lech === null ? '.' : ` (lệch ${lech > 0 ? '+' : ''}${lech} phút).`) +
          ' Lương và học phí KHÔNG bị đổi — cô xem độ lệch rồi quyết.',
  }
}
