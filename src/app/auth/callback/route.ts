import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Điểm đáp của đường dẫn mời giáo viên và đường dẫn đặt lại mật khẩu.
 *
 * Supabase gửi người dùng về đây kèm một mã dùng một lần. Đổi mã đó lấy phiên
 * đăng nhập, rồi đưa thẳng sang trang đặt mật khẩu.
 *
 * VÌ SAO KHÔNG GỬI MẬT KHẨU TẠM QUA ZALO: mật khẩu tạm đi qua tin nhắn thì nằm
 * lại vĩnh viễn trong lịch sử chat của cả hai bên, và gần như không ai đổi nó
 * sau lần đăng nhập đầu. Đường dẫn mời dùng một lần rồi hết hiệu lực, và giáo
 * viên tự đặt mật khẩu — trung tâm không bao giờ biết mật khẩu của họ.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL('/login?error=Đường dẫn đã hết hạn hoặc đã dùng rồi', request.url),
      )
    }
  } else if (token_hash && type) {
    // Đường dẫn kiểu cũ của Supabase vẫn dùng token_hash. Chấp nhận cả hai để
    // giáo viên không gặp lỗi chỉ vì bấm vào link sinh ở phiên bản khác.
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'recovery' | 'email',
    })
    if (error) {
      return NextResponse.redirect(
        new URL('/login?error=Đường dẫn đã hết hạn hoặc đã dùng rồi', request.url),
      )
    }
  } else {
    return NextResponse.redirect(new URL('/login?error=Đường dẫn không hợp lệ', request.url))
  }

  return NextResponse.redirect(new URL('/dat-mat-khau', request.url))
}
