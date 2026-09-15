import Link from 'next/link'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Table, Td, Th } from '@/components/ui/Table'

/**
 * Một dòng của `v_class_board`.
 *
 * Mọi cột đều nullable vì Postgres không suy ra được ràng buộc NOT NULL qua
 * view. Các hàm dưới đây dùng `?? 0` thay vì ép kiểu, để nếu view đổi thì lỗi
 * hiện ra lúc biên dịch chứ không thành NaN trên màn hình.
 */
export type DongBang = {
  class_id: string | null
  ten_lop: string | null
  giao_vien: string | null
  si_so: number | null
  tong_buoi: number | null
  buoi_gan_nhat: string | null
  ngay_im_lang: number | null
  buoi_thang_nay: number | null
  buoi_thieu_gio: number | null
  so_bao_cao: number | null
  so_video: number | null
  con_thieu: number | null
  so_lich: number | null
}

/**
 * Ngưỡng im lặng.
 *
 * Lớp của trung tâm dạy 1–3 buổi/tuần, nên quá 14 ngày không có buổi nào là
 * bất thường với mọi lớp — kể cả lớp thưa nhất. Quá 30 ngày thì hoặc học viên
 * đã nghỉ, hoặc giáo viên đã dạy mà không ai nhập. Cả hai đều cần hỏi ngay.
 */
function mucImLang(ngay: number | null): { tone: 'success' | 'warning' | 'danger' | 'neutral'; vach: string } {
  if (ngay === null) return { tone: 'neutral', vach: 'border-l-navy-200' }
  if (ngay > 30) return { tone: 'danger', vach: 'border-l-burgundy-500' }
  if (ngay > 14) return { tone: 'warning', vach: 'border-l-gold-500' }
  return { tone: 'success', vach: 'border-l-sage-500' }
}

/**
 * Bảng điều khiển lớp học — màn hình Founder mở mỗi sáng.
 *
 * Trang lớp học trước đây chỉ liệt kê tên lớp, giáo viên và sĩ số: những thứ
 * không đổi hằng tuần, nên nhìn vào không biết chuyện gì đang xảy ra. Bảng này
 * trả lời đúng một câu hỏi — LỚP NÀO ĐANG IM LẶNG BẤT THƯỜNG.
 *
 * Cột "Còn thiếu" chỉ hiện cho Founder. Với giáo viên, RLS trên `payments` và
 * `lesson_consumptions` đã cho ra 0; ẩn hẳn cột để không ai hiểu nhầm số 0 đó
 * là "học viên đã đóng đủ".
 */
export type HopDongCuaLop = { class_id: string; enrollment_id: string; ten_hoc_vien: string }

