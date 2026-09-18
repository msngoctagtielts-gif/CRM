import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/period'
import { formatCurrency, formatDate, formatDuration, formatNumber } from '@/lib/format'
import { PAYROLL_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { BuildPayrollForm } from './PayrollForms'

export const metadata: Metadata = { title: 'Bảng lương' }

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ gv?: string; thang?: string }>
}) {
  const sp = await searchParams
  const locGV = sp.gv?.trim() || ''
  const locThang = sp.thang?.trim() || ''
  const user = await requireUser()
  const isFounder = user.role_code === 'founder'
  const supabase = await createClient()

  // RLS lo phần phạm vi: giáo viên chỉ thấy kỳ lương và buổi của chính mình,
  // không bao giờ thấy của đồng nghiệp.
  const [{ data: periods }, { data: pending }, { data: teachers }] = await Promise.all([
    supabase
      .from('v_teacher_payroll_summary')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(100),
    supabase
      .from('teacher_payable_lessons')
      .select(
        'id, teacher_id, lesson_date, duration_minutes, amount, has_video, has_evidence, sent_to_parent, qc_score',
      )
      .eq('status', 'pending')
      .order('lesson_date', { ascending: false })
      .limit(100),
    isFounder
      ? supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  // Mốc siết và danh sách buổi bị chặn lương. v_buoi_chan_luong định nghĩa điều
  // kiện chặn ở đúng một chỗ, dùng chung với hàm cảnh báo và luật sinh công —
  // nên màn hình này không thể nói khác với luật.
  const [{ data: mocRow }, { data: biChan }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'require_evidence_from').maybeSingle(),
    supabase
      .from('v_buoi_chan_luong')
      .select('lesson_id, lesson_date, ten_lop, ten_giao_vien, ly_do')
      .order('lesson_date', { ascending: false })
      .limit(100),
  ])
  const moc = typeof mocRow?.value === 'string' ? mocRow.value : null
  const chanRows = biChan ?? []

  // Luong THUC TRA theo thang, doc tu buoi da sinh cong.
  //
  // VI SAO PHAI CO PHAN NAY
  //   Bang teacher_payroll la chung tu ky luong co trang thai duyet va nguoi
  //   duyet. Toan bo 460 buoi lich su duoc tra trong thoi ky con quan ly bang
  //   Google Sheet nen khong he co chung tu nao — va khong duoc dung nguoc, vi
  //   nhu vay la tao chung tu gia. Neu man hinh nay chi doc ky luong thi no
  //   trong ron trong khi trung tam da tra 57 trieu. Doc thang tu buoi da tra
  //   moi la su that.
  // Lọc ngay ở truy vấn chứ không kéo hết về rồi lọc bằng JavaScript: cô Ngọc
  // chọn một giáo viên và một tháng thì chỉ nên tải đúng ngần ấy dòng.
  let truyVanLuong = supabase
    .from('v_luong_gv_thang')
    .select('thang, teacher_id, ten_giao_vien, so_buoi, so_phut, tien, buoi_da_tra, buoi_chua_tra')
    .order('thang', { ascending: false })

  if (locGV) truyVanLuong = truyVanLuong.eq('teacher_id', locGV)
  if (locThang) truyVanLuong = truyVanLuong.eq('thang', `${locThang}-01`)

  const { data: luongThang } = await truyVanLuong

  const luongRows = luongThang ?? []
  const tongDaTra = luongRows.reduce((s, r) => s + Number(r.tien ?? 0), 0)
  const tongBuoi = luongRows.reduce((s, r) => s + Number(r.so_buoi ?? 0), 0)

  // Gom theo thang, giu nguyen thu tu moi nhat truoc.
  const theoThang: { thang: string; tien: number; buoi: number; dong: typeof luongRows }[] = []
  for (const r of luongRows) {
    const thang = String(r.thang ?? '')
    let nhom = theoThang.find((n) => n.thang === thang)
    if (!nhom) {
      nhom = { thang, tien: 0, buoi: 0, dong: [] }
      theoThang.push(nhom)
    }
    nhom.tien += Number(r.tien ?? 0)
    nhom.buoi += Number(r.so_buoi ?? 0)
    nhom.dong.push(r)
  }
  for (const n of theoThang) n.dong.sort((a, b) => Number(b.tien ?? 0) - Number(a.tien ?? 0))

  const rows = periods ?? []
  const pendingRows = pending ?? []
  const pendingAmount = pendingRows.reduce((sum, r) => sum + Number(r.amount), 0)
  const unpaid = rows.filter((r) => r.status !== 'paid')
  const unpaidAmount = unpaid.reduce((sum, r) => sum + Number(r.final_amount ?? 0), 0)
  const teacherName = new Map((teachers ?? []).map((t) => [t.id, t.full_name]))

  return (
    <>
      <PageHeader
        title={isFounder ? 'Bảng lương giáo viên' : 'Lương của tôi'}
        description="Lương được tính từ các buổi đã dạy, không nhập tay từng buổi."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={isFounder ? 'Tổng đã trả' : 'Tổng tôi đã nhận'}
          value={formatCurrency(tongDaTra)}
          caption={`${formatNumber(tongBuoi)} buổi · ${theoThang.length} tháng`}
          accent="navy"
        />
        <StatCard
          label="Buổi chờ vào kỳ lương"
          value={pendingRows.length}
          caption={formatCurrency(pendingAmount)}
          accent={pendingRows.length > 0 ? 'gold' : 'sage'}
        />
        <StatCard
          label="Kỳ lương chưa trả"
          value={unpaid.length}
          caption={formatCurrency(unpaidAmount)}
          accent={unpaid.length > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Buổi bị chặn lương"
          value={chanRows.length}
          caption={moc ? `Áp dụng từ ${formatDate(moc)}` : undefined}
          accent={chanRows.length > 0 ? 'burgundy' : 'sage'}
        />
      </section>

      {isFounder ? (
        <Alert kind="info" className="mb-5">
          Buổi dạy <strong>trước {moc ? formatDate(moc) : '01/09/2026'}</strong> được tính lương đầy
          đủ theo hiện trạng đã nhập, không xét thiếu đủ. <strong>Từ ngày đó trở đi</strong>, buổi
          chỉ sinh công khi có đủ giờ vào, giờ ra và điểm danh đủ sĩ số. Thiếu bằng chứng chất lượng
          (video, điểm chấm) thì vẫn được trả lương, chỉ bị gắn cờ để bạn nhìn thấy.
        </Alert>
      ) : (
        <Alert kind="info" className="mb-5">
          Từ <strong>{moc ? formatDate(moc) : '01/09/2026'}</strong>, buổi dạy chỉ được tính lương
          khi bạn đã ghi <strong>giờ vào, giờ ra và điểm danh đủ sĩ số</strong>. Thiếu một trong ba
          thì buổi đó chưa vào bảng lương — bổ sung xong là buổi tự vào, không cần báo ai.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title={isFounder ? 'Lương đã trả theo tháng' : 'Lương tôi đã nhận theo tháng'}
              description="Tính từ buổi đã dạy, mới nhất trước. Đây là tiền thật đã trả."
            />

            {/* Biểu mẫu GET thuần: lọc chạy trên máy chủ, không cần JavaScript,
                và đường dẫn sau khi lọc có thể lưu lại hoặc gửi cho người khác. */}
            {isFounder ? (
              <CardBody className="border-b border-navy-100">
                <form method="get" className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="mnee-label">Giáo viên</span>
                    <select
                      name="gv"
                      defaultValue={locGV}
                      className="min-w-[12rem] rounded-md border border-navy-200 px-2.5 py-1.5 text-sm"
                    >
                      <option value="">Tất cả giáo viên</option>
                      {(teachers ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="mnee-label">Tháng</span>
                    <input
                      type="month"
                      name="thang"
                      defaultValue={locThang}
                      className="rounded-md border border-navy-200 px-2.5 py-1.5 text-sm"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-md bg-navy-800 px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-900"
                  >
                    Xem
                  </button>

                  {locGV || locThang ? (
                    <Link
                      href="/payroll"
                      className="py-2 text-sm text-navy-600 underline hover:text-navy-800"
                    >
                      Bỏ lọc
                    </Link>
                  ) : null}
                </form>
              </CardBody>
            ) : null}
            {theoThang.length === 0 ? (
              <EmptyState
                title="Chưa có tháng nào được tính công"
                description="Chưa có buổi dạy nào sinh công tính lương."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tháng · Giáo viên</Th>
                    <Th align="right">Buổi</Th>
                    <Th align="right">Giờ</Th>
                    <Th align="right">Tiền</Th>
                    <Th>Tình trạng</Th>
                  </tr>
                </thead>
                <tbody>
                  {theoThang.map((n) => (
                    <Fragment key={n.thang}>
                      <tr className="bg-navy-50/60">
                        <Td className="font-semibold text-navy-900">
                          Tháng {n.thang.slice(5, 7)}/{n.thang.slice(0, 4)}
                        </Td>
                        <Td align="right" className="font-semibold">
                          {formatNumber(n.buoi)}
                        </Td>
                        <Td />
                        <Td align="right" className="font-semibold">
                          {formatCurrency(n.tien)}
                        </Td>
                        <Td />
                      </tr>
                      {n.dong.map((r) => {
                        const chuaTra = Number(r.buoi_chua_tra ?? 0)
                        return (
                          <tr key={`${n.thang}-${r.teacher_id}`}>
                            <Td className="pl-8 text-navy-700">{r.ten_giao_vien}</Td>
                            <Td align="right">{formatNumber(r.so_buoi)}</Td>
                            <Td align="right">{formatNumber(Number(r.so_phut ?? 0) / 60, 1)} h</Td>
                            <Td align="right">{formatCurrency(r.tien)}</Td>
                            <Td>
                              {chuaTra === 0 ? (
                                <Badge tone="success">Đã trả đủ</Badge>
                              ) : (
                                <Badge tone="warning">Còn {chuaTra} buổi chưa trả</Badge>
                              )}
                            </Td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            )}
            <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
              Bảng này đọc thẳng từ buổi đã dạy nên luôn khớp với thực tế. Nó khác với{' '}
              <strong>kỳ lương</strong> bên dưới — kỳ lương là chứng từ có người duyệt và ngày trả,
              dùng cho các tháng tới.
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Các kỳ lương"
              description="Chứng từ duyệt lương: nháp → chờ duyệt → đã duyệt → đã trả"
            />
            {rows.length === 0 ? (
              <EmptyState
                title="Chưa có kỳ lương nào"
                description={
                  isFounder
                    ? 'Toàn bộ lương các tháng trước được trả trong thời kỳ còn quản lý bằng Google Sheet nên không có chứng từ kỳ lương — số tiền đã trả nằm ở bảng phía trên. Từ tháng tới, tính kỳ lương ở khung bên cạnh để có chứng từ duyệt và ngày trả.'
                    : 'Trung tâm chưa chốt kỳ lương nào cho bạn. Số buổi và tiền đã nhận xem ở bảng phía trên.'
                }
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    {isFounder ? <Th>Giáo viên</Th> : null}
                    <Th>Kỳ</Th>
                    <Th align="right">Số buổi</Th>
                    <Th align="right">Giờ dạy</Th>
                    <Th align="right">Điều chỉnh</Th>
                    <Th align="right">Thực nhận</Th>
                    <Th>Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const meta = r.status ? PAYROLL_STATUS[r.status] : null
                    return (
                      <tr key={r.payroll_id}>
                        {isFounder ? <Td className="font-medium">{r.teacher_name}</Td> : null}
                        <Td>
                          <Link
                            href={`/payroll/${r.payroll_id}`}
                            className="font-medium text-navy-900 hover:text-navy-600"
                          >
                            {r.period_label ?? formatDate(r.period_start)}
                          </Link>
                        </Td>
                        <Td align="right">{formatNumber(r.lessons_count)}</Td>
                        <Td align="right">{formatNumber(r.teaching_hours, 1)} h</Td>
                        <Td
                          align="right"
                          className={
                            Number(r.adjustments_amount ?? 0) < 0 ? 'text-burgundy-700' : undefined
                          }
                        >
                          {Number(r.adjustments_amount ?? 0) === 0
                            ? '—'
                            : formatCurrency(r.adjustments_amount)}
                        </Td>
                        <Td align="right" className="font-semibold">
                          {formatCurrency(r.final_amount)}
                        </Td>
                        <Td>{meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Buổi bị chặn lương"
              description={
                moc
                  ? `Buổi từ ${formatDate(moc)} trở đi còn thiếu điều kiện nên chưa sinh công`
                  : 'Buổi còn thiếu điều kiện nên chưa sinh công'
              }
            />
            {chanRows.length === 0 ? (
              <EmptyState
                title="Không có buổi nào bị chặn"
                description="Mọi buổi đã dạy từ mốc siết trở đi đều đủ giờ vào, giờ ra và điểm danh."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Ngày dạy</Th>
                    <Th>Lớp</Th>
                    {isFounder ? <Th>Giáo viên</Th> : null}
                    <Th>Còn thiếu</Th>
                  </tr>
                </thead>
                <tbody>
                  {chanRows.map((b) => (
                    <tr key={b.lesson_id}>
                      <Td className="whitespace-nowrap">{formatDate(b.lesson_date)}</Td>
                      <Td>{b.ten_lop}</Td>
                      {isFounder ? <Td>{b.ten_giao_vien ?? 'Chưa phân công'}</Td> : null}
                      <Td className="text-burgundy-700">{b.ly_do}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
              Đây không phải danh sách bị trừ lương. Buổi vẫn được trả đủ ngay khi bổ sung đủ giờ
              dạy và điểm danh — hệ thống tự đưa vào bảng lương, không ai phải duyệt lại.
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Buổi chờ vào kỳ lương"
              description="Đã đủ điều kiện tính lương nhưng chưa được gom vào kỳ nào"
            />
            {pendingRows.length === 0 ? (
              <EmptyState
                title="Không có buổi nào đang chờ"
                description="Mọi buổi đủ điều kiện đã được đưa vào một kỳ lương."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    {isFounder ? <Th>Giáo viên</Th> : null}
                    <Th>Ngày dạy</Th>
                    <Th align="right">Thời lượng</Th>
                    <Th>Bằng chứng</Th>
                    <Th align="right">Tiền buổi</Th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((p) => (
                    <tr key={p.id}>
                      {isFounder ? (
                        <Td className="font-medium">{teacherName.get(p.teacher_id) ?? '—'}</Td>
                      ) : null}
                      <Td className="whitespace-nowrap">{formatDate(p.lesson_date)}</Td>
                      <Td align="right">{formatDuration(p.duration_minutes)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {p.has_video ? null : <Badge tone="warning">Thiếu video</Badge>}
                          {p.has_evidence ? null : <Badge tone="warning">Thiếu timestamp</Badge>}
                          {p.sent_to_parent ? null : <Badge tone="neutral">Chưa gửi PH</Badge>}
                          {p.has_video && p.has_evidence && p.sent_to_parent ? (
                            <Badge tone="success">Đủ</Badge>
                          ) : null}
                        </div>
                      </Td>
                      <Td align="right" className="font-semibold">
                        {formatCurrency(p.amount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        {isFounder ? (
          <div className="xl:col-span-1">
            <BuildPayrollForm teachers={teachers ?? []} defaultMonth={currentMonth()} />
          </div>
        ) : null}
      </div>
    </>
  )
}
