'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'
import { monthRange } from '@/lib/period'

const buildSchema = z.object({
  teacher_id: z.string().uuid('Chưa chọn giáo viên'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Chọn tháng cần tính lương'),
})

/**
 * Tính (hoặc tính lại) bảng lương một tháng cho một giáo viên.
 *
 * Lương KHÔNG bao giờ nhập tay theo từng buổi. `fn_build_payroll` gom các buổi
 * đã đủ điều kiện trong kỳ; số tiền của mỗi buổi đã được đóng băng từ lúc sinh
 * dòng nên đổi đơn giá về sau không làm sai lương cũ.
 */
export async function buildPayroll(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(buildSchema, formData)
  if (!parsed.ok) return parsed

  const { from, to, label } = monthRange(parsed.data.month)
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_build_payroll', {
    p_teacher_id: parsed.data.teacher_id,
    p_period_start: from,
    p_period_end: to,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/payroll')
  return { ok: true, message: `Đã tính bảng lương tháng ${label}.` }
}

const statusSchema = z.object({
  payroll_id: z.string().uuid(),
  status: z.enum(['pending_review', 'approved', 'paid']),
  paid_method: z.enum(['cash', 'bank_transfer', 'other']).optional(),
})

/**
 * Chuyển trạng thái kỳ lương: nháp → chờ duyệt → đã duyệt → đã trả.
 *
 * Trigger `tg_payroll_guard` mới là chốt chặn thật: chỉ Founder được duyệt, và
 * không thể nhảy thẳng sang "đã trả" khi chưa duyệt. Kiểm tra ở đây chỉ để báo
 * lỗi cho người dùng bằng tiếng Việt trước khi chạm database.
 */
export async function setPayrollStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(statusSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data: current } = await supabase
    .from('teacher_payroll')
    .select('status')
    .eq('id', parsed.data.payroll_id)
    .maybeSingle()

  if (!current) return { ok: false, error: 'Không tìm thấy kỳ lương.' }
  if (parsed.data.status === 'paid' && current.status !== 'approved') {
    return { ok: false, error: 'Phải duyệt kỳ lương trước khi đánh dấu đã trả.' }
  }

  const { error } = await supabase
    .from('teacher_payroll')
    .update({
      status: parsed.data.status,
      paid_method: parsed.data.status === 'paid' ? (parsed.data.paid_method ?? null) : null,
    })
    .eq('id', parsed.data.payroll_id)

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${parsed.data.payroll_id}`)
  revalidatePath('/dashboard')

  const message =
    parsed.data.status === 'approved'
      ? 'Đã duyệt kỳ lương.'
      : parsed.data.status === 'paid'
        ? 'Đã đánh dấu trả lương.'
        : 'Đã chuyển sang chờ duyệt.'
  return { ok: true, message }
}

const adjustmentSchema = z.object({
  payroll_id: z.string().uuid(),
  kind: z.enum(['bonus', 'allowance', 'deduction', 'correction']),
  description: z.string().min(1, 'Ghi rõ lý do điều chỉnh').max(500),
  amount: z.coerce.number().refine((v) => v !== 0, 'Số tiền phải khác 0'),
})

/**
 * Thêm một khoản cộng/trừ vào kỳ lương.
 *
 * Số âm là trừ. Trigger `trg_adjustments_recalc` tự cộng lại tổng nên giao diện
 * không tự tính, tránh lệch với con số Founder duyệt.
 */
export async function addPayrollAdjustment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(adjustmentSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data: payroll } = await supabase
    .from('teacher_payroll')
    .select('status')
    .eq('id', parsed.data.payroll_id)
    .maybeSingle()

  if (!payroll) return { ok: false, error: 'Không tìm thấy kỳ lương.' }
  if (payroll.status === 'approved' || payroll.status === 'paid') {
    return { ok: false, error: 'Kỳ lương đã duyệt — không thêm điều chỉnh được nữa.' }
  }

  // Khoản trừ luôn mang dấu âm dù Founder gõ số dương, để tổng cộng đúng chiều.
  const signed =
    parsed.data.kind === 'deduction'
      ? -Math.abs(parsed.data.amount)
      : parsed.data.amount

  const { error } = await supabase.from('teacher_payroll_adjustments').insert({
    payroll_id: parsed.data.payroll_id,
    kind: parsed.data.kind,
    description: parsed.data.description,
    amount: signed,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath(`/payroll/${parsed.data.payroll_id}`)
  return { ok: true, message: 'Đã thêm khoản điều chỉnh.' }
}
