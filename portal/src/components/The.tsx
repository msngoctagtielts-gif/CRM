/** Vài khối trình bày dùng lại trong cổng. Cố ý viết riêng, không mượn của hệ quản trị. */

export function The({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-navy-100 bg-white shadow-[0_1px_2px_rgba(27,42,74,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function TheDau({ tieuDe, moTa }: { tieuDe: string; moTa?: string }) {
  return (
    <div className="border-b border-navy-100 px-4 py-3.5 sm:px-5">
      <h2 className="text-[0.9375rem] font-semibold text-navy-900">{tieuDe}</h2>
      {moTa ? <p className="mt-0.5 text-[0.8125rem] text-navy-500">{moTa}</p> : null}
    </div>
  )
}

export function TheThan({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-4 sm:px-5 ${className}`}>{children}</div>
}

const NHAN_MAU = {
  xanh: 'bg-sage-50 text-sage-700 border-sage-100',
  lam: 'bg-navy-50 text-navy-700 border-navy-200',
  vang: 'bg-amber-soft-50 text-amber-soft-700 border-amber-soft-100',
  xam: 'bg-navy-50 text-navy-500 border-navy-200',
} as const

export function Nhan({ mau = 'xam', children }: { mau?: keyof typeof NHAN_MAU; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${NHAN_MAU[mau]}`}>
      {children}
    </span>
  )
}
