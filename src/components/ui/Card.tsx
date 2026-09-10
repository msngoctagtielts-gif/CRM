import { cn } from '@/lib/cn'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mnee-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-navy-100 px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[0.9375rem] font-semibold text-navy-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[0.8125rem] text-navy-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function CardBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('px-4 py-4 sm:px-5', className)}>{children}</div>
}
