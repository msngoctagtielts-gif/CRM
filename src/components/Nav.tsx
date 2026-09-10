'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Receipt,
  School,
  Banknote,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'

type Item = { href: string; label: string; icon: React.ElementType }

const FOUNDER_NAV: { section: string; items: Item[] }[] = [
  {
    section: 'Tổng quan',
    items: [{ href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }],
  },
  {
    section: 'Học tập',
    items: [
      { href: '/students', label: 'Học viên', icon: Users },
      { href: '/teachers', label: 'Giáo viên', icon: GraduationCap },
      { href: '/classes', label: 'Lớp học', icon: School },
      { href: '/lessons', label: 'Buổi học', icon: CalendarDays },
      { href: '/reports', label: 'Báo cáo giảng dạy', icon: BookOpen },
    ],
  },
  {
    section: 'Tài chính',
    items: [
      { href: '/payments', label: 'Thu học phí', icon: Wallet },
      { href: '/statements', label: 'Phiếu học phí tháng', icon: FileText },
      { href: '/payroll', label: 'Bảng lương', icon: Banknote },
      { href: '/expenses', label: 'Chi phí', icon: Receipt },
    ],
  },
  {
    section: 'Vận hành',
    items: [
      { href: '/alerts', label: 'Cảnh báo chất lượng', icon: AlertTriangle },
      { href: '/review', label: 'Cần đối soát', icon: ClipboardCheck },
    ],
  },
]

const TEACHER_NAV: { section: string; items: Item[] }[] = [
  {
    section: 'Giảng dạy',
    items: [
      { href: '/reports', label: 'Báo cáo của tôi', icon: BookOpen },
      { href: '/classes', label: 'Lớp của tôi', icon: School },
      { href: '/students', label: 'Học viên của tôi', icon: Users },
      { href: '/payroll', label: 'Lương của tôi', icon: Banknote },
    ],
  },
]

export function Nav({
  role,
  userName,
  roleLabel,
  openAlerts,
  pendingReports,
  needsReview,
}: {
  role: string
  userName: string
  roleLabel: string
  openAlerts: number
  pendingReports: number
  needsReview: number
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const groups = role === 'founder' ? FOUNDER_NAV : TEACHER_NAV

  const badgeFor = (href: string) =>
    href === '/alerts'
      ? openAlerts
      : href === '/reports'
        ? pendingReports
        : href === '/review'
          ? needsReview
          : 0

  const links = (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.section}>
          <p className="px-3 text-[0.625rem] font-semibold tracking-[0.12em] text-navy-400 uppercase">
            {group.section}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const count = badgeFor(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-navy-700/70 font-medium text-white'
                        : 'text-navy-200 hover:bg-navy-700/40 hover:text-white',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{item.label}</span>
                    {count > 0 ? (
                      <span className="ml-auto rounded-full bg-burgundy-600 px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const brand = (
    <div className="px-3">
      <p className="text-[0.9375rem] font-semibold tracking-tight text-white">
        Ms.Ngọc <span className="text-gold-400">Elite English</span>
      </p>
      <p className="mt-0.5 text-[0.6875rem] text-navy-300 italic">Thấu hiểu để dẫn lối.</p>
    </div>
  )

  const footer = (
    <div className="border-t border-navy-700/60 px-3 pt-3">
      <p className="truncate text-[0.8125rem] font-medium text-white">{userName}</p>
      <p className="text-[0.6875rem] text-gold-400">{roleLabel}</p>
      <form action="/auth/signout" method="post" className="mt-2">
        <button
          type="submit"
          className="text-[0.75rem] text-navy-300 underline-offset-2 hover:text-white hover:underline"
        >
          Đăng xuất
        </button>
      </form>
    </div>
  )

  return (
    <>
      {/* Thanh trên cùng cho điện thoại */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy-800 px-4 py-3 lg:hidden">
        <p className="text-sm font-semibold text-white">
          Ms.Ngọc <span className="text-gold-400">Elite English</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          className="rounded-lg p-1.5 text-navy-200 hover:bg-navy-700 hover:text-white"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Ngăn trượt trên điện thoại */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-navy-950/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-5 bg-navy-800 py-4">
            <div className="flex items-start justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="rounded-lg p-1 text-navy-300 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{links}</div>
            {footer}
          </div>
        </div>
      ) : null}

      {/* Sidebar cố định trên desktop */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-navy-800 py-5 lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto">{links}</div>
        {footer}
      </aside>
    </>
  )
}
