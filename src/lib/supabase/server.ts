import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Supabase client cho Server Component / Server Action / Route Handler.
 *
 * Dùng ANON KEY cộng với phiên của người dùng trong cookie, nên RLS vẫn có hiệu
 * lực. Đây là client mặc định cho mọi truy vấn — không dùng service role ở đây.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
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
