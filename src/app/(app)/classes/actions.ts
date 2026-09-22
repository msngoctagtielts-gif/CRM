'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, loiTuHam, parseForm, type ActionResult } from '@/lib/actions'

const DURATIONS = [30, 60, 90] as const

const classSchema = z.object({
  name: z.string().min(2, 'Tên lớp quá ngắn').max(120),
  program_id: z.string().uuid().optional(),
  level_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  class_type: z.enum(['one_to_one', 'one_to_two', 'small_group']).default('one_to_one'),
  max_students: z.coerce.number().int().min(1).max(30).default(1),
  default_duration_minutes: z.coerce
    .number()
    .refine((v) => (DURATIONS as readonly number[]).includes(v), 'Thời lượng chỉ nhận 30/60/90')
    .default(60),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meeting_url: z.string().url('Link lớp học không hợp lệ').optional(),
  notes: z.string().max(2000).optional(),
})

export async function createClass(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(classSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .insert({ ...parsed.data, status: 'active', created_by: user.id })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: friendlyDbError(error?.message ?? '') }

  revalidatePath('/classes')
  redirect(`/classes/${data.id}`)
}

export async function addStudentToClass(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(
    z.object({ class_id: z.string().uuid(), student_id: z.string().uuid() }),
    formData,
  )
  if (!parsed.ok) return parsed

  const supabase = await createClient()

  // Không vượt quá sĩ số: lớp 1-1 chỉ một học viên.
  const [{ data: cls }, { count }] = await Promise.all([
    supabase.from('classes').select('max_students').eq('id', parsed.data.class_id).single(),
    supabase
      .from('class_students')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', parsed.data.class_id)
      .eq('status', 'active'),
  ])

  if (cls && (count ?? 0) >= cls.max_students) {
    return {
      ok: false,
      error: `Lớp đã đủ sĩ số (${cls.max_students}). Tăng sĩ số tối đa trước khi thêm học viên.`,
    }
  }

  const { error } = await supabase.from('class_students').insert({
    class_id: parsed.data.class_id,
    student_id: parsed.data.student_id,
    created_by: user.id,
  })

  if (error) {
    return {
      ok: false,
      error: /duplicate|unique/i.test(error.message)
        ? 'Học viên này đã có trong lớp.'
        : friendlyDbError(error.message),
    }
  }

  revalidatePath(`/classes/${parsed.data.class_id}`)
  return { ok: true, message: 'Đã thêm học viên vào lớp.' }
}

