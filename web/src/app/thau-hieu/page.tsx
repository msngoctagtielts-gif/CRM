import type { Metadata } from 'next'
import { Khung } from '@/components/Khung'
import { BaiTuDanhGia } from './BaiTuDanhGia'

export const metadata: Metadata = {
  title: 'Bài tự đánh giá — bạn nên bắt đầu từ đâu',
  description:
    'Tám câu hỏi để biết điều gì đang chặn bạn, và cách học phù hợp với đúng tình huống của bạn. Miễn phí, không cần để lại thông tin mới xem được kết quả.',
}

export default function TrangThauHieu() {
  return (
    <Khung>
      <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
        <div className="mnee-label">Thấu hiểu để dẫn lối</div>
        <h1 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          Bạn nên bắt đầu từ đâu?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-navy-600">
          Tám câu. Không hỏi tên, không hỏi số điện thoại. Kết quả hiện ra ngay, kèm ba việc
          bạn làm được ngay tuần này kể cả khi không học ở đây.
        </p>

        <p className="mt-4 rounded-md border border-navy-100 bg-navy-50 px-4 py-3 text-sm leading-relaxed text-navy-600">
          Đây không phải bài kiểm tra trình độ và không phải trắc nghiệm tính cách. Nó phân biệt
          các <em>tình huống học</em> khác nhau — vì cùng một trình độ, hai người mắc ở hai chỗ
          khác nhau thì phải bắt đầu khác nhau.
        </p>

        <hr className="my-10 border-navy-100" />

        <BaiTuDanhGia />
      </div>
    </Khung>
  )
}
