import { cn } from '@/lib/cn'

/**
 * Bảng dữ liệu. Bọc trong vùng cuộn ngang riêng để trang không bao giờ bị
 * cuộn ngang trên điện thoại.
 */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className={cn('min-w-full border-collapse text-sm', className)}>{children}</table>
      </div>
    </div>
  )
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-navy-100 bg-navy-50/60 px-3 py-2.5 text-[0.6875rem] font-semibold tracking-wider text-navy-500 uppercase whitespace-nowrap first:pl-4 last:pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={cn(
        'border-b border-navy-100/70 px-3 py-3 text-navy-800 first:pl-4 last:pr-4',
        align === 'right' && 'text-right tabular',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-navy-700">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] text-navy-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
