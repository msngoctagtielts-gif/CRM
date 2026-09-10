'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

/**
 * Các bảng có cờ `needs_review`. Danh sách viết cứng chứ không nhận tên bảng
 * từ biểu mẫu — tên bảng đi thẳng từ trình duyệt vào truy vấn là lối vào để
 * ghi bừa sang bảng khác.
 */
const REVIEW_TABLES = {
  student: 'students',
  class: 'classes',
  enrollment: 'student_enrollments',
  teacher: 'teachers',
  payment: 'payments',
} as const

const resolveSchema = z.object({
  entity_type: z.enum(['student', 'class', 'enrollment', 'teacher', 'payment']),
  entity_id: z.string().uuid(),
})

/**
 * Đánh dấu một dòng di trú đã được Founder đối soát xong (D8).
 *
 * Chỉ tắt cờ và xoá ghi chú; KHÔNG tự sửa dữ liệu. Việc sửa giá trị nghi vấn
 * làm ở đúng màn hình của nó, để mọi thay đổi đều đi qua kiểm tra của biểu mẫu
 * đó và để lại dấu vết trong `audit_logs`.
 */
export async function resolveDataReview(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireFounder()
  const parsed = parseForm(resolveSchema, formData)
  if (!parsed.ok) return parsed

  const table = REVIEW_TABLES[parsed.data.entity_type]
  const supabase = await createClient()

  const { error } = await supabase
    .from(table)
    .update({ needs_review: false, review_note: null })
    .eq('id', parsed.data.entity_id)

  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/review')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Đã đánh dấu đối soát xong.' }
}
