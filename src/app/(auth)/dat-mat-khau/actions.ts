'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseForm, type ActionResult } from '@/lib/actions'

const schema = z
  .object({
    mat_khau: z.string().min(10, 'Mật khẩu phải có ít nhất 10 ký tự'),
    nhap_lai: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.mat_khau !== v.nhap_lai) {
      ctx.addIssue({ code: 'custom', message: 'Hai lần nhập không khớp', path: ['nhap_lai'] })
    }
  })

/**
 * Giáo viên tự đặt mật khẩu sau khi bấm vào đường dẫn mời.
 *
 * Tối thiểu 10 ký tự — hệ thống này chứa dữ liệu học viên và báo cáo giảng dạy,
 * nên không nhận mật khẩu 6 ký tự như mặc định của Supabase.
 */
export async function datMatKhau(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(schema, formData)
  if (!parsed.ok) return parsed

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      error: 'Phiên đã hết hạn. Bấm lại đường dẫn mời, hoặc xin trung tâm gửi đường dẫn mới.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.mat_khau })
  if (error) {
    return { ok: false, error: 'Không đặt được mật khẩu. Thử lại hoặc xin đường dẫn mới.' }
  }

  redirect('/lessons')
}
