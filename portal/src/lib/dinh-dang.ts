/** Định dạng tiền và ngày theo cách người Việt đọc. */

export function tien(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—'
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('vi-VN')}₫`
}

export function ngay(v: string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function so(v: number | string | null | undefined, chuSoThapPhan = 0): string {
  if (v === null || v === undefined || v === '') return '—'
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: chuSoThapPhan,
    maximumFractionDigits: chuSoThapPhan,
  })
}

/** 0 = Chủ nhật, theo quy ước `dow` của Postgres. */
export function thu(weekday: number | null | undefined): string {
  const ten = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return weekday == null ? '—' : (ten[weekday] ?? '—')
}

/** "08:00:00" → "08:00". Trả về chuỗi rỗng nếu không có giờ. */
export function gio(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : ''
}
