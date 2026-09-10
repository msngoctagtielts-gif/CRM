'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

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

  // Hợp đồng phải thuộc đúng học viên — tránh ghi nhận sai sổ.
  if (parsed.data.enrollment_id) {
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('id', parsed.data.enrollment_id)
      .maybeSingle()

    if (!enrollment || enrollment.student_id !== parsed.data.student_id) {
      return { ok: false, error: 'Hợp đồng học phí không thuộc học viên đã chọn.' }
    }
  }

  const { error } = await supabase.from('payments').insert({
    ...parsed.data,
    status: 'confirmed',
    recorded_by: user.id,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  revalidatePath(`/students/${parsed.data.student_id}`)
  return { ok: true, message: 'Đã ghi nhận thanh toán.' }
}

const enrollmentSchema = z
  .object({
    student_id: z.string().uuid('Chưa chọn học viên'),
    class_id: z.string().uuid().optional(),
    program_id: z.string().uuid().optional(),
    tuition_package_id: z.string().uuid().optional(),
    lessons_purchased: z.coerce.number().positive('Số buổi phải lớn hơn 0'),
    price_per_lesson: z.coerce.number().min(0, 'Đơn giá không được âm'),
    discount_amount: z.coerce.number().min(0).default(0),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    agreement_notes: z.string().max(2000).optional(),
  })
  .refine((v) => v.discount_amount <= v.lessons_purchased * v.price_per_lesson, {
    message: 'Giảm giá không thể lớn hơn tổng học phí',
    path: ['discount_amount'],
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

  const { discount_amount, ...rest } = parsed.data
  const net = rest.lessons_purchased * rest.price_per_lesson - discount_amount

  const supabase = await createClient()
  const { error } = await supabase.from('student_enrollments').insert({
    ...rest,
    discount_amount,
    net_amount: net,
    status: 'active',
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  revalidatePath(`/students/${rest.student_id}`)
  return { ok: true, message: 'Đã tạo hợp đồng học phí.' }
}
