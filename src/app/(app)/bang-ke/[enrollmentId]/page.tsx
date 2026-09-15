import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PAYMENT_METHOD } from '@/lib/labels'

export const metadata: Metadata = { title: 'Bảng kê học phí' }

/**
 * Bảng kê học phí gửi phụ huynh — bản hệ thống tự sinh, thay cho file PDF
 * Founder đang làm tay.
 *
 * VÌ SAO LẤY TỪ BẢNG `lessons` CHỨ KHÔNG TỪ `lesson_consumptions`:
 * buổi miễn phí KHÔNG sinh dòng doanh thu. Lớp Tân có 64 buổi hoàn tất nhưng
 * chỉ 57 dòng doanh thu — 7 buổi miễn phí không có dòng nào. Dựng bảng kê từ
 * doanh thu là mất đúng 7 buổi đó, và phụ huynh sẽ thấy thiếu buổi con mình đã
 * học. Buổi miễn phí vẫn phải hiện, chỉ là không tính tiền.
 *
 * Trang in được: bấm Ctrl+P ra đúng một tệp PDF gửi Zalo.
 */
export default async function BangKePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>
}) {
  await requireFounder()
  const { enrollmentId } = await params
  const supabase = await createClient()

  const { data: hd } = await supabase
    .from('v_enrollment_balances')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle()

  if (!hd || !hd.class_id || !hd.student_id) notFound()

  const [{ data: hv }, { data: lop }, { data: buoiRaw }, { data: thanhToan }] = await Promise.all([
    supabase.from('students').select('full_name, student_code').eq('id', hd.student_id).maybeSingle(),
    supabase
      .from('classes')
      .select('name, class_type, default_duration_minutes, teachers(display_name, full_name), levels(code, cefr_code)')
      .eq('id', hd.class_id)
      .maybeSingle(),
    supabase
      .from('lessons')
      .select('id, lesson_date, topic, duration_minutes')
      .eq('class_id', hd.class_id)
      .eq('status', 'completed')
      .order('lesson_date'),
    supabase
      .from('payments')
      .select('payment_date, amount, method, reference, notes')
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'confirmed')
      .order('payment_date'),
  ])

  const buoi = buoiRaw ?? []
  const ids = buoi.map((b) => b.id)

  const [{ data: doanhThu }, { data: diemDanh }, { data: baoCao }, { data: video }, { data: baiTap }] =
    ids.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          supabase
            .from('lesson_consumptions')
            .select('lesson_id, recognized_amount')
            .eq('enrollment_id', enrollmentId)
            .in('lesson_id', ids),
          supabase
            .from('attendance')
            .select('lesson_id, status, is_billable')
            .eq('student_id', hd.student_id)
            .in('lesson_id', ids),
          supabase
            .from('teaching_reports')
            .select('lesson_id, lesson_content, strengths, improvements, homework_summary, student_quote, teacher_comments, status')
            .in('lesson_id', ids),
          supabase.from('recordings').select('lesson_id, url, title').in('lesson_id', ids),
          supabase.from('homework').select('lesson_id, title, description').in('lesson_id', ids),
        ])

  const tienCua = new Map((doanhThu ?? []).map((d) => [d.lesson_id, Number(d.recognized_amount)]))
  const ddCua = new Map((diemDanh ?? []).map((d) => [d.lesson_id, d]))
  const bcCua = new Map((baoCao ?? []).map((b) => [b.lesson_id, b]))
  const videoCua = new Map<string, { url: string; title: string | null }[]>()
  for (const v of video ?? []) {
    if (!v.lesson_id) continue
    videoCua.set(v.lesson_id, [...(videoCua.get(v.lesson_id) ?? []), { url: v.url, title: v.title }])
  }
  const btCua = new Map((baiTap ?? []).map((h) => [h.lesson_id, h]))

  const dong = buoi.map((b, i) => ({
    stt: i + 1,
    ...b,
    tien: tienCua.get(b.id) ?? 0,
    tinhPhi: ddCua.get(b.id)?.is_billable ?? true,
    baoCao: bcCua.get(b.id) ?? null,
    video: videoCua.get(b.id) ?? [],
    baiTap: btCua.get(b.id) ?? null,
  }))

  const tongTien = dong.reduce((s, d) => s + d.tien, 0)
  const soBuoiTinhPhi = dong.filter((d) => d.tinhPhi).length
  const soBuoiMienPhi = dong.length - soBuoiTinhPhi
  const daThu = Number(hd.total_paid ?? 0)
  const conThieu = tongTien - daThu
  const teacher = lop?.teachers as { display_name: string | null; full_name: string } | null
  const level = lop?.levels as { code: string | null; cefr_code: string | null } | null
  const coNoiDung = dong.filter((d) => d.baoCao?.lesson_content).length

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <style>{`@media print{
        .khong-in{display:none!important}
        body{background:#fff}
        .buoi{break-inside:avoid}
      }`}</style>

      <div className="khong-in mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy-50 px-4 py-3">
        <p className="text-[0.8125rem] text-navy-600">
          Bấm <strong>Ctrl+P</strong> (hoặc Cmd+P) rồi chọn <strong>Lưu thành PDF</strong> để
          gửi phụ huynh qua Zalo.
        </p>
        {coNoiDung < dong.length ? (
          <p className="text-[0.8125rem] font-medium text-burgundy-700">
            {dong.length - coNoiDung}/{dong.length} buổi chưa có nội dung
          </p>
        ) : null}
      </div>

      {/* --- Đầu trang --- */}
      <header className="border-b-2 border-gold-500 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-serif text-xl font-semibold tracking-tight text-navy-900">
              MS.NGỌC ELITE ENGLISH
            </p>
            <p className="mt-0.5 font-serif text-sm italic text-gold-700">Thấu hiểu để dẫn lối.</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-base font-semibold text-navy-900">Bảng kê học phí</p>
            <p className="text-xs uppercase tracking-wider text-navy-400">
              Lập ngày {formatDate(new Date())}
            </p>
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Học viên', hv?.full_name ?? '—'],
          ['Lớp', lop?.name ?? '—'],
          ['Giáo viên', teacher?.display_name ?? teacher?.full_name ?? '—'],
          [
            'Trình độ',
            level?.cefr_code ? `${level.cefr_code}${level.code ? ` · ${level.code}` : ''}` : '—',
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="mnee-label">{k}</dt>
            <dd className="mt-0.5 text-[0.9375rem] font-medium text-navy-900">{v}</dd>
          </div>
        ))}
      </dl>

      {/* --- Tổng hợp --- */}
      <section className="mt-6 grid grid-cols-2 gap-px border border-navy-200 bg-navy-200 sm:grid-cols-4">
        {[
          ['Buổi đã học', formatNumber(dong.length), `${soBuoiTinhPhi} tính phí · ${soBuoiMienPhi} miễn phí`, ''],
          ['Học phí phát sinh', formatCurrency(tongTien), '', ''],
          ['Đã thu', formatCurrency(daThu), `${(thanhToan ?? []).length} lần đóng`, 'text-sage-700'],
          [
            conThieu > 0 ? 'Còn phải thu' : 'Đã đóng dư',
            formatCurrency(Math.abs(conThieu)),
            '',
            conThieu > 0 ? 'text-burgundy-700' : 'text-sage-700',
          ],
        ].map(([label, value, sub, mau]) => (
          <div key={label} className="bg-white p-4">
            <p className="mnee-label">{label}</p>
            <p className={`tabular mt-1 font-serif text-xl font-semibold text-navy-900 ${mau}`}>
              {value}
            </p>
            {sub ? <p className="mt-0.5 text-xs text-navy-500">{sub}</p> : null}
          </div>
        ))}
      </section>

      {/* --- Danh sách buổi --- */}
      <section className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-navy-900">Danh sách buổi học</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-navy-300">
                <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Buổi</th>
                <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Ngày</th>
                <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Nội dung</th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-navy-400">Học phí</th>
              </tr>
            </thead>
            <tbody>
              {dong.map((d) => (
                <tr key={d.id} className="border-b border-navy-100">
                  <td className="tabular py-2 pr-3 text-navy-600">{d.stt}</td>
                  <td className="tabular whitespace-nowrap py-2 pr-3 text-navy-700">
                    {formatDate(d.lesson_date)}
                  </td>
                  <td className="py-2 pr-3 text-navy-800">
                    {d.baoCao?.lesson_content ?? d.topic ?? (
                      <span className="italic text-navy-400">Nội dung sẽ được cập nhật</span>
                    )}
                  </td>
                  <td className="tabular whitespace-nowrap py-2 text-right">
                    {d.tinhPhi ? (
                      formatCurrency(d.tien)
                    ) : (
                      <span className="rounded bg-sage-100 px-1.5 py-0.5 text-xs font-medium text-sage-700">
                        Miễn phí
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-b-2 border-navy-300">
                <td className="py-2.5 font-semibold text-navy-900" colSpan={2}>
                  Tổng cộng
                </td>
                <td className="tabular py-2.5 text-navy-600">{dong.length} buổi</td>
                <td className="tabular py-2.5 text-right font-semibold text-navy-900">
                  {formatCurrency(tongTien)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* --- Nhận xét từng buổi --- */}
      <section className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-navy-900">Nhận xét chi tiết từng buổi</h2>
        <div className="mt-3 space-y-4">
          {dong.map((d) => {
            const bc = d.baoCao
            return (
              <article
                key={d.id}
                className="buoi border-l-2 border-navy-800 bg-white pl-4 pr-3 py-3 ring-1 ring-navy-100"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-serif text-base font-semibold text-navy-900">
                    Buổi {d.stt} · {formatDate(d.lesson_date)}
                  </h3>
                  {!d.tinhPhi ? (
                    <span className="rounded bg-sage-100 px-1.5 py-0.5 text-xs font-medium text-sage-700">
                      Miễn phí
                    </span>
                  ) : null}
                </div>

                {bc?.lesson_content ? (
                  <p className="mt-1.5 text-[0.8125rem] font-medium text-burgundy-800">
                    {bc.lesson_content}
                  </p>
                ) : null}

                {bc?.teacher_comments ? (
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-700">
                    {bc.teacher_comments}
                  </p>
                ) : null}

                {bc?.strengths ? (
                  <div className="mt-2.5">
                    <p className="mnee-label text-sage-700">Điểm mạnh</p>
                    <p className="mt-0.5 whitespace-pre-line text-[0.8125rem] leading-relaxed text-navy-700">
                      {bc.strengths}
                    </p>
                  </div>
                ) : null}

                {bc?.improvements ? (
                  <div className="mt-2.5">
                    <p className="mnee-label text-burgundy-700">Cần cải thiện</p>
                    <p className="mt-0.5 whitespace-pre-line text-[0.8125rem] leading-relaxed text-navy-700">
                      {bc.improvements}
                    </p>
                  </div>
                ) : null}

                {bc?.homework_summary || d.baiTap ? (
                  <div className="mt-2.5 border border-dashed border-gold-400 bg-gold-50/60 px-3 py-2">
                    <span className="mnee-label text-gold-800">Bài tập về nhà</span>
                    <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-navy-700">
                      {bc?.homework_summary ?? d.baiTap?.description ?? d.baiTap?.title}
                    </p>
                  </div>
                ) : null}

                {!bc?.lesson_content && !bc?.strengths ? (
                  <p className="mt-1.5 text-[0.8125rem] italic text-navy-400">
                    Nhận xét chi tiết của buổi này trung tâm sẽ gửi bổ sung.
                  </p>
                ) : null}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="mnee-label">Video buổi học</span>
                  {d.video.length === 0 ? (
                    <span className="text-[0.8125rem] italic text-navy-400">
                      Buổi này chưa có video lưu lại.
                    </span>
                  ) : (
                    d.video.map((v, i) => (
                      <a
                        key={v.url}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded bg-navy-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-navy-700"
                      >
                        ▶ {v.title ?? (d.video.length > 1 ? `Phần ${i + 1}` : 'Xem lại buổi học')}
                      </a>
                    ))
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* --- Các lần đã đóng --- */}
      <section className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-navy-900">Các lần đã đóng</h2>
        {(thanhToan ?? []).length === 0 ? (
          <p className="mt-2 text-[0.8125rem] italic text-navy-400">
            Chưa ghi nhận khoản đóng nào cho hợp đồng này.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy-300">
                  <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Ngày</th>
                  <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Hình thức</th>
                  <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-navy-400">Nội dung</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-navy-400">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {(thanhToan ?? []).map((p, i) => (
                  <tr key={i} className="border-b border-navy-100">
                    <td className="tabular whitespace-nowrap py-2 pr-3 text-navy-700">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="py-2 pr-3 text-navy-600">{PAYMENT_METHOD[p.method]}</td>
                    <td className="py-2 pr-3 text-[0.8125rem] text-navy-600">
                      {p.reference ?? p.notes ?? '—'}
                    </td>
                    <td className="tabular whitespace-nowrap py-2 text-right text-navy-900">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-b-2 border-navy-300">
                  <td className="py-2.5 font-semibold text-navy-900" colSpan={3}>
                    Cộng
                  </td>
                  <td className="tabular py-2.5 text-right font-semibold text-navy-900">
                    {formatCurrency(daThu)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* --- Kết --- */}
      {conThieu > 0 ? (
        <section className="mt-8 border border-navy-200 border-l-[3px] border-l-burgundy-600 bg-white px-5 py-4">
          <p className="mnee-label">Số còn phải thu</p>
          <p className="tabular mt-1 font-serif text-2xl font-semibold text-burgundy-700">
            {formatCurrency(conThieu)}
          </p>
          <p className="mt-1.5 max-w-prose text-[0.8125rem] text-navy-600">
            {formatCurrency(tongTien)} học phí của {soBuoiTinhPhi} buổi đã học, trừ{' '}
            {formatCurrency(daThu)} đã đóng.
          </p>
        </section>
      ) : null}

      <footer className="mt-8 border-t border-navy-200 pt-4 text-xs leading-relaxed text-navy-400">
        <p>
          Học phí chỉ tính trên số buổi thực học. Buổi nghỉ hoặc hoãn lịch không tính phí.
        </p>
        <p className="mt-1">
          Bảng kê lập ngày {formatDate(new Date())} từ hệ thống quản lý MNEE. Mọi thắc mắc xin
          liên hệ trung tâm.
        </p>
      </footer>
    </div>
  )
}
