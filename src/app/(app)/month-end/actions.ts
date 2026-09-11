'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'
import { monthRange } from '@/lib/period'

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Chọn tháng cần chốt'),
})

/**
 * Tính lương CẢ THÁNG cho TẤT CẢ giáo viên đang hoạt động — một lần bấm.
 *
 * Nhịp của trung tâm: chốt ngày cuối tháng, trả từ mùng 1 đến mùng 3. Bấm từng
 * giáo viên một là sáu lần thao tác và dễ sót người; sót một người nghĩa là
 * người đó bị trả lương chậm.
 *
 * Kỳ lương nào đã duyệt hoặc đã trả thì `fn_build_payroll` từ chối tính lại —
 * ta bắt lỗi đó và báo là "bỏ qua", không để một kỳ đã chốt làm hỏng cả lượt.
 */
export async function buildAllPayroll(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(monthSchema, formData)
  if (!parsed.ok) return parsed

  const { from, to, label } = monthRange(parsed.data.month)
  const supabase = await createClient()

  const { data: teachers, error: teacherError } = await supabase
    .from('teachers')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  if (teacherError) return { ok: false, error: friendlyDbError(teacherError.message) }
  if (!teachers || teachers.length === 0) {
    return { ok: false, error: 'Chưa có giáo viên nào đang hoạt động.' }
  }

  const done: string[] = []
  const skipped: string[] = []

  for (const t of teachers) {
    const { error } = await supabase.rpc('fn_build_payroll', {
      p_teacher_id: t.id,
      p_period_start: from,
      p_period_end: to,
    })
    if (error) skipped.push(t.full_name)
    else done.push(t.full_name)
  }

  revalidatePath('/month-end')
  revalidatePath('/payroll')

  if (done.length === 0) {
    return {
      ok: false,
      error: `Không tính được kỳ lương nào cho tháng ${label}. Thường là do các kỳ đã được duyệt hoặc đã trả.`,
    }
  }

  const note = skipped.length > 0
    ? ` Bỏ qua ${skipped.length} người (${skipped.join(', ')}) — kỳ lương đã duyệt hoặc đã trả.`
    : ''

  return { ok: true, message: `Đã tính lương tháng ${label} cho ${done.length} giáo viên.${note}` }
}
