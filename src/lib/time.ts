/**
 * Chuyển giá trị từ input datetime-local (không có múi giờ) sang ISO.
 *
 * Giáo viên nhập giờ theo giờ Việt Nam. Asia/Ho_Chi_Minh là UTC+7 quanh năm
 * (không có giờ mùa hè) nên việc gắn cố định +07:00 là chính xác — nếu trung tâm
 * mở rộng sang múi giờ khác thì phải thay bằng thư viện múi giờ thật.
 */
export const CENTRE_UTC_OFFSET = '+07:00'

export function localInputToISO(value: string | null | undefined): string | null {
  if (!value) return null
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/.exec(value)
  if (!match) return null
  const date = new Date(`${match[1]}T${match[2]}:00${CENTRE_UTC_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function minutesBetween(startISO: string | null, endISO: string | null): number | null {
  if (!startISO || !endISO) return null
  const diff = (Date.parse(endISO) - Date.parse(startISO)) / 60_000
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : null
}
