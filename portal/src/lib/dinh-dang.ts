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
