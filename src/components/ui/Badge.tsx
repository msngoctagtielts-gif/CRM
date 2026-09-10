import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/labels'

const TONES: Record<Tone, string> = {
  neutral: 'bg-navy-100 text-navy-700 ring-navy-200',
  success: 'bg-sage-100 text-sage-700 ring-sage-500/25',
  warning: 'bg-amber-soft-100 text-amber-soft-700 ring-amber-soft-600/25',
  danger: 'bg-burgundy-100 text-burgundy-700 ring-burgundy-300',
  info: 'bg-navy-100 text-navy-600 ring-navy-200',
  gold: 'bg-gold-100 text-gold-700 ring-gold-300',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
