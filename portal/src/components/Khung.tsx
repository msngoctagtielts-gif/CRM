import Link from 'next/link'
import { DangXuatNut } from './DangXuatNut'

/** Khung chung của mọi trang trong cổng, sau khi đã đăng nhập. */
export function Khung({ tenNguoiDung, children }: { tenNguoiDung: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="min-w-0 block">
            <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-navy-500 uppercase">
              Ms.Ngọc Elite English
            </p>
            <p className="text-lg font-semibold text-navy-900">Cổng thông tin học viên</p>
          </Link>
          <div className="flex items-center gap-3">
            <p className="truncate text-sm text-navy-500">{tenNguoiDung}</p>
            <DangXuatNut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        <p className="border-t border-navy-100 pt-4 text-xs leading-relaxed text-navy-400">
          Trang này chỉ hiển thị thông tin của học viên thuộc tài khoản đang đăng nhập. Mọi thắc mắc
          về học phí hoặc lịch học, vui lòng liên hệ trực tiếp trung tâm.
        </p>
      </footer>
    </div>
  )
}
