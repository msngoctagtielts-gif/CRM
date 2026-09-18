import { cn } from '@/lib/cn'

/**
 * Biểu đồ cột dựng bằng div + flex, KHÔNG dùng thư viện.
 *
 * Vì sao không dùng recharts hay chart.js: cả hai đều là component phía trình
 * duyệt, kéo theo ~100 KB tải thêm mỗi lần mở trang. Hệ thống đang chạy trên
 * máy chủ đặt ở Ohio trong khi người dùng ở Việt Nam, nên mỗi KB đều đắt. Biểu
 * đồ ở đây render sẵn trên máy chủ, gửi xuống là HTML tĩnh.
 */

export type Cot = {
  nhan: string
  /** Phần dưới của cột — ví dụ tiền trả giáo viên. */
  duoi?: number
  /** Phần trên của cột — ví dụ lợi nhuận gộp. Âm thì vẽ màu cảnh báo. */
  tren: number
}

export function BieuDoChong({
  duLieu,
  nhanDuoi,
  nhanTren,
  dinhDang,
  moTa,
  className,
}: {
  duLieu: Cot[]
  nhanDuoi: string
  nhanTren: string
  dinhDang: (v: number) => string
  moTa?: string
  className?: string
}) {
  if (duLieu.length === 0) {
    return <p className="px-4 py-6 text-sm text-navy-500">Chưa đủ dữ liệu để vẽ biểu đồ.</p>
  }

  // Một thang duy nhất cho mọi cột, nếu không thì cột cao thấp không so được.
  const dinh = Math.max(...duLieu.map((d) => Math.abs((d.duoi ?? 0) + Math.max(d.tren, 0))), 1)

  return (
    <figure className={cn('px-4 py-4', className)}>
      <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ minHeight: '11rem' }}>
        {duLieu.map((d) => {
          const duoi = d.duoi ?? 0
          const am = d.tren < 0
          const cao = ((duoi + Math.max(d.tren, 0)) / dinh) * 100
          const phanDuoi = duoi > 0 ? (duoi / (duoi + Math.max(d.tren, 0) || 1)) * 100 : 0
          return (
            <div key={d.nhan} className="flex min-w-[2.75rem] flex-1 flex-col items-center gap-1.5">
              <span className="tabular text-[0.6875rem] font-medium text-navy-700">
                {dinhDang(duoi + d.tren)}
              </span>
              <div
                className="flex w-full flex-col justify-end rounded-t-sm bg-navy-50"
                style={{ height: '8rem' }}
              >
                <div
                  className={cn(
                    'flex w-full flex-col justify-end overflow-hidden rounded-t-sm',
                    am && 'ring-1 ring-burgundy-400',
                  )}
                  style={{ height: `${Math.max(cao, 2)}%` }}
                  title={`${d.nhan}: ${dinhDang(duoi + d.tren)}`}
                >
                  <div
                    className={cn('w-full', am ? 'bg-burgundy-500' : 'bg-gold-500')}
                    style={{ height: `${100 - phanDuoi}%` }}
                  />
                  {duoi > 0 ? (
                    <div className="w-full bg-navy-700" style={{ height: `${phanDuoi}%` }} />
                  ) : null}
                </div>
              </div>
              <span className="text-[0.6875rem] text-navy-500">{d.nhan}</span>
            </div>
          )
        })}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-navy-100 pt-2.5 text-xs text-navy-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-navy-700" aria-hidden />
          {nhanDuoi}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold-500" aria-hidden />
          {nhanTren}
        </span>
        {moTa ? <span className="text-navy-400">{moTa}</span> : null}
      </figcaption>
    </figure>
  )
}

/** Biểu đồ cột một chỉ số — dùng cho số buổi, số giờ. */
export function BieuDoCot({
  duLieu,
  dinhDang,
  mau = 'navy',
  moTa,
  className,
}: {
  duLieu: { nhan: string; gt: number }[]
  dinhDang: (v: number) => string
  mau?: 'navy' | 'sage' | 'gold'
  moTa?: string
  className?: string
}) {
  if (duLieu.length === 0) {
    return <p className="px-4 py-6 text-sm text-navy-500">Chưa đủ dữ liệu để vẽ biểu đồ.</p>
  }
  const dinh = Math.max(...duLieu.map((d) => d.gt), 1)
  const MAU = { navy: 'bg-navy-700', sage: 'bg-sage-500', gold: 'bg-gold-500' }

  return (
    <figure className={cn('px-4 py-4', className)}>
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {duLieu.map((d) => (
          <div key={d.nhan} className="flex min-w-[2.75rem] flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-[0.6875rem] font-medium text-navy-700">
              {dinhDang(d.gt)}
            </span>
            <div className="flex w-full flex-col justify-end bg-navy-50" style={{ height: '6rem' }}>
              <div
                className={cn('w-full rounded-t-sm', MAU[mau])}
                style={{ height: `${Math.max((d.gt / dinh) * 100, 2)}%` }}
                title={`${d.nhan}: ${dinhDang(d.gt)}`}
              />
            </div>
            <span className="text-[0.6875rem] text-navy-500">{d.nhan}</span>
          </div>
        ))}
      </div>
      {moTa ? (
        <figcaption className="mt-3 border-t border-navy-100 pt-2.5 text-xs text-navy-400">
          {moTa}
        </figcaption>
      ) : null}
    </figure>
  )
}
