'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

const expenseSchema = z.object({
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chi không hợp lệ'),
  category: z.enum([
    'teacher_salary',
    'software',
    'marketing',
    'advertising',
    'equipment',
    'office',
    'training',
    'other',
  ]),
  description: z.string().min(2, 'Hãy mô tả khoản chi').max(500),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  method: z.enum(['cash', 'bank_transfer', 'other']),
  vendor: z.string().max(150).optional(),
  receipt_url: z.string().url('Link hoá đơn không hợp lệ').optional(),
  notes: z.string().max(1000).optional(),
})

export async function recordExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(expenseSchema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').insert({
    ...parsed.data,
    recorded_by: user.id,
    created_by: user.id,
  })

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Đã ghi nhận chi phí.' }
}
