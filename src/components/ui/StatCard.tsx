import Link from 'next/link'
import { cn } from '@/lib/cn'

type Accent = 'navy' | 'gold' | 'burgundy' | 'sage'

const ACCENTS: Record<Accent, string> = {
  navy: 'text-navy-900',
  gold: 'text-gold-700',
  burgundy: 'text-burgundy-700',
  sage: 'text-sage-700',
}

const BARS: Record<Accent, string> = {
  navy: 'bg-navy-800',
  gold: 'bg-gold-500',
  burgundy: 'bg-burgundy-700',
  sage: 'bg-sage-500',
}

/**
 * Thẻ số liệu cho dashboard. `caption` dùng để nói rõ con số này là gì —
 * ví dụ phân biệt "tiền mặt đã thu" với "doanh thu ghi nhận".
 *
 * `href` biến thẻ thành liên kết sang màn hình chi tiết. Cô Ngọc: "tôi thấy
 * doanh thu, tôi muốn gõ vào xem chi tiết nhưng nó không có liên kết". Một con
 * số không bấm được thì Founder phải tự đoán nó từ đâu ra — và tự đi tìm.
 */
export function StatCard({
  label,
  value,
  caption,
  accent = 'navy',
  className,
  href,
  hrefLabel,
}: {
  label: string
  value: React.ReactNode
  caption?: React.ReactNode
  accent?: Accent
  className?: string
  href?: string
  /** Gợi ý màn hình đích, hiện khi rê chuột. Ví dụ "Xem từng tháng". */
  hrefLabel?: string
}) {
  const noiDung = (
    <>
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', BARS[accent])} aria-hidden />
      <p className="mnee-label">{label}</p>
      <p className={cn('tabular mt-1.5 text-xl font-semibold sm:text-2xl', ACCENTS[accent])}>
        {value}
      </p>
      {caption ? <p className="mt-0.5 text-xs text-navy-400">{caption}</p> : null}
      {href ? (
        <p className="mt-1.5 text-xs font-medium text-navy-500 group-hover:text-navy-800">
          {hrefLabel ?? 'Xem chi tiết'} <span aria-hidden>→</span>
        </p>
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'mnee-card group relative block overflow-hidden px-4 py-3.5 transition',
          'hover:border-navy-300 hover:shadow-sm',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600',
          className,
        )}
      >
        {noiDung}
      </Link>
    )
  }

  return (
    <div className={cn('mnee-card relative overflow-hidden px-4 py-3.5', className)}>{noiDung}</div>
  )
}
