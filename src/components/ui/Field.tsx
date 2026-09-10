import { cn } from '@/lib/cn'

const CONTROL =
  'block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-navy-900 ring-1 ring-inset ring-navy-200 ' +
  'placeholder:text-navy-300 focus:ring-2 focus:ring-inset focus:ring-gold-500 sm:text-sm'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[0.8125rem] font-medium text-navy-700">
        {label}
        {required ? <span className="ml-0.5 text-burgundy-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-burgundy-600">{error}</p> : null}
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'min-h-24 resize-y', className)} {...props} />
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'pr-9', className)} {...props}>
      {children}
    </select>
  )
}
