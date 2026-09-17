'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, type ActionResult } from '@/lib/actions'

/**
 * Tạo một bản sao lưu ngay lập tức.
 *
 * Gọi hàm fn_sao_luu_thu_cong trong CSDL — hàm đó tự kiểm tra is_founder()
 * bên trong, nên kể cả giáo viên có gọi được cũng bị chặn ở tầng cơ sở dữ liệu
 * chứ không chỉ ở tầng giao diện.
 */
export async function taoBanSaoLuu(): Promise<ActionResult> {
  await requireFounder()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_sao_luu_thu_cong')
  if (error) return { ok: false, error: friendlyDbError(error.message) }
  if (!data) {
    return {
      ok: false,
      error:
        'Dữ liệu đã vượt ngưỡng 20 MB nên không tạo bản sao trong CSDL. Xem mục Việc cần xử lý.',
    }
  }

  revalidatePath('/sao-luu')
  return { ok: true, message: 'Đã tạo bản sao lưu.' }
}
