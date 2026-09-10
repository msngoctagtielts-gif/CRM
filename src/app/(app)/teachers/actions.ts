'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

const teacherSchema = z.object({
  full_name: z.string().min(2, 'Tên giáo viên quá ngắn').max(120),
  display_name: z.string().max(80).optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  phone: z.string().max(30).optional(),
  nationality: z.string().max(60).optional(),
  hired_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bio: z.string().max(2000).optional(),
  rate_30: z.coerce.number().min(0).optional(),
  rate_60: z.coerce.number().min(0).optional(),
  rate_90: z.coerce.number().min(0).optional(),
})

export async function createTeacher(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(teacherSchema, formData)
  if (!parsed.ok) return parsed

  const { rate_30, rate_60, rate_90, ...teacher } = parsed.data
  const supabase = await createClient()

  const { data: created, error } = await supabase
    .from('teachers')
    .insert({ ...teacher, created_by: user.id })
    .select('id')
    .single()

  if (error || !created) return { ok: false, error: friendlyDbError(error?.message ?? '') }

  const rates = (
    [
      [30, rate_30],
      [60, rate_60],
      [90, rate_90],
    ] as const
  )
    .filter(([, amount]) => amount !== undefined && amount > 0)
    .map(([minutes, amount]) => ({
      teacher_id: created.id,
      scope: 'duration' as const,
      duration_minutes: minutes,
      rate_amount: amount!,
      created_by: user.id,
    }))

  if (rates.length > 0) {
    const { error: rateError } = await supabase.from('teacher_rates').insert(rates)
    if (rateError) {
      return {
        ok: false,
        error: 'Đã lưu giáo viên nhưng chưa lưu được đơn giá. Hãy thêm đơn giá lại.',
      }
    }
  }

  revalidatePath('/teachers')
  return { ok: true, message: `Đã thêm giáo viên ${teacher.full_name}.` }
}

const rateSchema = z.object({
  teacher_id: z.string().uuid(),
  duration_minutes: z.coerce.number().refine((v) => [30, 60, 90].includes(v), {
    message: 'Thời lượng chỉ nhận 30, 60 hoặc 90 phút',
  }),
  rate_amount: z.coerce.number().min(0, 'Đơn giá không được âm'),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * Thêm đơn giá mới cho giáo viên.
 *
 * Không sửa đơn giá cũ: số tiền của các buổi đã dạy đã được đóng băng trong
 * teacher_payable_lessons, nên đơn giá mới chỉ áp dụng từ effective_from.
 */
export async function addTeacherRate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(rateSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { error } = await supabase.from('teacher_rates').insert({
    teacher_id: parsed.data.teacher_id,
    scope: 'duration',
    duration_minutes: parsed.data.duration_minutes,
    rate_amount: parsed.data.rate_amount,
    effective_from: parsed.data.effective_from,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/teachers')
  return { ok: true, message: 'Đã thêm đơn giá mới.' }
}
