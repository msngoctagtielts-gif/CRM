import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 active:bg-navy-900',
  secondary:
    'bg-white text-navy-800 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 active:bg-navy-100',
  ghost: 'text-navy-600 hover:bg-navy-100 hover:text-navy-900',
  danger: 'bg-burgundy-700 text-white hover:bg-burgundy-600 active:bg-burgundy-800',
  gold: 'bg-gold-500 text-navy-900 hover:bg-gold-400 active:bg-gold-600',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[0.9375rem]',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  children,
}: {
  variant?: Variant
  size?: Size
  className?: string
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  )
}
