import { cn } from '@/lib/cn'

type Kind = 'info' | 'warning' | 'danger' | 'success'

const KINDS: Record<Kind, string> = {
  info: 'bg-navy-50 text-navy-800 ring-navy-200',
  warning: 'bg-amber-soft-50 text-amber-soft-700 ring-amber-soft-600/25',
  danger: 'bg-burgundy-50 text-burgundy-800 ring-burgundy-200',
  success: 'bg-sage-50 text-sage-700 ring-sage-500/25',
}

export function Alert({
  kind = 'info',
  title,
  children,
  className,
}: {
  kind?: Kind
  title?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('rounded-lg px-4 py-3 text-[0.8125rem] ring-1 ring-inset', KINDS[kind], className)}
      role={kind === 'danger' ? 'alert' : undefined}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
    </div>
  )
}
