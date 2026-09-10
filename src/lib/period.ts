/**
 * Bộ lọc khoảng thời gian dùng chung cho dashboard và các báo cáo tài chính.
 * Mọi mốc ngày đều tính theo múi giờ trung tâm (Asia/Ho_Chi_Minh).
 */

export const PERIOD_KEYS = [
  'today',
  'week',
  'month',
  'last_month',
  'quarter',
  'year',
  'custom',
] as const

export type PeriodKey = (typeof PERIOD_KEYS)[number]

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  today: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
  last_month: 'Tháng trước',
  quarter: 'Quý này',
  year: 'Năm nay',
  custom: 'Tuỳ chọn',
}

export type Period = { key: PeriodKey; from: string; to: string; label: string }

const TZ = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Ho_Chi_Minh'

function localParts(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(d)
  const get = (t: string) => p.find((x) => x.type === t)!.value
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'),
  }
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/**
 * Dựng khoảng thời gian từ tham số URL.
 * `from`/`to` chỉ được dùng khi key = 'custom'.
 */
export function resolvePeriod(
  key?: string | null,
  from?: string | null,
  to?: string | null,
): Period {
  const k: PeriodKey = (PERIOD_KEYS as readonly string[]).includes(key ?? '')
    ? (key as PeriodKey)
    : 'month'

  const now = new Date()
  const { year, month, day, weekday } = localParts(now)

  if (k === 'custom') {
    const f = isISODate(from) ? from! : iso(year, month, 1)
    const t = isISODate(to) ? to! : iso(year, month, day)
    // Người dùng chọn ngược thì tự đảo lại thay vì trả về khoảng rỗng.
    const [a, b] = f <= t ? [f, t] : [t, f]
    return { key: k, from: a, to: b, label: `${a} → ${b}` }
  }

  switch (k) {
    case 'today':
      return { key: k, from: iso(year, month, day), to: iso(year, month, day), label: PERIOD_LABEL[k] }
    case 'week': {
      // Tuần bắt đầu từ thứ Hai theo thói quen Việt Nam.
      const dow = WEEKDAY_INDEX[weekday] ?? 1
      const back = (dow + 6) % 7
      const start = shift(year, month, day, -back)
      return { key: k, from: start, to: iso(year, month, day), label: PERIOD_LABEL[k] }
    }
    case 'last_month': {
      const m = month === 1 ? 12 : month - 1
      const y = month === 1 ? year - 1 : year
      return { key: k, from: iso(y, m, 1), to: iso(y, m, daysInMonth(y, m)), label: PERIOD_LABEL[k] }
    }
    case 'quarter': {
      const qStart = Math.floor((month - 1) / 3) * 3 + 1
      return {
        key: k,
        from: iso(year, qStart, 1),
        to: iso(year, month, day),
        label: `${PERIOD_LABEL[k]} (Q${Math.floor((month - 1) / 3) + 1})`,
      }
    }
    case 'year':
      return { key: k, from: iso(year, 1, 1), to: iso(year, month, day), label: PERIOD_LABEL[k] }
    case 'month':
    default:
      return { key: 'month', from: iso(year, month, 1), to: iso(year, month, day), label: PERIOD_LABEL.month }
  }
}

/** Khoảng liền trước, cùng độ dài — dùng để so sánh tăng/giảm. */
export function previousPeriod(period: Period): { from: string; to: string } {
  const fromMs = Date.parse(`${period.from}T00:00:00Z`)
  const toMs = Date.parse(`${period.to}T00:00:00Z`)
  const span = toMs - fromMs + 86_400_000
  return {
    from: new Date(fromMs - span).toISOString().slice(0, 10),
    to: new Date(fromMs - 86_400_000).toISOString().slice(0, 10),
  }
}

function shift(y: number, m: number, d: number, delta: number): string {
  const base = Date.UTC(y, m - 1, d) + delta * 86_400_000
  return new Date(base).toISOString().slice(0, 10)
}

function isISODate(v: string | null | undefined): boolean {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

/** Biên thời điểm (timestamptz) tương ứng với một ngày địa phương. */
export function dayBoundsUTC(period: Period): { startUTC: string; endUTC: string } {
  // Asia/Ho_Chi_Minh là UTC+7 quanh năm (không có giờ mùa hè).
  return {
    startUTC: `${period.from}T00:00:00+07:00`,
    endUTC: `${period.to}T23:59:59.999+07:00`,
  }
}
