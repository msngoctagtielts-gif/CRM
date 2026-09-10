import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Client dùng SERVICE ROLE KEY — BỎ QUA toàn bộ Row Level Security.
 *
 * QUY TẮC:
 *   1. Chỉ dùng trong cron job / webhook, nơi không có phiên người dùng.
 *   2. KHÔNG BAO GIỜ import từ Client Component. Chốt `import 'server-only'` ở
 *      trên sẽ làm build thất bại nếu ai đó vô tình làm vậy.
 *   3. Không dùng để "đi tắt" cho nhanh trong các trang thường — nó vô hiệu hoá
 *      toàn bộ hàng rào bảo mật của hệ thống.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'Thiếu SUPABASE_SERVICE_ROLE_KEY. Đặt biến môi trường này ở phía server.',
    )
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
