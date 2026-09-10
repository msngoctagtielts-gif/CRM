import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatDuration, formatNumber } from '@/lib/format'
import { ADJUSTMENT_KIND, PAYABLE_STATUS, PAYROLL_STATUS, qcTone } from '@/lib/labels'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { AdjustmentForm, PayrollStatusForm } from '../PayrollForms'

export const metadata: Metadata = { title: 'Chi tiết kỳ lương' }

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const isFounder = user.role_code === 'founder'
  const supabase = await createClient()

  // RLS: giáo viên không thuộc kỳ lương này sẽ không đọc được dòng nào.
  const { data: payroll } = await supabase
    .from('v_teacher_payroll_summary')
    .select('*')
    .eq('payroll_id', id)
    .maybeSingle()

  if (!payroll) notFound()

  const [{ data: lessons }, { data: adjustments }] = await Promise.all([
    supabase
      .from('teacher_payable_lessons')
      .select('*, classes(name)')
      .eq('payroll_id', id)
      .order('lesson_date'),
    supabase
      .from('teacher_payroll_adjustments')
      .select('*')
      .eq('payroll_id', id)
      .order('created_at'),
  ])

  const rows = lessons ?? []
  const meta = payroll.status ? PAYROLL_STATUS[payroll.status] : null
  const locked = payroll.status === 'approved' || payroll.status === 'paid'
  const missingEvidence = rows.filter((r) => !r.has_video || !r.has_evidence).length

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/payroll"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="size-4" /> Danh sách kỳ lương
      </Link>

      <header className="mb-5">
        <h1 className="mnee-rule text-xl font-semibold text-navy-900">
          {payroll.teacher_name} · tháng {payroll.period_label ?? formatDate(payroll.period_start)}
        </h1>
        <p className="mt-2 text-[0.8125rem] text-navy-600">
          {formatDate(payroll.period_start)} – {formatDate(payroll.period_end)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
          {payroll.approved_at ? (
            <span className="text-xs text-navy-400">Duyệt {formatDate(payroll.approved_at)}</span>
          ) : null}
          {payroll.paid_at ? (
            <span className="text-xs text-navy-400">Trả {formatDate(payroll.paid_at)}</span>
          ) : null}
        </div>
      </header>

      <Card className="mb-5">
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[0.8125rem] sm:grid-cols-4">
            <div>
              <dt className="mnee-label">Số buổi</dt>
              <dd className="tabular font-medium text-navy-900">
                {formatNumber(payroll.lessons_count)}
              </dd>
            </div>
            <div>
              <dt className="mnee-label">Giờ dạy</dt>
              <dd className="tabular font-medium text-navy-900">
                {formatNumber(payroll.teaching_hours, 1)} h
              </dd>
            </div>
            <div>
              <dt className="mnee-label">Tiền buổi dạy</dt>
              <dd className="tabular font-medium text-navy-900">
                {formatCurrency(payroll.gross_amount)}
              </dd>
            </div>
            <div>
              <dt className="mnee-label">Thực nhận</dt>
              <dd className="tabular text-base font-semibold text-navy-900">
                {formatCurrency(payroll.final_amount)}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {isFounder && missingEvidence > 0 ? (
        <Alert kind="warning" title={`${missingEvidence} buổi thiếu bằng chứng chất lượng`} className="mb-5">
          Các buổi này <strong>vẫn được trả lương</strong> — chỉ gắn cờ để bạn nhắc giáo viên bổ
          sung video và timestamp.
        </Alert>
      ) : null}

      <Card className="mb-5">
        <CardHeader
          title="Các buổi trong kỳ"
          description="Số tiền mỗi buổi đã đóng băng từ lúc buổi đó đủ điều kiện"
        />
        {rows.length === 0 ? (
          <EmptyState
            title="Chưa có buổi nào trong kỳ"
            description="Tính lại kỳ lương để gom các buổi đủ điều kiện."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Ngày</Th>
                <Th>Lớp</Th>
                <Th align="right">Thời lượng</Th>
                <Th align="right">Đơn giá</Th>
                <Th>Chất lượng</Th>
                <Th align="right">Thành tiền</Th>
                <Th>Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cls = r.classes as { name: string } | null
                const status = r.status ? PAYABLE_STATUS[r.status] : null
                return (
                  <tr key={r.id}>
                    <Td className="whitespace-nowrap">{formatDate(r.lesson_date)}</Td>
                    <Td>{cls?.name ?? '—'}</Td>
                    <Td align="right">{formatDuration(r.duration_minutes)}</Td>
                    <Td align="right">{formatCurrency(r.rate_amount)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={qcTone(r.qc_score)}>{r.qc_score ?? 0}/100</Badge>
                        {r.has_video ? null : <Badge tone="warning">Thiếu video</Badge>}
                        {r.has_evidence ? null : <Badge tone="warning">Thiếu timestamp</Badge>}
                      </div>
                    </Td>
                    <Td align="right" className="font-semibold">
                      {formatCurrency(r.amount)}
                    </Td>
                    <Td>{status ? <Badge tone={status.tone}>{status.label}</Badge> : null}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mb-5">
        <CardHeader
          title="Điều chỉnh"
          description={
            locked
              ? 'Kỳ lương đã duyệt — không thêm điều chỉnh được nữa'
              : 'Thưởng, phụ cấp hoặc khoản trừ ngoài tiền buổi dạy'
          }
        />
        <CardBody className="space-y-4">
          {(adjustments ?? []).length === 0 ? (
            <p className="text-[0.8125rem] text-navy-400">Chưa có khoản điều chỉnh nào.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {(adjustments ?? []).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium text-navy-900">
                      {ADJUSTMENT_KIND[a.kind] ?? a.kind}
                    </p>
                    <p className="text-xs text-navy-500">{a.description}</p>
                  </div>
                  <span
                    className={
                      Number(a.amount) < 0
                        ? 'tabular shrink-0 font-semibold text-burgundy-700'
                        : 'tabular shrink-0 font-semibold text-sage-700'
                    }
                  >
                    {formatCurrency(a.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isFounder && !locked ? <AdjustmentForm payrollId={id} /> : null}
        </CardBody>
      </Card>

      {isFounder ? (
        <Card>
          <CardHeader
            title="Duyệt và trả lương"
            description="Phải duyệt trước khi đánh dấu đã trả — cơ sở dữ liệu bắt buộc thứ tự này"
          />
          <CardBody>
            {payroll.status === 'paid' ? (
              <p className="text-[0.8125rem] text-sage-700">
                Đã trả lương kỳ này{payroll.paid_at ? ` ngày ${formatDate(payroll.paid_at)}` : ''}.
              </p>
            ) : (
              <PayrollStatusForm payrollId={id} status={payroll.status ?? 'draft'} />
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
