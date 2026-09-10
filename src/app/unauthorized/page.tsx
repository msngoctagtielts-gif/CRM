import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Không có quyền truy cập' }

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-50 px-4">
      <div className="mnee-card max-w-md px-6 py-8 text-center">
        <div className="mx-auto h-px w-10 bg-gold-500" />
        <h1 className="mt-5 text-lg font-semibold text-navy-900">Không có quyền truy cập</h1>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy-500">
          Mục này chỉ dành cho Founder. Nếu bạn cho rằng đây là nhầm lẫn, liên hệ Founder để được
          cấp quyền.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-navy-800 px-4 text-sm font-medium text-white hover:bg-navy-700"
        >
          Về trang chính
        </Link>
      </div>
    </main>
  )
}
