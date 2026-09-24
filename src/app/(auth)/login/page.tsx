import type { Metadata } from 'next'
import Link from 'next/link'
import { login } from './actions'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams

  return (
    <div className="flex min-h-dvh flex-col bg-navy-800 lg:flex-row">
      {/* Nửa thương hiệu — ẩn trên điện thoại để form lên trên cùng */}
      <div className="hidden flex-1 flex-col justify-between p-10 lg:flex xl:p-14">
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">
            Ms.Ngọc <span className="text-gold-400">Elite English</span>
          </p>
          <p className="mt-1 text-sm text-navy-300 italic">Thấu hiểu để dẫn lối.</p>
        </div>
        <div className="max-w-md">
          <div className="h-px w-12 bg-gold-500" />
          <h1 className="mt-5 text-2xl font-semibold text-white xl:text-3xl">
            Hệ thống quản lý trung tâm
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-200">
            Học viên, lớp học, báo cáo giảng dạy, học phí và tài chính — tập trung ở một nơi.
          </p>
        </div>
        <p className="text-xs text-navy-400">
          Hệ thống nội bộ. Mọi truy cập đều được ghi nhận.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-navy-50 px-4 py-10 sm:px-8 lg:max-w-xl">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <p className="text-base font-semibold text-navy-900">
              Ms.Ngọc <span className="text-gold-600">Elite English</span>
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-navy-500 italic">Thấu hiểu để dẫn lối.</p>
          </div>

          <h2 className="mt-6 text-xl font-semibold text-navy-900 lg:mt-0">Đăng nhập</h2>
          <p className="mt-1 text-[0.8125rem] text-navy-500">
            Dùng email đã được Founder cấp quyền.
          </p>

          {error ? (
            <Alert kind="danger" className="mt-4">
              {error === 'invalid'
                ? 'Email hoặc mật khẩu không đúng.'
                : error === 'inactive'
                  ? 'Tài khoản đã bị vô hiệu hoá. Liên hệ Founder.'
                  : 'Không đăng nhập được. Vui lòng thử lại.'}
            </Alert>
          ) : null}

          <form action={login} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={next ?? ''} />
            <Field label="Email" required>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ten@vidu.com"
              />
            </Field>
            <Field label="Mật khẩu" required>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Đăng nhập
            </Button>
            <p className="text-center text-[0.8125rem]">
              <Link
                href="/quen-mat-khau"
                className="text-navy-600 underline-offset-2 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
