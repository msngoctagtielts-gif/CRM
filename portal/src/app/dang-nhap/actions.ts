'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function dangNhap(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const matKhau = String(formData.get('mat_khau') ?? '')

  if (!email || !matKhau) redirect('/dang-nhap?loi=thieu')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau })

  // Không nói rõ sai email hay sai mật khẩu — nói rõ là giúp người dò tài khoản.
  if (error) redirect('/dang-nhap?loi=sai')

  redirect('/')
}
