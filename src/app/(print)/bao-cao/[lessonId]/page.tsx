import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration, formatTime } from '@/lib/format'
import { locGhiChuNoiBo } from '@/lib/bao-cao-in'
import { docVideoId } from '@/lib/video'
import { ThanhInAn } from './ThanhIn'

export const metadata: Metadata = { title: 'Báo cáo học tập' }

/** Đổi mốc "mm:ss" hoặc "hh:mm:ss" thành số giây để gắn vào link YouTube. */
function mocThanhGiay(moc: string | null | undefined): number | null {
  const m = (moc ?? '').trim()
  if (!/^\d{1,2}(:\d{2}){1,2}$/.test(m)) return null
  const phan = m.split(':').map(Number)
  const giay = phan.length === 3 ? phan[0] * 3600 + phan[1] * 60 + phan[2] : phan[0] * 60 + phan[1]
  return Number.isFinite(giay) && giay > 0 ? giay : null
}

/** Link xem lại, có mốc thời gian nếu báo cáo ghi rõ khoảnh khắc đáng xem. */
function linkXemLai(url: string, moc: string | null | undefined): string {
  const id = docVideoId(url)
  if (id === null) return url
  const giay = mocThanhGiay(moc)
  return giay === null ? `https://youtu.be/${id}` : `https://youtu.be/${id}?t=${giay}`
}

/** Đổi văn bản nhiều dòng thành các đoạn, giữ nguyên xuống dòng trong một đoạn. */
function Doan({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((d) => d.trim())
        .filter((d) => d !== '')
        .map((d, i) => (
          <p key={i} className="mb-2.5 whitespace-pre-line text-[10.5pt] leading-relaxed last:mb-0">
            {d}
          </p>
        ))}
    </>
  )
}

function Muc({
  so,
  tieuDe,
  children,
}: {
  so: string
  tieuDe: string
  children: React.ReactNode
}) {
  return (
    <section className="giu-nguyen-khoi mb-6">
      <h2 className="mb-2.5 flex items-baseline gap-2 border-b border-navy-100 pb-1.5 text-[11pt] font-semibold tracking-tight text-navy-900">
        <span className="in-giu-mau inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-navy-800 text-[8pt] font-bold text-white">
          {so}
        </span>
        {tieuDe}
      </h2>
      <div className="text-navy-800">{children}</div>
    </section>
  )
}

