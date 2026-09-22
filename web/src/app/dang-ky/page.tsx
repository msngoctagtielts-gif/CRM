import type { Metadata } from 'next'
import Link from 'next/link'
import { Khung } from '@/components/Khung'
import { BieuMauDangKy } from '@/components/BieuMauDangKy'

export const metadata: Metadata = {
  title: 'Đăng ký tư vấn',
  description:
    'Để lại thông tin, trung tâm gọi lại để tư vấn và xếp một buổi kiểm tra đầu vào.',
}

export default function TrangDangKy() {
  return (
    <Khung>
      <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
        <div className="mnee-label">Đăng ký</div>
        <h1 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          Để lại thông tin, chúng tôi gọi lại
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-navy-600">
          Buổi tư vấn để xem bạn đang ở đâu và nên bắt đầu từ chỗ nào — không phải buổi bán
          khoá học.
        </p>

        <div className="mt-8 rounded-lg border border-navy-100 bg-navy-50 px-5 py-4 text-sm leading-relaxed text-navy-600">
          Chưa chắc mình cần gì?{' '}
          <Link href="/thau-hieu" className="font-medium text-navy-800 underline underline-offset-4">
            Làm bài tự đánh giá tám câu
          </Link>{' '}
          trước đã — mất khoảng hai phút và cho bạn câu trả lời ngay, không cần để lại thông tin.
        </div>

        <div className="mt-10">
          <BieuMauDangKy nguon="dang_ky" hoiTuoi />
        </div>
      </div>
    </Khung>
  )
}
