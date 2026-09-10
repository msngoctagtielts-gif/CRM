'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Supabase client cho trình duyệt. Chỉ dùng ANON KEY — mọi truy vấn đều đi qua
 * Row Level Security nên không thể đọc dữ liệu ngoài quyền của người dùng.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
