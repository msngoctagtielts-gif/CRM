import type { Metadata } from 'next'
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

export default async function PayrollPage() {
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

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
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
            <CardHeader title="Các kỳ lương" description="Nháp → chờ duyệt → đã duyệt → đã trả" />
            {rows.length === 0 ? (
              <EmptyState
                title="Chưa có kỳ lương nào"
                description={
                  isFounder
                    ? 'Tính bảng lương cho một giáo viên ở khung bên cạnh.'
                    : 'Founder chưa chốt kỳ lương nào cho bạn.'
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
