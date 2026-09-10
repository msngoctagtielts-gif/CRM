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
