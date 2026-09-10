import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { currentMonth } from '@/lib/period'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { STATEMENT_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/Table'
import { BuildStatementForm, IssueStatementForm, PayStatementForm } from './StatementForms'

export const metadata: Metadata = { title: 'Phiếu học phí tháng' }

export default async function StatementsPage() {
  await requireFounder()
  const supabase = await createClient()

  const [{ data: statements }, { data: balances }, { data: students }] = await Promise.all([
    supabase
      .from('tuition_statements')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(200),
    supabase
      .from('v_enrollment_balances')
      .select('enrollment_id, student_id, enrollment_code, billing_mode, price_per_lesson, payer_name, status')
      .eq('billing_mode', 'monthly_postpaid')
      .in('status', ['active', 'paused']),
    supabase.from('students').select('id, full_name, student_code').limit(600),
  ])

  const studentById = new Map((students ?? []).map((s) => [s.id, s]))

  const rows = (statements ?? []).map((s) => ({
    ...s,
    student: studentById.get(s.student_id),
    outstanding: Math.max(0, Number(s.net_amount) - Number(s.paid_amount)),
  }))

  const unpaid = rows.filter((r) => r.status === 'issued' || r.status === 'partial')
  const drafts = rows.filter((r) => r.status === 'draft')
  const totalUnpaid = unpaid.reduce((sum, r) => sum + r.outstanding, 0)

  const monthlyEnrollments = (balances ?? []).map((b) => ({
    id: b.enrollment_id!,
    label: `${studentById.get(b.student_id!)?.full_name ?? b.enrollment_code} · ${formatCurrency(
      b.price_per_lesson,
    )}/buổi${b.payer_name ? ` · ${b.payer_name} đóng` : ''}`,
  }))

  return (
    <>
      <PageHeader
        title="Phiếu học phí tháng"
        description="Dành cho hợp đồng đóng cuối tháng: học trước, hết tháng đối soát rồi mới thu."
      />

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Chưa thu"
          value={formatCurrency(totalUnpaid)}
          caption={`${unpaid.length} phiếu đã gửi`}
          accent={totalUnpaid > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Phiếu nháp"
          value={drafts.length}
          caption="Chưa chốt, chưa gửi phụ huynh"
          accent={drafts.length > 0 ? 'gold' : 'sage'}
        />
        <StatCard
          label="Hợp đồng cuối tháng"
          value={monthlyEnrollments.length}
          caption="Cần lập phiếu mỗi tháng"
          accent="navy"
        />
      </section>

      <Alert kind="info" className="mb-5">
        <strong>Lưu ý kế toán:</strong> phiếu này là bản đối soát để <em>thu tiền</em>. Doanh thu
        của từng buổi đã được ghi nhận ngay khi buổi học hoàn tất, nên lập phiếu muộn không làm
        sai doanh thu.
      </Alert>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {rows.length === 0 ? (
            <Card>
              <EmptyState
                title="Chưa có phiếu học phí nào"
                description="Lập phiếu cho một hợp đồng đóng cuối tháng ở khung bên cạnh."
              />
            </Card>
          ) : (
            rows.map((r) => {
              const meta = STATEMENT_STATUS[r.status] ?? STATEMENT_STATUS.draft
              return (
                <Card key={r.id}>
                  <CardHeader
                    title={
                      <span>
                        {r.student ? (
                          <Link
                            href={`/students/${r.student_id}`}
                            className="hover:text-navy-600"
                          >
                            {r.student.full_name}
                          </Link>
                        ) : (
                          '—'
                        )}
                        <span className="ml-2 font-normal text-navy-400">
                          tháng {r.period_label ?? formatDate(r.period_start)}
                        </span>
                      </span>
                    }
                    description={`${formatDate(r.period_start)} – ${formatDate(r.period_end)}`}
                    action={<Badge tone={meta.tone}>{meta.label}</Badge>}
                  />
                  <CardBody className="space-y-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.8125rem] sm:grid-cols-4">
                      <div>
                        <dt className="mnee-label">Số buổi</dt>
                        <dd className="tabular font-medium text-navy-900">
                          {formatNumber(r.lessons_count)}
                        </dd>
                      </div>
                      <div>
                        <dt className="mnee-label">Thành tiền</dt>
                        <dd className="tabular font-medium text-navy-900">
                          {formatCurrency(r.gross_amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="mnee-label">Chiết khấu</dt>
                        <dd className="tabular text-navy-600">
                          −{formatCurrency(r.discount_amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="mnee-label">Phải thu</dt>
                        <dd className="tabular font-semibold text-navy-900">
                          {formatCurrency(r.net_amount)}
                        </dd>
                      </div>
                    </dl>

                    {Number(r.paid_amount) > 0 ? (
                      <p className="text-[0.8125rem] text-navy-600">
                        Đã thu{' '}
                        <span className="font-medium text-sage-700">
                          {formatCurrency(r.paid_amount)}
                        </span>
                        {r.outstanding > 0 ? (
                          <>
                            , còn thiếu{' '}
                            <span className="font-medium text-burgundy-700">
                              {formatCurrency(r.outstanding)}
                            </span>
                          </>
                        ) : null}
                        .
                      </p>
                    ) : null}

                    {r.issued_at ? (
                      <p className="text-xs text-navy-400">
                        Đã chốt {formatDate(r.issued_at)}
                        {r.due_date ? ` · hạn thanh toán ${formatDate(r.due_date)}` : ''}
                      </p>
                    ) : null}

                    {r.status === 'draft' ? <IssueStatementForm statementId={r.id} /> : null}

                    {r.status === 'issued' || r.status === 'partial' ? (
                      <PayStatementForm statementId={r.id} outstanding={r.outstanding} />
                    ) : null}
                  </CardBody>
                </Card>
              )
            })
          )}
        </div>

        <div className="xl:col-span-1">
          <BuildStatementForm
            enrollments={monthlyEnrollments}
            defaultMonth={currentMonth()}
          />
        </div>
      </div>
    </>
  )
}