export function ClassBoard({
  rows,
  isFounder,
  hopDong = [],
}: {
  rows: DongBang[]
  isFounder: boolean
  hopDong?: HopDongCuaLop[]
}) {
  const dangChay = rows.filter((r) => r.buoi_gan_nhat !== null)
  const imLangLau = dangChay.filter((r) => (r.ngay_im_lang ?? 0) > 14)
  const tongThieu = rows.reduce((s, r) => s + Math.max(0, Number(r.con_thieu ?? 0)), 0)
  const thieuGio = rows.reduce((s, r) => s + (r.buoi_thieu_gio ?? 0), 0)
  const coVideo = rows.reduce((s, r) => s + (r.so_video ?? 0), 0)
  const tongBuoi = rows.reduce((s, r) => s + (r.tong_buoi ?? 0), 0)

  // Bảng kê lập theo HỢP ĐỒNG, không theo lớp: lớp nhóm có nhiều học viên thì
  // mỗi em một bảng kê riêng, vì học phí và số tiền đã đóng của mỗi em khác nhau.
  const hopDongCua = (classId: string | null) =>
    classId ? hopDong.filter((h) => h.class_id === classId) : []

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Lớp im lặng quá 14 ngày"
          value={`${imLangLau.length} / ${dangChay.length}`}
          caption="Không rõ đã nghỉ hay chưa ai nhập"
          accent={imLangLau.length > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Buổi thiếu giờ dạy"
          value={`${formatNumber(thieuGio)} / ${formatNumber(tongBuoi)}`}
          caption="Thiếu giờ thì không tính được lương"
          accent={thieuGio > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Buổi có video"
          value={`${formatNumber(coVideo)} / ${formatNumber(tongBuoi)}`}
          caption="Phụ huynh hỏi là có cái để đưa"
          accent={coVideo === 0 ? 'burgundy' : 'gold'}
        />
        {isFounder ? (
          <StatCard
            label="Học phí còn thiếu"
            value={formatCurrency(tongThieu)}
            caption={`${rows.filter((r) => Number(r.con_thieu ?? 0) > 0).length} lớp`}
            accent={tongThieu > 0 ? 'gold' : 'sage'}
          />
        ) : (
          <StatCard
            label="Lớp đang phụ trách"
            value={formatNumber(rows.length)}
            accent="navy"
          />
        )}
      </section>

      {thieuGio > 0 ? (
        <Alert kind="warning">
          <strong>{formatNumber(thieuGio)} buổi chưa có giờ vào – giờ ra.</strong> Những buổi
          này đã ghi nhận học phí nhưng <em>không</em> sinh được dòng trả lương giáo viên, nên
          chi phí trong sổ đang thấp hơn thực tế. Buổi ghi qua biểu mẫu ở trang Buổi học
          không bị lỗi này vì giờ dạy là bắt buộc.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Tình trạng lớp đang diễn ra"
          description="Sắp theo lớp im lặng lâu nhất. Vạch đỏ: quá 30 ngày · vàng: 14–30 ngày · xanh: dưới 14 ngày."
        />
        <Table>
          <thead>
            <tr>
              <Th>Lớp</Th>
              <Th>Buổi gần nhất</Th>
              <Th align="right">Im lặng</Th>
              <Th align="right">Tháng này</Th>
              <Th align="right">Tổng buổi</Th>
              <Th align="center">Nội dung</Th>
              <Th align="center">Video</Th>
              {isFounder ? <Th align="right">Còn thiếu</Th> : null}
              {isFounder ? <Th>Bảng kê</Th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const muc = mucImLang(r.ngay_im_lang)
              const thieu = Number(r.con_thieu ?? 0)
              return (
                <tr key={r.class_id ?? r.ten_lop} className={`border-l-[3px] ${muc.vach}`}>
                  <Td>
                    <Link
                      href={`/classes/${r.class_id}`}
                      className="text-[0.8125rem] font-medium text-navy-900 hover:text-navy-600"
                    >
                      {r.ten_lop}
                    </Link>
                    <p className="text-xs text-navy-400">
                      {r.giao_vien ?? 'chưa gán giáo viên'}
                      {r.so_lich === 0 ? ' · chưa có lịch' : ''}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap text-navy-600">
                    {r.buoi_gan_nhat ? formatDate(r.buoi_gan_nhat) : '—'}
                  </Td>
                  <Td align="right">
                    {r.ngay_im_lang === null ? (
                      <Badge tone="neutral">chưa có buổi</Badge>
                    ) : (
                      <Badge tone={muc.tone}>{r.ngay_im_lang} ngày</Badge>
                    )}
                  </Td>
                  <Td align="right" className="tabular text-navy-600">
                    {r.buoi_thang_nay}
                  </Td>
                  <Td align="right" className="tabular text-navy-600">
                    {r.tong_buoi}
                  </Td>
                  <Td align="center">
                    {(r.tong_buoi ?? 0) === 0 ? (
                      <span className="text-navy-300">—</span>
                    ) : (
                      <Badge
                        tone={
                          (r.so_bao_cao ?? 0) === 0
                            ? 'danger'
                            : (r.so_bao_cao ?? 0) < (r.tong_buoi ?? 0)
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {r.so_bao_cao ?? 0}/{r.tong_buoi ?? 0}
                      </Badge>
                    )}
                  </Td>
                  <Td align="center">
                    {(r.tong_buoi ?? 0) === 0 ? (
                      <span className="text-navy-300">—</span>
                    ) : (
                      <Badge tone={(r.so_video ?? 0) === 0 ? 'danger' : 'success'}>
                        {r.so_video ?? 0}/{r.tong_buoi ?? 0}
                      </Badge>
                    )}
                  </Td>
                  {isFounder ? (
                    <Td align="right" className="tabular whitespace-nowrap">
                      {thieu > 0 ? (
                        <span className="font-medium text-burgundy-700">
                          {formatCurrency(thieu)}
                        </span>
                      ) : thieu < 0 ? (
                        <span className="text-sage-700">dư {formatCurrency(-thieu)}</span>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </Td>
                  ) : null}
                  {isFounder ? (
                    <Td>
                      {hopDongCua(r.class_id).length === 0 ? (
                        <span className="text-navy-300">—</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {hopDongCua(r.class_id).map((h) => (
                            <Link
                              key={h.enrollment_id}
                              href={`/bang-ke/${h.enrollment_id}`}
                              className="whitespace-nowrap text-xs font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900"
                            >
                              {hopDongCua(r.class_id).length > 1 ? h.ten_hoc_vien : 'Xem bảng kê'}
                            </Link>
                          ))}
                        </div>
                      )}
                    </Td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
