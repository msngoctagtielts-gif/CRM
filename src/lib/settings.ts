import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

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

export const getOperatingSettings = cache(async (): Promise<OperatingSettings> => {
  const supabase = await createClient()
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
