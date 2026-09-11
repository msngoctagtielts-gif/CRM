import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

/**
 * Tham số vận hành đọc từ bảng `settings`.
 *
 * Giao diện KHÔNG được viết cứng các con số này. Hạn nộp báo cáo đã đổi từ 10
 * sang 24 giờ (DECISIONS.md D2); nếu chuỗi hiển thị viết cứng thì lần chỉnh
 * tiếp theo giao diện lại nói sai. Founder sửa trong bảng `settings`, mọi màn
 * hình đổi theo.
 *
 * `cache()` gom lại một truy vấn cho mỗi request, dù nhiều component cùng gọi.
 */
export type OperatingSettings = {
  reportDeadlineHours: number
  qcMinScore: number
  alertLessonsRemaining: number
  alertDaysNotSentParent: number
}

const FALLBACK: OperatingSettings = {
  reportDeadlineHours: 24,
  qcMinScore: 60,
  alertLessonsRemaining: 2,
  alertDaysNotSentParent: 3,
}

/**
 * Đọc tham số vận hành bằng một client cho trước.
 *
 * Tách khỏi `getOperatingSettings` vì cron job KHÔNG có phiên người dùng: gọi
 * bản user-scoped ở đó thì RLS trả 0 dòng và hàm âm thầm rơi về giá trị mặc
 * định. Lúc ấy màn hình dùng ngưỡng cô đã sửa, còn job nhắc việc dùng ngưỡng
 * cũ — hai bên đếm ra hai con số khác nhau mà không báo lỗi gì.
 */
export async function readOperatingSettings(
  supabase: SupabaseClient<Database>,
): Promise<OperatingSettings> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'report_deadline_hours',
      'qc_min_score',
      'alert_lessons_remaining',
      'alert_days_not_sent_parent',
    ])

  const map = new Map((data ?? []).map((r) => [r.key, toInt(r.value)]))

  return {
    reportDeadlineHours: map.get('report_deadline_hours') ?? FALLBACK.reportDeadlineHours,
    qcMinScore: map.get('qc_min_score') ?? FALLBACK.qcMinScore,
    alertLessonsRemaining: map.get('alert_lessons_remaining') ?? FALLBACK.alertLessonsRemaining,
    alertDaysNotSentParent:
      map.get('alert_days_not_sent_parent') ?? FALLBACK.alertDaysNotSentParent,
  }
}

/** Bản dùng trong Server Component: `cache()` gom về một truy vấn mỗi request. */
export const getOperatingSettings = cache(async (): Promise<OperatingSettings> => {
  return readOperatingSettings(await createClient())
})

/** settings.value là jsonb nên có thể về dạng số hoặc chuỗi tuỳ driver. */
function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}
