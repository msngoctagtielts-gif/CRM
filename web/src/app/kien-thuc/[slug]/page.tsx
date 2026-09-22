import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Khung } from '@/components/Khung'
import { ChuInline } from '@/components/ChuInline'
import { BAI_VIET, TEN_TRU, timBaiViet } from '@/noi-dung/bai-viet'

export function generateStaticParams() {
  return BAI_VIET.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const bai = timBaiViet(slug)
  if (!bai) return { title: 'Không tìm thấy bài viết' }
  return { title: bai.tieuDe, description: bai.moTa }
}

export default async function TrangBaiViet({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const bai = timBaiViet(slug)
  if (!bai) notFound()

  const khac = BAI_VIET.filter((b) => b.slug !== bai.slug).slice(0, 3)

  return (
    <Khung>
      <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <div className="mnee-label">{TEN_TRU[bai.tru]}</div>
        <h1 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          {bai.tieuDe}
        </h1>
        <p className="mt-4 text-sm text-navy-400">{bai.phutDoc} phút đọc</p>

        <div className="van-ban doc-rong mt-10">
          {bai.than.map((k, i) => {
            if (k.loai === 'h2') {
              return <h2 key={i}>{k.chu}</h2>
            }
            if (k.loai === 'ul') {
              return (
                <ul key={i}>
                  {k.y.map((y, j) => (
                    <li key={j}>
                      <ChuInline chu={y} />
                    </li>
                  ))}
                </ul>
              )
            }
            if (k.loai === 'trich') {
              return (
                <blockquote
                  key={i}
                  className="my-8 border-l-2 border-gold-500 pl-5 text-lg italic leading-relaxed text-navy-700"
                >
                  {k.chu}
                </blockquote>
              )
            }
            return (
              <p key={i}>
                <ChuInline chu={k.chu} />
              </p>
            )
          })}
        </div>

        <div className="mt-14 rounded-xl border border-navy-200 bg-navy-50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-navy-900">
            Chưa rõ mình nên bắt đầu từ đâu?
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-navy-600">
            Bài tự đánh giá tám câu chỉ ra điều đang chặn bạn và ba việc làm được ngay tuần này.
            Không cần để lại thông tin mới xem được kết quả.
          </p>
          <Link
            href="/thau-hieu"
            className="mt-5 inline-block rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
          >
            Làm bài tự đánh giá
          </Link>
        </div>

        {khac.length > 0 ? (
          <section className="mt-16">
            <h2 className="mnee-label">Bài khác</h2>
            <ul className="mt-4 space-y-3">
              {khac.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/kien-thuc/${b.slug}`}
                    className="text-[15px] text-navy-700 underline underline-offset-4 hover:text-navy-900"
                  >
                    {b.tieuDe}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </Khung>
  )
}
