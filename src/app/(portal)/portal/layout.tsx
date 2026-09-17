import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { DangXuatNut } from './DangXuatNut'

/**
 * Cổng thông tin cho học viên và phụ huynh.
 *
 * Khung riêng, KHÔNG dùng thanh điều hướng của hệ quản trị: menu đó chứa tài
 * chính trung tâm, lương giáo viên và hồ sơ mọi học viên. Người ngoài trung tâm
 * không được nhìn thấy cả tên những mục đó, chứ đừng nói bấm vào.
 *
 * Hàng rào thật vẫn nằm ở tầng cơ sở dữ liệu: ba view của cổng lọc cứng theo
 * tài khoản đang đăng nhập. Chỗ này chỉ để người vào đúng cửa.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  // Founder và giáo viên có màn hình riêng; vào đây cũng không thấy gì vì view
  // lọc theo tài khoản, nhưng đưa họ về đúng chỗ cho đỡ bối rối.
  if (user.role_code === 'founder') redirect('/dashboard')
  if (user.role_code === 'teacher') redirect('/reports')

  return (
    <div className="min-h-dvh">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <Link href="/portal" className="block">
              <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-navy-500 uppercase">
                Ms.Ngọc Elite English
              </p>
              <p className="mnee-rule text-lg font-semibold text-navy-900">
                Cổng thông tin học viên
              </p>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <p className="truncate text-sm text-navy-500">{user.full_name}</p>
            <DangXuatNut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-navy-400 sm:px-6">
        <p className="border-t border-navy-100 pt-4">
          Trang này chỉ hiển thị thông tin của học viên thuộc tài khoản đang đăng nhập. Mọi thắc mắc
          về học phí hoặc lịch học, vui lòng liên hệ trực tiếp trung tâm.
        </p>
      </footer>
    </div>
  )
}
