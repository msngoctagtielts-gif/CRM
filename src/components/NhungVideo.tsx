import { ExternalLink, Video } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { docBanGhi, giayTuMoc, linkNhung } from '@/lib/video'

/**
 * Trình phát video buổi học, nhúng thẳng vào màn hình báo cáo.
 *
 * VÌ SAO NHÚNG THAY VÌ ĐỂ MỘT ĐƯỜNG DẪN
 *   Trước đây muốn xem buổi học phải copy link, mở tab mới, rồi quay lại trang
 *   báo cáo để đối chiếu. Ba thao tác cho một việc, nên gần như không ai xem.
 *   Nhúng vào thì vừa xem vừa đọc nhận xét trên cùng một màn hình.
 *
 * ZOOM CLIPS KHÔNG NHÚNG ĐƯỢC. Zoom chặn bằng header X-Frame-Options; nhúng vào
 * chỉ ra một ô trắng. Nên link Zoom hiện thành nút mở tab mới, kèm câu nói rõ vì
 * sao — thà nói thật còn hơn một khung trống không giải thích được.
 */
export function NhungVideo({
  urls,
  mocThoiGian,
}: {
  urls: (string | null | undefined)[]
  /** Mốc giáo viên ghi trong báo cáo, ví dụ "12:03". Video mở đúng chỗ đó. */
  mocThoiGian?: string | null
}) {
  const banGhi = urls.map((u) => docBanGhi(u)).filter((b): b is NonNullable<typeof b> => b !== null)

  if (banGhi.length === 0) {
    return (
      <Card className="mb-5">
        <CardHeader title="Video buổi học" />
        <CardBody>
          <Alert kind="warning">
            Buổi này chưa có bản ghi nào. Nhờ giáo viên tải bản ghi lên YouTube (chế độ Unlisted là
            đủ) rồi dán link vào ô <em>Link video</em> phía dưới.
          </Alert>
        </CardBody>
      </Card>
    )
  }

  const giay = giayTuMoc(mocThoiGian)
  const youtube = banGhi.filter((b) => b.loai === 'youtube')
  const khac = banGhi.filter((b) => b.loai !== 'youtube')

  return (
    <Card className="mb-5">
      <CardHeader
        title="Video buổi học"
        description={
          youtube.length > 1
            ? `${youtube.length} phần, nối tiếp nhau trong cùng một buổi.`
            : undefined
        }
        action={
          giay !== null && youtube.length > 0 ? (
            <Badge tone="gold">Mở từ {mocThoiGian}</Badge>
          ) : undefined
        }
      />
      <CardBody className="space-y-4">
        {youtube.map((b, i) => (
          <div key={b.url}>
            {youtube.length > 1 ? <p className="mnee-label mb-1.5">Phần {i + 1}</p> : null}
            <div className="overflow-hidden rounded-lg bg-navy-950 ring-1 ring-navy-200">
              <iframe
                // Chỉ phần đầu tiên mới nhảy tới mốc thời gian. Mốc giáo viên ghi
                // luôn tính từ đầu buổi, mà buổi bắt đầu ở phần 1.
                src={linkNhung(b.videoId!, i === 0 ? giay : null)}
                title={`Bản ghi buổi học${youtube.length > 1 ? ` — phần ${i + 1}` : ''}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="aspect-video w-full max-w-full border-0"
              />
            </div>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
            >
              Mở trên YouTube <ExternalLink className="size-3" />
            </a>
          </div>
        ))}

        {khac.length > 0 ? (
          <div className={youtube.length > 0 ? 'border-t border-navy-100 pt-3' : undefined}>
            <p className="text-[0.8125rem] text-navy-600">
              {khac.length} bản ghi trên{' '}
              {khac.some((b) => b.loai === 'zoom') ? 'Zoom Clips' : 'dịch vụ khác'} — không xem trực
              tiếp tại đây được vì Zoom chặn nhúng. Bấm để mở tab mới.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {khac.map((b, i) => (
                <a
                  key={b.url}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[0.8125rem] font-medium text-navy-700 ring-1 ring-inset ring-navy-200 hover:bg-navy-50"
                >
                  <Video className="size-3.5" />
                  Bản ghi {khac.length > 1 ? i + 1 : ''}
                  <ExternalLink className="size-3 text-navy-400" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}
