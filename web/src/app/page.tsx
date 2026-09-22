import Link from 'next/link'
import { Khung } from '@/components/Khung'
import { BAI_VIET, TEN_TRU } from '@/noi-dung/bai-viet'
import { VIDEO } from '@/noi-dung/video'

const TRU = [
  {
    ten: 'Tâm lý người học',
    mo: 'Vì sao bạn biết mà không nói được, vì sao sợ sai, vì sao bỏ dở. Hiểu cơ chế thì chữa đúng chỗ.',
  },
  {
    ten: 'Phương pháp theo từng người',
    mo: 'Người bận, người mất gốc, người ngại nói, phụ huynh chọn cho con — bốn tình huống, bốn cách bắt đầu.',
  },
  {
    ten: 'Giao tiếp thực tế',
    mo: 'Những câu giữ cho hội thoại không sập khi bạn bí từ. Thứ hiếm khi được dạy nhưng dùng mỗi ngày.',
  },
  {
    ten: 'IELTS',
    mo: 'Đo trước, dồn vào kỹ năng yếu nhất, luyện theo dạng bài. Và cách nhận ra một lời hứa không giữ được.',
  },
]

export default function TrangChu() {
  const baiNoiBat = BAI_VIET.slice(0, 3)

  return (
    <Khung>
      {/* Mở đầu */}
      <section className="border-b border-navy-100 bg-navy-50">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:py-28">
          <div className="mnee-label">Ms.Ngọc Elite English</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.15] text-navy-900 sm:text-5xl">
            Thấu hiểu để dẫn lối.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-700 sm:text-xl">
            Hai người cùng trình độ, mắc ở hai chỗ khác nhau, thì phải bắt đầu khác nhau. Trước
            khi bán cho bạn một khoá học, chúng tôi muốn bạn biết mình đang mắc ở đâu.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/thau-hieu"
              className="rounded-md bg-navy-800 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
            >
              Làm bài tự đánh giá — 2 phút
            </Link>
            <Link
              href="/kien-thuc"
              className="rounded-md border border-navy-300 px-7 py-3.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-white"
            >
              Đọc thư viện kiến thức
            </Link>
          </div>

          <p className="mt-6 text-sm text-navy-500">
            Bài tự đánh giá không hỏi tên, không hỏi số điện thoại. Kết quả hiện ngay.
          </p>
        </div>
      </section>

      {/* Bốn trụ nội dung */}
      <section className="mx-auto max-w-4xl px-5 py-20">
        <h2 className="mnee-rule text-2xl font-semibold text-navy-900">
          Chúng tôi chia sẻ bốn thứ
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-navy-600">
          Tất cả đều viết để dùng được ngay, kể cả khi bạn không bao giờ học ở đây. Đó là tiêu
          chuẩn duy nhất để một bài được đăng.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {TRU.map((t) => (
            <div key={t.ten} className="rounded-lg border border-navy-100 px-6 py-6">
              <h3 className="text-base font-semibold text-navy-900">{t.ten}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-navy-600">{t.mo}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bài viết nổi bật */}
      <section className="border-y border-navy-100 bg-navy-50">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <h2 className="mnee-rule text-2xl font-semibold text-navy-900">Đọc thử</h2>
          <div className="mt-10 space-y-5">
            {baiNoiBat.map((b) => (
              <Link
                key={b.slug}
                href={`/kien-thuc/${b.slug}`}
                className="block rounded-lg border border-navy-100 bg-white px-6 py-6 transition-colors hover:border-navy-300"
              >
                <div className="mnee-label">{TEN_TRU[b.tru]}</div>
                <h3 className="mt-2 text-lg font-semibold leading-snug text-navy-900">
                  {b.tieuDe}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-navy-600">{b.moTa}</p>
              </Link>
            ))}
          </div>
          <Link
            href="/kien-thuc"
            className="mt-8 inline-block text-sm font-medium text-navy-700 underline underline-offset-4 hover:text-navy-900"
          >
            Xem tất cả bài viết →
          </Link>
        </div>
      </section>

      {/* Video — chỉ hiện khi đã có video thật */}
      {VIDEO.length > 0 ? (
        <section className="mx-auto max-w-4xl px-5 py-20">
          <h2 className="mnee-rule text-2xl font-semibold text-navy-900">Video của trung tâm</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {VIDEO.map((v) => (
              <div key={v.youtubeId}>
                <div className="aspect-video overflow-hidden rounded-lg border border-navy-100">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={v.tieuDe}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <h3 className="mt-3 text-base font-semibold text-navy-900">{v.tieuDe}</h3>
                <p className="mt-1 text-sm leading-relaxed text-navy-600">{v.moTa}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Mời đăng ký */}
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-xl border border-navy-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-navy-900">
            Muốn nghe tư vấn cho trường hợp của bạn?
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-navy-600">
            Buổi tư vấn để xem bạn đang ở đâu và nên bắt đầu từ chỗ nào. Chúng tôi không cam kết
            đầu ra theo mốc thời gian — nếu bạn nghe thấy lời hứa như vậy ở bất cứ đâu, hãy hỏi
            kỹ cách họ hoàn tiền.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dang-ky"
              className="rounded-md bg-navy-800 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
            >
              Đăng ký tư vấn
            </Link>
            <Link
              href="/thau-hieu"
              className="rounded-md border border-navy-300 px-7 py-3.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-navy-50"
            >
              Làm bài tự đánh giá trước
            </Link>
          </div>
        </div>
      </section>
    </Khung>
  )
}
