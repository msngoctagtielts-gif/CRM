import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Không đúng cửa' }

/**
 * Tài khoản quản trị hoặc giáo viên đăng nhập nhầm vào cổng.
 *
 * Không tự chuyển sang hệ quản trị: đây là hai website riêng, cổng không được
 * biết địa chỉ bên kia. Chỉ nói rõ để người dùng tự mở đúng trang.
 */
export default function KhongDungCuaPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-navy-500 uppercase">
          Ms.Ngọc Elite English
        </p>
        <h1 className="mnee-rule mt-1 text-xl font-semibold text-navy-900">
          Tài khoản này không dùng ở đây
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-navy-600">
          Đây là cổng dành cho học viên và phụ huynh. Tài khoản của bạn thuộc hệ quản trị trung tâm
          — vui lòng mở trang quản trị để đăng nhập.
        </p>
      </div>
    </div>
  )
}
