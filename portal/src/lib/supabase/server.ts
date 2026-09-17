import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Supabase client của cổng.
 *
 * CHỈ dùng anon key cộng phiên người dùng trong cookie. Cổng KHÔNG có và KHÔNG
 * bao giờ được có service role key: không có biến môi trường nào để đặt nó, nên
 * kể cả sau này ai đó muốn "đi tắt" cũng không đi được.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Gọi từ Server Component: Next.js không cho ghi cookie ở đây.
            // middleware.ts đã làm mới phiên nên bỏ qua là an toàn.
          }
        },
      },
    },
  )
}
