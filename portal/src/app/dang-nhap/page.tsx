import type { Metadata } from 'next'
import { dangNhap } from './actions'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default async function DangNhapPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string }>
}) {
  const { loi } = await searchParams

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-navy-500 uppercase">
          Ms.Ngọc Elite English
        </p>
        <h1 className="mnee-rule mt-1 text-xl font-semibold text-navy-900">
          Cổng thông tin học viên
        </h1>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-navy-500">
          Xem tình hình học tập, video từng buổi và học phí của con em mình.
        </p>

        {loi ? (
          <p className="mt-4 rounded-md border border-burgundy-200 bg-burgundy-50 px-3 py-2 text-[0.8125rem] text-burgundy-800">
            {loi === 'thieu'
              ? 'Vui lòng nhập đủ email và mật khẩu.'
              : 'Email hoặc mật khẩu không đúng.'}
          </p>
        ) : null}

        <form action={dangNhap} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[0.8125rem] font-medium text-navy-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-500"
            />
          </div>
          <div>
            <label htmlFor="mat_khau" className="block text-[0.8125rem] font-medium text-navy-700">
              Mật khẩu
            </label>
            <input
              id="mat_khau"
              name="mat_khau"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900"
          >
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-navy-400">
          Tài khoản do trung tâm cấp. Chưa có tài khoản hoặc quên mật khẩu, vui lòng nhắn trực tiếp
          cho trung tâm.
        </p>
      </div>
    </div>
  )
}
