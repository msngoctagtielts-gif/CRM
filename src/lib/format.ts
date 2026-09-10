/**
 * Định dạng hiển thị theo chuẩn Việt Nam. Giá trị tiền luôn được truyền vào
 * dưới dạng số VND nguyên (không chia 100) vì database lưu numeric(14,2).
 */

const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Ho_Chi_Minh'

export function formatCurrency(value: number | string | null | undefined): string {
  const n = toNumber(value)
  if (n === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Dạng gọn cho thẻ số liệu: 12,5 tr / 1,2 tỷ. */
export function formatCurrencyShort(value: number | string | null | undefined): string {
  const n = toNumber(value)
  if (n === null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)} tỷ`
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)} tr`
  if (abs >= 1_000) return `${trim(n / 1_000)} k`
  return new Intl.NumberFormat('vi-VN').format(n)
}

export function formatNumber(value: number | string | null | undefined, digits = 0): string {
  const n = toNumber(value)
  if (n === null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n)
}

export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE,
  }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d)
}

export function formatTime(value: string | Date | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d)
}

/** 90 → "1h30"; 60 → "60 phút". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} giờ` : `${h}h${String(m).padStart(2, '0')}`
}

/** "còn 3 giờ" / "quá hạn 5 giờ" — dùng cho hạn nộp báo cáo. */
export function formatDeadline(dueAt: string | null | undefined): {
  label: string
  overdue: boolean
  hours: number
} | null {
  if (!dueAt) return null
  const due = new Date(dueAt).getTime()
  const diffHours = (due - Date.now()) / 3_600_000
  const overdue = diffHours < 0
  const h = Math.abs(diffHours)
  const text = h < 1 ? `${Math.round(h * 60)} phút` : `${Math.floor(h)} giờ`
  return {
    label: overdue ? `Quá hạn ${text}` : `Còn ${text}`,
    overdue,
    hours: Math.abs(diffHours),
  }
}

/** Ngày hôm nay theo múi giờ trung tâm, dạng YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date())
}

/** Chuỗi datetime-local (YYYY-MM-DDTHH:mm) theo múi giờ trung tâm. */
export function toDateTimeLocal(value: string | Date | null | undefined): string {
  const d = toDate(value)
  if (!d) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function trim(n: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}
