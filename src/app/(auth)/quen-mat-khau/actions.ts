'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseForm, type ActionResult } from '@/lib/actions'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
})

/**
 * Gửi đường dẫn đặt lại mật khẩu.
 *
 * VÌ SAO LÚC NÀO CŨNG TRẢ VỀ CÙNG MỘT CÂU
 *   Nếu email có tài khoản thì báo "đã gửi", còn không có thì báo "email này
 *   chưa đăng ký", thì bất kỳ ai cũng dò được danh sách email đang dùng hệ
 *   thống — gõ thử từng email, cái nào báo "đã gửi" là có thật. Với một trung
 *   tâm thì đó là lộ danh sách giáo viên và phụ huynh.
 *
 *   Nên câu trả lời GIỐNG NHAU trong cả hai trường hợp. Người có tài khoản
 *   nhận được thư; người gõ nhầm email thì không nhận được gì, và đó chính là
 *   câu trả lời cho họ.
 *
 * VÌ SAO LẤY ĐỊA CHỈ TỪ REQUEST CHỨ KHÔNG CHỈ TỪ BIẾN MÔI TRƯỜNG
 *   Chức năng mời giáo viên đang dùng NEXT_PUBLIC_SITE_URL, và nếu biến đó chưa
 *   đặt thì nó rơi về http://localhost:3000 — đường dẫn trong thư sẽ trỏ về máy
 *   của chính người nhận, bấm vào không ra gì. Ở đây lấy thẳng tên miền của
 *   request đang chạy, nên chạy đúng dù biến môi trường có đặt hay không.
 */
export async function guiLinkDatLaiMatKhau(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(schema, formData)
  if (!parsed.ok) return parsed

  const h = await headers()
  const tuBienMoiTruong = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const giaoThuc = h.get('x-forwarded-proto') ?? 'https'
  const goc = tuBienMoiTruong ?? (host ? `${giaoThuc}://${host}` : null)

  if (!goc) {
    return {
      ok: false,
      error: 'Máy chủ chưa xác định được địa chỉ trang. Liên hệ người quản trị hệ thống.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${goc}/auth/callback`,
  })

  // Quá nhiều lần bấm trong thời gian ngắn là lỗi DUY NHẤT được nói thật, vì nó
  // không tiết lộ email nào có tài khoản, mà giấu đi thì người dùng cứ bấm mãi
  // và tưởng hệ thống hỏng.
  if (error && /rate limit|too many/i.test(error.message)) {
    return {
      ok: false,
      error: 'Đã gửi quá nhiều lần trong ít phút. Chờ khoảng 5 phút rồi thử lại.',
    }
  }

  return {
    ok: true,
    message:
      'Nếu email này có tài khoản trong hệ thống, thư đặt lại mật khẩu đã được gửi. Kiểm tra cả hộp thư rác. Đường dẫn trong thư dùng một lần và hết hạn sau 1 giờ.',
  }
}
