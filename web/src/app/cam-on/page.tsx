import type { Metadata } from 'next'
import Link from 'next/link'
import { Khung } from '@/components/Khung'

export const metadata: Metadata = {
  title: 'Đã nhận thông tin',
  robots: { index: false, follow: false },
}

export default async function TrangCamOn({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string }>
}) {
  const { ma } = await searchParams

  return (
    <Khung>
      <div className="mx-auto max-w-2xl px-5 py-20 sm:py-28">
        <div className="mnee-label">Đã nhận</div>
        <h1 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900">
          Cảm ơn bạn. Chúng tôi sẽ gọi lại.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-navy-600">
          Trung tâm liên hệ trong giờ làm việc. Nếu bạn cần gấp, cứ gọi thẳng cho chúng tôi.
        </p>

        {ma ? (
          <p className="mt-6 rounded-md border border-navy-100 bg-navy-50 px-4 py-3 text-sm text-navy-600">
            Mã đăng ký của bạn: <strong className="font-semibold text-navy-900">{ma}</strong>
            {' '}— nhắc mã này khi gọi sẽ nhanh hơn.
          </p>
        ) : null}

        <h2 className="mt-14 text-base font-semibold text-navy-900">
          Trong lúc chờ, đọc thử
        </h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          <li>
            <Link
              href="/kien-thuc"
              className="text-navy-700 underline underline-offset-4 hover:text-navy-900"
            >
              Thư viện kiến thức
            </Link>{' '}
            <span className="text-navy-400">— tâm lý người học, phương pháp, giao tiếp, IELTS</span>
          </li>
          <li>
            <Link
              href="/thau-hieu"
              className="text-navy-700 underline underline-offset-4 hover:text-navy-900"
            >
              Bài tự đánh giá
            </Link>{' '}
            <span className="text-navy-400">— nếu bạn chưa làm</span>
          </li>
        </ul>
      </div>
    </Khung>
  )
}
