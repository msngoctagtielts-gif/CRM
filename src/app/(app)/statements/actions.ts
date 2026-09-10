'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'
import { monthRange } from '@/lib/period'

const buildSchema = z.object({
  enrollment_id: z.string().uuid('Chưa chọn hợp đồng'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Chọn tháng cần đối soát'),
})

/**
 * Lập (hoặc tính lại) phiếu học phí một tháng cho hợp đồng đóng cuối tháng.
 *
 * Toàn bộ phép tính nằm trong `fn_build_tuition_statement`: số buổi đã dạy
 * trong kỳ × đơn giá tại NGÀY HỌC, trừ chiết khấu tháng. Giao diện không tự
 * cộng lại, để con số trên phiếu và doanh thu đã ghi nhận không thể lệch nhau.
 */
export async function buildStatement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(buildSchema, formData)
  if (!parsed.ok) return parsed

  const { from, to } = monthRange(parsed.data.month)
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_build_tuition_statement', {
    p_enrollment_id: parsed.data.enrollment_id,
    p_period_start: from,
    p_period_end: to,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/statements')
  revalidatePath('/payments')
  return { ok: true, message: `Đã lập phiếu tháng ${parsed.data.month}.` }
}

const issueSchema = z.object({
  statement_id: z.string().uuid(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * Chốt phiếu và gửi cho phụ huynh.
 *
 * Đây là bước riêng do người bấm — hệ thống không tự gửi. Sau khi chốt, phiếu
 * vẫn tính lại được nếu có buổi bù, nhưng con số đã gửi thì phải có dấu vết.
 */
export async function issueStatement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(issueSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tuition_statements')
    .update({
      status: 'issued',
      issued_at: new Date().toISOString(),
      due_date: parsed.data.due_date ?? null,
    })
    .eq('id', parsed.data.statement_id)
    .in('status', ['draft'])
    .select('period_label')
    .maybeSingle()

  if (error) return { ok: false, error: friendlyDbError(error.message) }
  if (!data) return { ok: false, error: 'Phiếu này không còn ở trạng thái nháp.' }

  revalidatePath('/statements')
  return { ok: true, message: `Đã chốt phiếu tháng ${data.period_label ?? ''}.`.trim() }
}

const payStatementSchema = z.object({
  statement_id: z.string().uuid(),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày thu không hợp lệ'),
  method: z.enum(['cash', 'bank_transfer', 'other']),
  reference: z.string().max(120).optional(),
})

/**
 * Ghi nhận tiền thu cho một phiếu tháng.
 *
 * Vẫn là DÒNG TIỀN, không phải doanh thu — doanh thu đã được ghi nhận từ khi
 * buổi học hoàn tất. Sau khi ghi, phiếu được tính lại để cập nhật trạng thái
 * đã trả một phần / đã thu đủ.
 */
export async function payStatement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(payStatementSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { data: statement } = await supabase
    .from('tuition_statements')
    .select('id, enrollment_id, student_id, period_start, period_end, status')
    .eq('id', parsed.data.statement_id)
    .maybeSingle()

  if (!statement) return { ok: false, error: 'Không tìm thấy phiếu học phí.' }
  if (statement.status === 'cancelled') {
    return { ok: false, error: 'Phiếu đã huỷ — không ghi nhận thanh toán.' }
  }
  // fn_build_tuition_statement từ chối tính lại phiếu đã thu đủ. Phải chặn từ
  // đây, nếu không dòng thanh toán đã ghi vào rồi mà phiếu thì không cập nhật
  // được — số tiền thu và trạng thái phiếu sẽ lệch nhau.
  if (statement.status === 'paid') {
    return {
      ok: false,
      error: 'Phiếu này đã thu đủ. Nếu phụ huynh đóng thêm, ghi ở trang Thu học phí.',
    }
  }

  const { error } = await supabase.from('payments').insert({
    student_id: statement.student_id,
    enrollment_id: statement.enrollment_id,
    statement_id: statement.id,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    method: parsed.data.method,
    reference: parsed.data.reference,
    status: 'confirmed',
    recorded_by: user.id,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  // Tính lại để trạng thái phiếu bám theo số tiền đã thu.
  const { error: rebuildError } = await supabase.rpc('fn_build_tuition_statement', {
    p_enrollment_id: statement.enrollment_id,
    p_period_start: statement.period_start,
    p_period_end: statement.period_end,
  })
  if (rebuildError) return { ok: false, error: friendlyDbError(rebuildError.message) }

  revalidatePath('/statements')
  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Đã ghi nhận thanh toán cho phiếu tháng.' }
}