export async function addSchedule(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(
    z.object({
      class_id: z.string().uuid(),
      weekday: z.coerce.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ không hợp lệ'),
      duration_minutes: z.coerce
        .number()
        .refine((v) => (DURATIONS as readonly number[]).includes(v), 'Thời lượng chỉ nhận 30/60/90'),
      effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
    formData,
  )
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { error } = await supabase.from('class_schedules').insert({
    ...parsed.data,
    start_time: `${parsed.data.start_time}:00`,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath(`/classes/${parsed.data.class_id}`)
  return { ok: true, message: 'Đã thêm lịch học định kỳ.' }
}

/**
 * Sinh các buổi học từ lịch định kỳ cho một khoảng ngày.
 *
 * Trùng buổi được bỏ qua nhờ ràng buộc unique (class_id, scheduled_start_at),
 * nên chạy lại nhiều lần là an toàn.
 */
export async function generateLessons(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(
    z.object({
      class_id: z.string().uuid(),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    formData,
  )
  if (!parsed.ok) return parsed
  if (parsed.data.from > parsed.data.to) {
    return { ok: false, error: 'Ngày bắt đầu phải trước ngày kết thúc.' }
  }

  const supabase = await createClient()
  const [{ data: cls }, { data: schedules }] = await Promise.all([
    supabase.from('classes').select('id, teacher_id').eq('id', parsed.data.class_id).single(),
    supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', parsed.data.class_id)
      .eq('status', 'active'),
  ])

  if (!cls) return { ok: false, error: 'Không tìm thấy lớp học.' }
  if (!schedules || schedules.length === 0) {
    return { ok: false, error: 'Lớp chưa có lịch học định kỳ. Thêm lịch trước khi sinh buổi học.' }
  }

  const rows: {
    class_id: string
    teacher_id: string | null
    lesson_date: string
    scheduled_start_at: string
    scheduled_end_at: string
    created_by: string
  }[] = []

  const fromMs = Date.parse(`${parsed.data.from}T00:00:00Z`)
  const toMs = Date.parse(`${parsed.data.to}T00:00:00Z`)

  for (let ms = fromMs; ms <= toMs; ms += 86_400_000) {
    const date = new Date(ms)
    const day = date.toISOString().slice(0, 10)
    const weekday = date.getUTCDay()

    for (const s of schedules) {
      if (s.weekday !== weekday) continue
      if (s.effective_from > day) continue
      if (s.effective_to && s.effective_to < day) continue

      // Giờ trong lịch là giờ Việt Nam (UTC+7, không có giờ mùa hè).
      const start = new Date(`${day}T${s.start_time}+07:00`)
      const end = new Date(start.getTime() + s.duration_minutes * 60_000)

      rows.push({
        class_id: cls.id,
        teacher_id: cls.teacher_id,
        lesson_date: day,
        scheduled_start_at: start.toISOString(),
        scheduled_end_at: end.toISOString(),
        created_by: user.id,
      })
    }
  }

  if (rows.length === 0) {
    return { ok: false, error: 'Không có buổi nào khớp lịch trong khoảng ngày đã chọn.' }
  }

  // ignoreDuplicates: chạy lại không tạo buổi trùng.
  const { error, count } = await supabase
    .from('lessons')
    .upsert(rows, { onConflict: 'class_id,scheduled_start_at', ignoreDuplicates: true, count: 'exact' })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath(`/classes/${parsed.data.class_id}`)
  revalidatePath('/lessons')
  return {
    ok: true,
    message: `Đã tạo ${count ?? 0} buổi học mới (bỏ qua các buổi đã có).`,
  }
}

/* -------------------------------------------------------------------------
 * SỬA lớp. KHÔNG CÓ XOÁ.
 *
 * Một lớp gắn với toàn bộ lịch sử buổi học, học phí đã trừ và lương đã trả.
 * Xoá lớp là mất lịch sử đó. Lớp không còn dạy nữa thì đổi trạng thái — số liệu
 * cũ vẫn tra cứu được, báo cáo tài chính các tháng trước vẫn đúng.
 * ---------------------------------------------------------------------- */

const suaLopSchema = z.object({
  class_id: z.string().uuid(),
  name: z.string().trim().min(2, 'Tên lớp quá ngắn').max(120).optional(),
  class_code: z.string().trim().max(40).optional(),
  teacher_id: z.string().uuid().optional(),
  // Đúng theo enum class_status trong cơ sở dữ liệu: draft, active, paused,
  // completed, cancelled. (Đã kiểm ngày 22/09/2026 — không có 'planned'.)
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  meeting_url: z.string().trim().url('Link phòng học không hợp lệ').optional(),
  notes: z.string().max(2000).optional(),
  ly_do: z.string().trim().min(5, 'Lý do phải có ít nhất 5 ký tự').max(500),
})

export async function suaLop(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(suaLopSchema, formData)
  if (!parsed.ok) return parsed

  const d = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_sua_lop', {
    p_class_id: d.class_id,
    p_name: d.name ?? null,
    p_class_code: d.class_code ?? null,
    p_teacher_id: d.teacher_id ?? null,
    p_status: d.status ?? null,
    p_meeting_url: d.meeting_url ?? null,
    p_notes: d.notes ?? null,
    p_ly_do: d.ly_do,
  })
  if (error) return { ok: false, error: loiTuHam(error.message) }

  revalidatePath('/classes')
  revalidatePath(`/classes/${d.class_id}`)
  return { ok: true, message: 'Đã sửa thông tin lớp và ghi vào nhật ký.' }
}
