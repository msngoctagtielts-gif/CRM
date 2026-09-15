import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DatMatKhauForm } from './DatMatKhauForm'

export const metadata: Metadata = { title: 'Đặt mật khẩu' }

export default async function DatMatKhauPage() {
  // Trang này chỉ mở được khi đã có phiên — phiên đến từ đường dẫn mời hoặc
  // đường dẫn đặt lại mật khẩu, qua /auth/callback.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=Bấm vào đường dẫn mời để đặt mật khẩu')

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-base font-semibold text-navy-900">
          Ms.Ngọc <span className="text-gold-600">Elite English</span>
        </p>
        <p className="mt-1 text-sm text-navy-400 italic">Thấu hiểu để dẫn lối.</p>

        <div className="mt-7">
          <h1 className="text-xl font-semibold text-navy-900">Đặt mật khẩu</h1>
          <p className="mt-1.5 text-[0.8125rem] text-navy-500">
            Chào {user.email}. Đặt mật khẩu riêng để bắt đầu dùng hệ thống. Trung tâm không
            biết và không lưu mật khẩu này.
          </p>
        </div>

        <div className="mt-6">
          <DatMatKhauForm />
        </div>
      </div>
    </div>
  )
}
