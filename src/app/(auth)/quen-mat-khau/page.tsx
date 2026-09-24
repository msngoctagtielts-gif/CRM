import type { Metadata } from 'next'
import { QuenMatKhauForm } from './QuenMatKhauForm'

export const metadata: Metadata = { title: 'Quên mật khẩu' }

export default function QuenMatKhauPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-base font-semibold text-navy-900">
          Ms.Ngọc <span className="text-gold-600">Elite English</span>
        </p>
        <p className="mt-1 text-sm text-navy-400 italic">Thấu hiểu để dẫn lối.</p>

        <div className="mt-7">
          <h1 className="text-xl font-semibold text-navy-900">Quên mật khẩu</h1>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-500">
            Nhập email đăng nhập, hệ thống gửi một đường dẫn để đặt mật khẩu mới. Trung tâm không
            lưu mật khẩu của ai, kể cả Founder — nên không có cách nào lấy lại mật khẩu cũ, chỉ có
            thể đặt mật khẩu mới.
          </p>
        </div>

        <div className="mt-6">
          <QuenMatKhauForm />
        </div>
      </div>
    </div>
  )
}
