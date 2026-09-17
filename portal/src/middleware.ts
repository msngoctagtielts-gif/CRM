import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Làm mới phiên Supabase và đưa người chưa đăng nhập về trang đăng nhập.
 *
 * Đây KHÔNG phải hàng rào bảo mật. Hàng rào thật nằm ở cơ sở dữ liệu: bốn view
 * của cổng lọc cứng theo tài khoản đang đăng nhập.
 */
const CONG_KHAI = ['/dang-nhap', '/khong-dung-cua', '/auth']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const congKhai = CONG_KHAI.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && !congKhai) {
    const url = request.nextUrl.clone()
    url.pathname = '/dang-nhap'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/dang-nhap') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
