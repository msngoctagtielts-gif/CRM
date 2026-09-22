import 'server-only'

import { createClient as taoClient } from '@supabase/supabase-js'

/**
 * Client Supabase của website công khai.
 *
 * Không có phiên đăng nhập, không đọc cookie, KHÔNG bao giờ có service role
 * key. Website này chạy bằng vai `anon`, mà `anon` đã bị migration 0011 thu hồi
 * quyền trên mọi bảng. Toàn bộ thứ nó làm được với cơ sở dữ liệu là gọi đúng
 * một hàm: `dang_ky_tu_van`.
 *
 * Nghĩa là kể cả khi khoá anon key lộ ra ngoài — mà nó vốn công khai trong mã
 * trình duyệt của mọi dự án Supabase — người cầm khoá cũng không đọc được một
 * dòng dữ liệu nào của trung tâm.
 */
export function taoClientCongKhai() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return taoClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
