import type { Metadata } from 'next'
import Link from 'next/link'
import { Khung } from '@/components/Khung'
import { BAI_VIET, TEN_TRU, type TruNoiDung } from '@/noi-dung/bai-viet'

export const metadata: Metadata = {
  title: 'Thư viện kiến thức',
  description:
    'Bài viết về tâm lý người học, phương pháp phù hợp từng người, giao tiếp thực tế và IELTS. Viết để dùng được ngay, kể cả khi bạn không học ở đây.',
}

const THU_TU: TruNoiDung[] = ['tam_ly', 'phuong_phap', 'giao_tiep', 'ielts', 'phu_huynh']

export default function TrangKienThuc() {
  return (
    <Khung>
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <div className="mnee-label">Chia sẻ</div>
        <h1 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          Thư viện kiến thức
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-600">
          Mỗi bài ở đây phải dùng được ngay cả khi bạn không bao giờ đăng ký học. Bài nào không
          đạt điều đó thì chỉ còn là quảng cáo, và chúng tôi không đăng.
        </p>

        <div className="mt-14 space-y-14">
          {THU_TU.map((tru) => {
            const bai = BAI_VIET.filter((b) => b.tru === tru)
            if (bai.length === 0) return null
            return (
              <section key={tru}>
                <h2 className="mnee-label">{TEN_TRU[tru]}</h2>
                <div className="mt-4 space-y-5">
                  {bai.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/kien-thuc/${b.slug}`}
                      className="block rounded-lg border border-navy-100 px-5 py-5 transition-colors hover:border-navy-300 hover:bg-navy-50"
                    >
                      <h3 className="text-lg font-semibold leading-snug text-navy-900">
                        {b.tieuDe}
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-navy-600">
                        {b.moTa}
                      </p>
                      <p className="mt-3 text-xs text-navy-400">{b.phutDoc} phút đọc</p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </Khung>
  )
}
