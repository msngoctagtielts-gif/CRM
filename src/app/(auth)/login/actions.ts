'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    redirect('/login?error=invalid')
  }

  // Founder có thể vô hiệu hoá tài khoản mà không cần xoá khỏi Supabase Auth.
  const { data: profile } = await supabase
    .from('users')
    .select('is_active, role_code')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile?.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=inactive')
  }

  revalidatePath('/', 'layout')
  const fallback = profile.role_code === 'teacher' ? '/reports' : '/dashboard'
  redirect(next && next.startsWith('/') ? next : fallback)
}
