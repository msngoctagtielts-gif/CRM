'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, parseForm, type ActionResult } from '@/lib/actions'

/** Các cột thuộc bảng students. */
const studentCoreSchema = z.object({
  full_name: z.string().min(2, 'Tên học viên quá ngắn').max(120),
  nickname: z.string().max(60).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  address: z.string().max(250).optional(),
  program_id: z.string().uuid().optional(),
  current_level_id: z.string().uuid().optional(),
  status: z
    .enum(['lead', 'placement', 'trial', 'active', 'paused', 'completed', 'inactive'])
    .default('lead'),
  enrollment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.string().max(80).optional(),
  learning_goal: z.string().max(1000).optional(),
  learning_notes: z.string().max(4000).optional(),
})

/**
 * Biểu mẫu tạo mới còn nhận thêm thông tin phụ huynh — những trường này đi vào
 * bảng parents chứ không phải students, nên được tách riêng khỏi schema ở trên.
 */
const studentCreateSchema = studentCoreSchema.extend({
  parent_name: z.string().max(120).optional(),
  parent_phone: z.string().max(30).optional(),
  parent_email: z.string().email('Email phụ huynh không hợp lệ').optional(),
  parent_relationship: z.string().max(40).optional(),
})

export async function createStudent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireFounder()
  const parsed = parseForm(studentCreateSchema, formData)
  if (!parsed.ok) return parsed

  const { parent_name, parent_phone, parent_email, parent_relationship, ...student } = parsed.data
  const supabase = await createClient()

  const { data: created, error } = await supabase
    .from('students')
    .insert({ ...student, created_by: user.id })
    .select('id')
    .single()

  if (error || !created) return { ok: false, error: friendlyDbError(error?.message ?? '') }

  // Phụ huynh là tuỳ chọn: học viên người lớn thường không có.
  if (parent_name) {
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .insert({
        full_name: parent_name,
        phone: parent_phone,
        email: parent_email,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (parentError || !parent) {
      // Học viên đã tạo xong; báo rõ phần nào chưa lưu được thay vì im lặng.
      return {
        ok: false,
        error: 'Đã lưu học viên nhưng không lưu được thông tin phụ huynh. Hãy bổ sung lại sau.',
      }
    }

    await supabase.from('student_parents').insert({
      student_id: created.id,
      parent_id: parent.id,
      relationship: parent_relationship ?? 'parent',
      is_primary: true,
      created_by: user.id,
    })
  }

  revalidatePath('/students')
  redirect(`/students/${created.id}`)
}

export async function updateStudent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireFounder()
  const id = String(formData.get('id') ?? '')
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Thiếu mã học viên.' }

  const parsed = parseForm(studentCoreSchema.partial(), formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const { error } = await supabase.from('students').update(parsed.data).eq('id', id)
  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath(`/students/${id}`)
  revalidatePath('/students')
  return { ok: true, message: 'Đã lưu thay đổi.' }
}
