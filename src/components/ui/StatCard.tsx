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
 */
export function StatCard({
  label,
  value,
  caption,
  accent = 'navy',
  className,
}: {
  label: string
  value: React.ReactNode
  caption?: React.ReactNode
  accent?: Accent
  className?: string
}) {
  return (
    <div className={cn('mnee-card relative overflow-hidden px-4 py-3.5', className)}>
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', BARS[accent])} aria-hidden />
      <p className="mnee-label">{label}</p>
      <p className={cn('tabular mt-1.5 text-xl font-semibold sm:text-2xl', ACCENTS[accent])}>
        {value}
      </p>
      {caption ? <p className="mt-0.5 text-xs text-navy-400">{caption}</p> : null}
    </div>
  )
}