export default async function BanInBaoCao({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>
  searchParams: Promise<{ ban?: string }>
}) {
  const user = await requireUser()
  const { lessonId } = await params
  const { ban } = await searchParams
  const supabase = await createClient()

  // Bản nội bộ giữ nguyên mọi ghi chú. CHỈ Founder mới được mở — giáo viên và
  // phụ huynh mở link này vẫn chỉ thấy bản gửi phụ huynh.
  const isFounder = user.role_code === 'founder'
  const banNoiBo = isFounder && ban === 'noi-bo'

  const { data: lesson } = await supabase
    .from('v_lesson_reports')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  // RLS lo phần phạm vi: không thuộc quyền xem thì không có dòng nào.
  if (!lesson) notFound()

  const [{ data: report }, { data: homework }, { data: recordings }] = await Promise.all([
    lesson.report_id
      ? supabase.from('teaching_reports').select('*').eq('id', lesson.report_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('homework')
      .select('title, description, due_date, sentence_patterns')
      .eq('lesson_id', lessonId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('recordings')
      .select('url')
      .eq('lesson_id', lessonId)
      .eq('status', 'active')
      .order('created_at'),
  ])

  if (!report) notFound()

  // Bản gửi phụ huynh: cắt mọi đoạn ghi chú nội bộ. Xem src/lib/bao-cao-in.ts.
  const loc = (t: string | null | undefined) => (banNoiBo ? (t ?? '').trim() : locGhiChuNoiBo(t))

  const noiDung = loc(report.lesson_content)
  const diemManh = loc(report.strengths)
  const canCaiThien = loc(report.improvements)
  const buoiSau = loc(report.next_lesson_recommendation)
  const trichDan = (report.student_quote ?? '').trim()
  const nhanXetGV = loc(report.teacher_comments)

  const dsBanGhi = recordings ?? []
  const soMuc = { n: 0 }
  const tiep = () => String(++soMuc.n)

  return (
    <div className="mx-auto max-w-[190mm] px-5 py-6 print:px-0 print:py-0">
      <ThanhInAn lessonId={lessonId} isFounder={isFounder} banNoiBo={banNoiBo} />

      {/* ---------- Đầu trang ---------- */}
      <header className="giu-nguyen-khoi mb-6">
        <div className="in-giu-mau flex items-start justify-between gap-4 border-b-2 border-gold-500 pb-3">
          <div>
            <p className="text-[13pt] font-semibold tracking-tight text-navy-900">
              Ms.Ngọc Elite English
            </p>
            <p className="mt-0.5 text-[9pt] italic text-navy-500">Thấu hiểu để dẫn lối.</p>
          </div>
          <div className="text-right">
            <p className="mnee-label">Báo cáo học tập</p>
            <p className="mt-1 text-[10pt] font-medium text-navy-700">
              {formatDate(lesson.lesson_date)}
            </p>
          </div>
        </div>

        {banNoiBo ? (
          <p className="in-giu-mau mt-3 rounded border border-burgundy-200 bg-burgundy-50 px-3 py-1.5 text-[9pt] font-semibold text-burgundy-800">
            BẢN NỘI BỘ — có ghi chú dành riêng cho Founder. Không gửi phụ huynh.
          </p>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[10pt]">
          <div>
            <dt className="mnee-label">Học viên</dt>
            <dd className="mt-0.5 font-semibold text-navy-900">{lesson.student_names ?? '—'}</dd>
          </div>
          <div>
            <dt className="mnee-label">Giáo viên</dt>
            <dd className="mt-0.5 text-navy-800">{lesson.teacher_name ?? 'Chưa phân công'}</dd>
          </div>
          <div>
            <dt className="mnee-label">Lớp</dt>
            <dd className="mt-0.5 text-navy-800">{lesson.class_name ?? lesson.class_code}</dd>
          </div>
          <div>
            <dt className="mnee-label">Thời lượng</dt>
            <dd className="mt-0.5 text-navy-800">
              {formatTime(lesson.scheduled_start_at)}–{formatTime(lesson.scheduled_end_at)} ·{' '}
              {formatDuration(lesson.duration_minutes)}
            </dd>
          </div>
        </dl>
      </header>

      {/* ---------- Nội dung ---------- */}
      {noiDung !== '' ? (
        <Muc so={tiep()} tieuDe="Nội dung buổi học">
          <Doan text={noiDung} />
        </Muc>
      ) : null}

      {/* Câu học viên nói được — bằng chứng, đặt nổi bật */}
      {trichDan !== '' ? (
        <section className="giu-nguyen-khoi in-giu-mau mb-6 rounded border-l-[3px] border-gold-500 bg-gold-50 px-4 py-3">
          <p className="mnee-label">Câu học viên nói được trong buổi</p>
          <p className="mt-1.5 whitespace-pre-line text-[10.5pt] italic leading-relaxed text-navy-900">
            {trichDan}
          </p>
        </section>
      ) : null}

      {diemManh !== '' ? (
        <Muc so={tiep()} tieuDe="Điểm mạnh">
          <Doan text={diemManh} />
        </Muc>
      ) : null}

      {canCaiThien !== '' ? (
        <Muc so={tiep()} tieuDe="Cần cải thiện">
          <Doan text={canCaiThien} />
        </Muc>
      ) : null}

      {nhanXetGV !== '' ? (
        <Muc so={tiep()} tieuDe="Nhận xét của giáo viên">
          <Doan text={nhanXetGV} />
        </Muc>
      ) : null}

      {homework ? (
        <Muc so={tiep()} tieuDe="Bài tập về nhà">
          <p className="mb-2 text-[10.5pt] font-semibold text-navy-900">{homework.title}</p>
          {homework.description ? <Doan text={homework.description} /> : null}
          {homework.sentence_patterns ? (
            <div className="in-giu-mau mt-3 rounded border border-navy-100 bg-navy-50 px-3.5 py-2.5">
              <p className="mnee-label">Mẫu câu và từ vựng</p>
              <p className="mt-1.5 whitespace-pre-line font-mono text-[9.5pt] leading-relaxed text-navy-800">
                {homework.sentence_patterns}
              </p>
            </div>
          ) : null}
          {homework.due_date ? (
            <p className="mt-2.5 text-[9.5pt] text-navy-600">
              <span className="mnee-label mr-1.5">Hạn nộp</span>
              {formatDate(homework.due_date)}
            </p>
          ) : null}
        </Muc>
      ) : null}

      {buoiSau !== '' ? (
        <Muc so={tiep()} tieuDe="Định hướng buổi sau">
          <Doan text={buoiSau} />
        </Muc>
      ) : null}

      {/* ---------- Video buổi học ---------- */}
      {dsBanGhi.length > 0 ? (
        <Muc so={tiep()} tieuDe="Xem lại buổi học">
          <p className="mb-2.5 text-[10pt] text-navy-700">
            {report.video_timestamp
              ? `Bấm vào link dưới đây để xem lại buổi học. Link mở đúng phút ${report.video_timestamp} — khoảnh khắc được nhắc trong báo cáo.`
              : 'Bấm vào link dưới đây để xem lại toàn bộ buổi học.'}
          </p>
          <ul className="space-y-1.5">
            {dsBanGhi.map((r, i) => (
              <li key={r.url}>
                <a
                  href={linkXemLai(r.url, i === 0 ? report.video_timestamp : null)}
                  className="in-kem-dia-chi break-all text-[10pt] font-medium text-navy-700 underline decoration-gold-500 underline-offset-2"
                >
                  {dsBanGhi.length > 1 ? `Video phần ${i + 1}` : 'Video buổi học'}
                </a>
              </li>
            ))}
          </ul>
        </Muc>
      ) : null}

      {/* ---------- Chân trang ---------- */}
      <footer className="giu-nguyen-khoi mt-8 border-t border-navy-100 pt-3 text-[8.5pt] text-navy-500">
        <p>
          Ms.Ngọc Elite English · &ldquo;Thấu hiểu để dẫn lối.&rdquo; · Báo cáo lập từ hệ thống MNEE
          ngày {formatDate(new Date())}
        </p>
        <p className="mt-0.5">
          Mọi nhận xét trong báo cáo này đều dẫn về một mốc thời gian cụ thể trong video buổi học.
        </p>
      </footer>
    </div>
  )
}
