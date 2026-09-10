import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod } from '@/lib/period'
import { formatCurrency, formatDate } from '@/lib/format'
import { EXPENSE_CATEGORY, PAYMENT_METHOD } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { PeriodFilter } from '@/components/PeriodFilter'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { ExpenseForm } from './ExpenseForm'

export const metadata: Metadata = { title: 'Chi phí' }

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; category?: string }>
}) {
  await requireFounder()
  const sp = await searchParams
  const period = resolvePeriod(sp.period, sp.from, sp.to)
  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', period.from)
    .lte('expense_date', period.to)
    .order('expense_date', { ascending: false })
    .limit(300)

  const category = sp.category && sp.category in EXPENSE_CATEGORY ? sp.category : undefined
  if (category) query = query.eq('category', category as keyof typeof EXPENSE_CATEGORY)

  const [{ data: expenses }, { data: payable }] = await Promise.all([
    query,
    supabase
      .from('teacher_payable_lessons')
      .select('amount')
      .gte('lesson_date', period.from)
      .lte('lesson_date', period.to),
  ])

  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
  const payrollAccrued = (payable ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  const byCategory = Object.keys(EXPENSE_CATEGORY).map((key) => ({
    key,
    label: EXPENSE_CATEGORY[key as keyof typeof EXPENSE_CATEGORY],
    total: (expenses ?? [])
      .filter((e) => e.category === key)
      .reduce((sum, e) => sum + Number(e.amount), 0),
  }))

  return (
    <>
      <PageHeader
        title="Chi phí"
        description="Chi phí vận hành của trung tâm. Lương giáo viên được tính tự động từ buổi đã dạy và hiển thị riêng."
      />

      <div className="mb-5">
        <PeriodFilter current={period.key} />
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={`Chi phí đã ghi nhận · ${period.label}`}
          value={formatCurrency(total)}
          accent="burgundy"
        />
        <StatCard
          label="Lương giáo viên phát sinh"
          value={formatCurrency(payrollAccrued)}
          caption="Tính từ buổi đã dạy, chưa nhập tay"
          accent="gold"
        />
        <StatCard
          label="Tổng chi trong kỳ"
          value={formatCurrency(total + payrollAccrued)}
          caption="Chi phí + lương giáo viên"
          accent="navy"
        />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader title="Theo hạng mục" description={period.label} />
            <CardBody>
              <ul className="space-y-2">
                {byCategory
                  .filter((c) => c.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((c) => (
                    <li key={c.key}>
                      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                        <span className="text-navy-700">{c.label}</span>
                        <span className="tabular font-medium text-navy-900">
                          {formatCurrency(c.total)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-100">
                        <div
                          className="h-full rounded-full bg-burgundy-700"
                          style={{ width: `${total > 0 ? (c.total / total) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                {byCategory.every((c) => c.total === 0) ? (
                  <li className="text-[0.8125rem] text-navy-400">
                    Chưa có chi phí nào trong kỳ này.
                  </li>
                ) : null}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Danh sách chi phí"
              description={`${(expenses ?? []).length} khoản`}
            />
            {(expenses ?? []).length === 0 ? (
              <EmptyState title="Chưa có chi phí trong kỳ này" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Ngày</Th>
                    <Th>Hạng mục</Th>
                    <Th>Nội dung</Th>
                    <Th>Nhà cung cấp</Th>
                    <Th>Hình thức</Th>
                    <Th align="right">Số tiền</Th>
                  </tr>
                </thead>
                <tbody>
                  {(expenses ?? []).map((e) => (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap">{formatDate(e.expense_date)}</Td>
                      <Td className="text-navy-600">{EXPENSE_CATEGORY[e.category]}</Td>
                      <Td>
                        <p className="font-medium">{e.description}</p>
                        {e.receipt_url ? (
                          <a
                            href={e.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-navy-500 underline underline-offset-2"
                          >
                            Hoá đơn
                          </a>
                        ) : null}
                      </Td>
                      <Td className="text-navy-500">{e.vendor ?? '—'}</Td>
                      <Td className="text-navy-500">{PAYMENT_METHOD[e.method]}</Td>
                      <Td align="right" className="font-semibold text-burgundy-700">
                        {formatCurrency(e.amount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="xl:col-span-1">
          <ExpenseForm />
        </div>
      </div>
    </>
  )
}
