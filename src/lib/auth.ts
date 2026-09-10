import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'

export type AppUser = Tables<'users'>
export type RoleCode = 'founder' | 'teacher' | 'staff' | 'parent'

/**
 * Hồ sơ người dùng hiện tại, hoặc null nếu chưa đăng nhập.
 *
 * Luôn đọc từ bảng public.users (không tin vào metadata trong JWT) để Founder
 * thu hồi quyền là có hiệu lực ngay, không cần chờ token hết hạn.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) return null
  return profile
}

/** Bắt buộc đã đăng nhập; nếu chưa thì chuyển về trang đăng nhập. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Bắt buộc là Founder. Dùng cho mọi trang và server action liên quan tới tiền.
 *
 * Đây là lớp kiểm tra thứ hai — RLS trong database vẫn là hàng rào chính. Lý do
 * vẫn kiểm tra ở đây: để người dùng nhận được thông báo rõ ràng thay vì một
 * danh sách trống không hiểu vì sao.
 */
export async function requireFounder(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role_code !== 'founder') redirect('/unauthorized')
  return user
}

export async function requireRole(roles: RoleCode[]): Promise<AppUser> {
  const user = await requireUser()
  if (!roles.includes(user.role_code as RoleCode)) redirect('/unauthorized')
  return user
}

/** Bản ghi teachers ứng với tài khoản đang đăng nhập (null nếu không phải GV). */
export async function getCurrentTeacherId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  return data?.id ?? null
}

export function isFounder(user: AppUser | null): boolean {
  return user?.role_code === 'founder'
}
