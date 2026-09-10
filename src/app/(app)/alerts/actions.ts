'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFounder } from '@/lib/auth'
import { friendlyDbError, type ActionResult } from '@/lib/actions'

/** Đánh dấu đã xem / đã xử lý một cảnh báo. */
export async function updateAlertStatus(formData: FormData): Promise<void> {
  const user = await requireFounder()
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(['acknowledged', 'resolved', 'dismissed']),
    })
    .safeParse({ id: formData.get('id'), status: formData.get('status') })

  if (!parsed.success) return

  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({
      status: parsed.data.status,
      resolved_by: user.id,
      // 'acknowledged' chỉ là đã xem — chưa phải đã xử lý nên chưa đóng mốc thời gian.
      resolved_at: parsed.data.status === 'acknowledged' ? null : new Date().toISOString(),
    })
    .eq('id', parsed.data.id)

  revalidatePath('/alerts')
  revalidatePath('/dashboard')
}

/**
 * Quét lại toàn bộ buổi học quá hạn ngay lập tức.
 *
 * Bình thường việc này do cron (n8n hoặc pg_cron) gọi mỗi giờ. Nút bấm tay ở
 * đây để Founder kiểm tra ngay mà không cần chờ.
 */
export async function rescanOverdueReports(): Promise<ActionResult> {
  await requireFounder()
  const supabase = await createClient()

  const { error } = await supabase.rpc('fn_scan_overdue_reports')
  if (error) return { ok: false, error: friendlyDbError(error.message) }

  revalidatePath('/alerts')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Đã quét lại các buổi học quá hạn.' }
}
