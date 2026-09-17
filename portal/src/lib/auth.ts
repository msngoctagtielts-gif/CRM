import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export type NguoiDung = {
  id: string
  email: string | null
  full_name: string | null
  role_code: string
}

/**
 * Người đang đăng nhập cổng.
 *
 * Cổng chỉ phục vụ vai trò 'parent' — tài khoản của phụ huynh và của học viên
 * người lớn. Founder, giáo viên và nhân viên có hệ quản trị riêng ở tên miền
 * khác; nếu họ đăng nhập vào đây thì cũng không thấy gì, vì bốn view của cổng
 * lọc theo tài khoản, nhưng chặn ở đây để họ biết mình vào nhầm cửa.
 */
export async function layNguoiDung(): Promise<NguoiDung | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, email, full_name, role_code')
    .eq('id', user.id)
    .maybeSingle()

  if (!data) return null
  return data as NguoiDung
}

export async function batBuocDangNhap(): Promise<NguoiDung> {
  const user = await layNguoiDung()
  if (!user) redirect('/dang-nhap')
  if (user.role_code !== 'parent') redirect('/khong-dung-cua')
  return user
}
