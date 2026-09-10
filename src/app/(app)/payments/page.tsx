import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod } from '@/lib/period'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { ENROLLMENT_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { PeriodFilter } from '@/components/PeriodFilter'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { PaymentForms } from './PaymentForms'

export const metadata: Metadata = { title: 'Thu học phí' }

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  await requireFounder()
  const sp = await searchParams
  const period = resolvePeriod(sp.period, sp.from, sp.to)
  const supabase = await createClient()

  const [{ data: payments }, { data: balances }, { data: students }, { data: classes }, { data: programs }, { data: packages }] =
    await Promise.all([
      supabase
        .from('payments')
        .select('*, students(id, full_name, student_code), student_enrollments(enrollment_code)')
        .gte('payment_date', period.from)
        .lte('payment_date', period.to)
        .order('payment_date', { ascending: false })
        .limit(200),
      supabase
        .from('v_enrollment_balances')
        .select('*')
        .in('status', ['active', 'paused'])
        .order('outstanding_amount', { ascending: false }),
      supabase
        .from('students')
        .select('id, full_name, student_code')
        .not('status', 'in', '("inactive")')
        .order('full_name')
        .limit(400),
      supabase.from('classes').select('id, name').eq('status', 'active').order('name'),
      supabase.from('programs').select('id, name_vi').eq('status', 'active').order('sort_order'),
      supabase
        .from('tuition_packages')
        .select('id, name, lesson_count, default_price_per_lesson')
        .eq('status', 'active')
        .order('name'),
    ])

  const cashInPeriod = (payments ?? [])
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = (balances ?? []).reduce((sum, b) => sum + Number(b.outstanding_amount ?? 0), 0)
  const deferred = (balances ?? []).reduce((sum, b) => sum + Number(b.deferred_revenue ?? 0), 0)

  const studentName = new Map((students ?? []).map((s) => [s.id, s]))
  const withDebt = (balances ?? []).filter((b) => Number(b.outstanding_amount ?? 0) > 0)

  return (
    <>
      <PageHeader
        title="Thu học phí"
        description="Tiền mặt đã thu và công nợ. Doanh thu ghi nhận được tính riêng theo buổi đã dạy."
      />

      <div className="mb-5">
        <PeriodFilter current={period.key} />
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={`Tiền mặt đã thu · ${period.label}`}
          value={formatCurrency(cashInPeriod)}
          caption="Dòng tiền vào"
          accent="sage"
        />
        <StatCard
          label="Công nợ học phí"
          value={formatCurrency(outstanding)}
          caption={`${withDebt.length} hợp đồng còn nợ`}
          accent="burgundy"
        />
        <StatCard
          label="Đã thu chưa dạy"
          value={formatCurrency(deferred)}
          caption="Nghĩa vụ phải dạy"
          accent="gold"
        />
      </section>

      <Alert kind="info" className="mb-5">
        <strong>Lưu ý kế toán:</strong> tiền thu trước cho các buổi chưa dạy chưa phải doanh thu. Số
        “Đã thu chưa dạy” là nghĩa vụ của trung tâm, và sẽ chuyển thành doanh thu dần theo từng buổi
        được dạy.
      </Alert>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Công nợ theo hợp đồng"
              description="Hợp đồng còn hiệu lực và chưa thanh toán đủ"
            />
            {withDebt.length === 0 ? (
              <EmptyState title="Không có công nợ" description="Mọi hợp đồng đã thanh toán đủ." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Học viên · Hợp đồng</Th>
                    <Th align="right">Đơn giá</Th>
                    <Th align="right">Tổng phải trả</Th>
                    <Th align="right">Đã trả</Th>
                    <Th align="right">Còn nợ</Th>
                    <Th align="right">Buổi còn lại</Th>
                  </tr>
                </thead>
                <tbody>
                  {withDebt.map((b) => {
                    const s = b.student_id ? studentName.get(b.student_id) : undefined
                    return (
                      <tr key={b.enrollment_id}>
                        <Td>
                          <Link
                            href={`/students/${b.student_id}`}
                            className="font-medium text-navy-900 hover:text-navy-600"
                          >
                            {s?.full_name ?? '—'}
                          </Link>
                          <p className="text-xs text-navy-400">{b.enrollment_code}</p>
                        </Td>
                        <Td align="right">{formatCurrency(b.price_per_lesson)}</Td>
                        <Td align="right">{formatCurrency(b.net_amount)}</Td>
                        <Td align="right">{formatCurrency(b.total_paid)}</Td>
                        <Td align="right" className="font-semibold text-burgundy-700">
                          {formatCurrency(b.outstanding_amount)}
                        </Td>
                        <Td align="right">{formatNumber(b.lessons_remaining)}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Lịch sử thanh toán"
              description={`${(payments ?? []).length} giao dịch trong kỳ`}
            />
            {(payments ?? []).length === 0 ? (
              <EmptyState title="Chưa có thanh toán trong kỳ này" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Mã</Th>
                    <Th>Ngày</Th>
                    <Th>Học viên</Th>
                    <Th>Hợp đồng</Th>
                    <Th>Hình thức</Th>
                    <Th align="right">Số tiền</Th>
                    <Th>Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {(payments ?? []).map((p) => {
                    const s = p.students as { id: string; full_name: string } | null
                    const e = p.student_enrollments as { enrollment_code: string | null } | null
                    const meta = PAYMENT_STATUS[p.status]
                    return (
                      <tr key={p.id}>
                        <Td className="tabular text-xs text-navy-400">{p.payment_code}</Td>
                        <Td className="whitespace-nowrap">{formatDate(p.payment_date)}</Td>
                        <Td className="font-medium">{s?.full_name ?? '—'}</Td>
                        <Td className="text-xs text-navy-400">{e?.enrollment_code ?? '—'}</Td>
                        <Td className="text-navy-600">{PAYMENT_METHOD[p.method]}</Td>
                        <Td align="right" className="font-semibold">
                          {formatCurrency(p.amount)}
                        </Td>
                        <Td>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="xl:col-span-1">
          <PaymentForms
            students={students ?? []}
            classes={classes ?? []}
            programs={programs ?? []}
            packages={packages ?? []}
            enrollments={(balances ?? []).map((b) => ({
              id: b.enrollment_id!,
              student_id: b.student_id!,
              label: `${b.enrollment_code} · còn nợ ${formatCurrency(b.outstanding_amount)}`,
              status: b.status ? ENROLLMENT_STATUS[b.status].label : '',
            }))}
          />
        </div>
      </div>
    </>
  )
}
