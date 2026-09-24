import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Làm mới phiên Supabase trên mỗi request và chặn các route cần đăng nhập.
 *
 * Đây KHÔNG phải hàng rào bảo mật — hàng rào thật là Row Level Security trong
 * database cộng với kiểm tra trong server action. Middleware chỉ để người dùng
 * không lọt vào trang trống rồi không hiểu tại sao.
 */
/**
 * `/quen-mat-khau` PHẢI nằm ở đây. Người quên mật khẩu thì đang ĐĂNG XUẤT —
 * thiếu dòng này, middleware đá họ về /login, và nút "Quên mật khẩu?" trở thành
 * một vòng tròn không lối ra.
 *
 * `/dat-mat-khau` thì KHÔNG cần: người bấm đường dẫn trong thư đi qua
 * /auth/callback trước, nên tới trang đó là đã có phiên.
 */
const PUBLIC_PATHS = ['/login', '/quen-mat-khau', '/auth', '/unauthorized']

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
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|webp)$).*)'],
}
