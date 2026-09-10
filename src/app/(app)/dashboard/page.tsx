import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getFounderMetrics } from '@/lib/dashboard'
import { resolvePeriod } from '@/lib/period'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatTime,
} from '@/lib/format'
import { missingFieldLabels, PAYMENT_METHOD, CLASS_TYPE } from '@/lib/labels'
import { getOperatingSettings } from '@/lib/settings'
import { PeriodFilter } from '@/components/PeriodFilter'
import { RevenueTrendChart } from '@/components/charts/RevenueTrendChart'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Table, Td, Th, EmptyState } from '@/components/ui/Table'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata: Metadata = { title: 'Bảng điều khiển' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  await requireFounder()
  const sp = await searchParams
  const period = resolvePeriod(sp.period, sp.from, sp.to)
  const supabase = await createClient()
  const settings = await getOperatingSettings()

  const [metrics, alerts, dues, lowBalance, upcoming, recentPayments] = await Promise.all([
    getFounderMetrics(period),
    supabase
      .from('v_quality_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('v_enrollment_balances')
      .select('enrollment_id, student_id, outstanding_amount, lessons_remaining, status')
      .eq('status', 'active')
      .gt('outstanding_amount', 0)
      .order('outstanding_amount', { ascending: false })
      .limit(6),
    // D7: cho học vượt buổi, nhưng số buổi còn lại phải đập vào mắt Founder.
    // Chỉ có nghĩa với gói trả trước; hợp đồng cuối tháng trả NULL nên bị loại.
    supabase
      .from('v_enrollment_balances')
      .select('enrollment_id, student_id, lessons_remaining, price_per_lesson, payer_name, billing_mode')
      .eq('status', 'active')
      .eq('billing_mode', 'prepaid_package')
      .lte('lessons_remaining', settings.alertLessonsRemaining)
      .order('lessons_remaining', { ascending: true })
      .limit(8),
    supabase
      .from('v_lesson_reports')
      .select('lesson_id, class_name, class_type, teacher_name, scheduled_start_at, duration_minutes, student_names')
      .eq('lesson_status', 'scheduled')
      .gte('scheduled_start_at', new Date().toISOString())
      .order('scheduled_start_at', { ascending: true })
      .limit(6),
    supabase
      .from('payments')
      .select('id, payment_code, amount, payment_date, method, student_id, students(full_name)')
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Công nợ và số buổi còn lại cần tên học viên; view không join để RLS đơn giản.
  const dueStudentIds = [...(dues.data ?? []), ...(lowBalance.data ?? [])]
    .map((d) => d.student_id)
    .filter((id): id is string => !!id)
  const { data: dueStudents } = dueStudentIds.length
    ? await supabase.from('students').select('id, full_name, student_code').in('id', dueStudentIds)
    : { data: [] }
  const nameOf = new Map((dueStudents ?? []).map((s) => [s.id, s]))

  const delta = (now: number, before: number) => {
    if (before === 0) return null
    return ((now - before) / Math.abs(before)) * 100
  }

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description={`Sức khoẻ trung tâm · ${period.label} (${formatDate(period.from)} → ${formatDate(period.to)})`}
      />

      <div className="mb-6">
        <PeriodFilter current={period.key} />
      </div>

      {/* Hàng 1 — tiền */}
      <section aria-label="Chỉ số tài chính" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Doanh thu ghi nhận"
          value={formatCurrency(metrics.revenueRecognized)}
          caption={trendCaption(delta(metrics.revenueRecognized, metrics.previous.revenueRecognized))}
          accent="navy"
        />
        <StatCard
          label="Tổng chi phí"
          value={formatCurrency(metrics.totalExpenses)}
          caption={`Gồm lương GV ${formatCurrency(metrics.teacherPayroll)}`}
          accent="burgundy"
        />
        <StatCard
          label="Lợi nhuận gộp"
          value={formatCurrency(metrics.grossProfit)}
          caption={trendCaption(delta(metrics.grossProfit, metrics.previous.grossProfit))}
          accent={metrics.grossProfit >= 0 ? 'sage' : 'burgundy'}
        />
        <StatCard
          label="Công nợ học phí"
          value={formatCurrency(metrics.outstandingTuition)}
          caption="Tại thời điểm hiện tại"
          accent="gold"
        />
      </section>

      {/* Tách bạch dòng tiền với doanh thu — nguyên tắc mục XII */}
      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Tiền mặt đã thu trong kỳ"
          value={formatCurrency(metrics.cashReceived)}
          caption="Dòng tiền — không phải doanh thu"
          accent="gold"
        />
        <StatCard
          label="Học phí đã thu chưa dạy"
          value={formatCurrency(metrics.deferredRevenue)}
          caption="Nghĩa vụ phải dạy, chưa phải lợi nhuận"
          accent="navy"
        />
      </section>

      {/* Hàng 2 — vận hành */}
      <section aria-label="Chỉ số vận hành" className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Học viên đang học"
          value={formatNumber(metrics.students.active)}
          caption={`${metrics.students.new} mới · ${metrics.students.paused} tạm dừng · ${metrics.students.inactive} đã nghỉ`}
          accent="sage"
        />
        <StatCard label="Lớp đang mở" value={formatNumber(metrics.activeClasses)} accent="navy" />
        <StatCard
          label="Buổi đã dạy"
          value={formatNumber(metrics.lessonsCompleted)}
          caption={period.label}
          accent="navy"
        />
        <StatCard
          label="Giờ giảng dạy"
          value={formatDuration(metrics.teachingMinutes)}
          caption={
            metrics.retentionRate === null
              ? undefined
              : `Giữ học viên ${(metrics.retentionRate * 100).toFixed(0)}%`
          }
          accent="gold"
        />
      </section>

      {/* Hàng 3 — biểu đồ */}
      <Card className="mt-6">
        <CardHeader
          title="Doanh thu & dòng tiền"
          description="Hai chỉ số khác nhau, cố ý vẽ tách biệt"
        />
        <CardBody>
          <RevenueTrendChart data={metrics.revenueTrend} />
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Hàng 5 — cảnh báo chất lượng (đặt cao vì cần xử lý ngay) */}
        <Card>
          <CardHeader
            title="Cảnh báo chất lượng giảng dạy"
            description={`Báo cáo chưa đạt chất lượng sau ${settings.reportDeadlineHours} giờ`}
            action={
              <Link href="/alerts" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
                Xem tất cả
              </Link>
            }
          />
          {(alerts.data ?? []).length === 0 ? (
            <EmptyState
              title="Không có cảnh báo"
              description="Toàn bộ báo cáo giảng dạy đã đủ trường bắt buộc."
            />
          ) : (
            <ul className="divide-y divide-navy-100">
              {(alerts.data ?? []).map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-3 sm:px-5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-burgundy-600" strokeWidth={2} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-navy-900">
                      {a.student_names || a.class_name}
                    </p>
                    <p className="mt-0.5 text-xs text-navy-500">
                      {a.teacher_name ?? 'Chưa phân công'} · {formatDate(a.due_at)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {missingFieldLabels(
                        Array.isArray(a.missing_fields) ? (a.missing_fields as string[]) : [],
                      ).map((f) => (
                        <Badge key={f} tone="danger">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/reports/${a.lesson_id}`}
                    className="self-center text-xs font-medium text-navy-600 hover:text-navy-900"
                  >
                    Mở
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Hàng 4 — học phí đến hạn */}
        {/* Hàng 5b — sắp hết buổi hoặc đã học vượt (D7) */}
        <Card>
          <CardHeader
            title="Số buổi sắp hết / đã học vượt"
            description={`Còn ${settings.alertLessonsRemaining} buổi trở xuống. Số âm là đã học vượt gói.`}
            action={
              <Link href="/payments" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
                Gia hạn gói
              </Link>
            }
          />
          {(lowBalance.data ?? []).length === 0 ? (
            <EmptyState
              title="Không có học viên nào sắp hết buổi"
              description="Mọi gói trả trước đều còn đủ buổi."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Học viên</Th>
                  <Th>Người đóng</Th>
                  <Th align="right">Buổi còn lại</Th>
                  <Th align="right">Đơn giá</Th>
                </tr>
              </thead>
              <tbody>
                {(lowBalance.data ?? []).map((b) => {
                  const s = b.student_id ? nameOf.get(b.student_id) : undefined
                  const remaining = Number(b.lessons_remaining ?? 0)
                  return (
                    <tr key={b.enrollment_id}>
                      <Td>
                        <Link
                          href={`/students/${b.student_id}`}
                          className="font-medium text-navy-900 hover:text-navy-600"
                        >
                          {s?.full_name ?? '—'}
                        </Link>
                      </Td>
                      <Td className="text-navy-600">{b.payer_name ?? '—'}</Td>
                      <Td align="right">
                        {remaining < 0 ? (
                          <Badge tone="danger">học vượt {Math.abs(remaining)} buổi</Badge>
                        ) : (
                          <Badge tone={remaining === 0 ? 'danger' : 'warning'}>
                            {formatNumber(remaining)} buổi
                          </Badge>
                        )}
                      </Td>
                      <Td align="right">{formatCurrency(b.price_per_lesson)}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Học phí cần thu"
            description="Hợp đồng còn hiệu lực nhưng chưa thanh toán đủ"
            action={
              <Link href="/payments" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
                Ghi nhận thu
              </Link>
            }
          />
          {(dues.data ?? []).length === 0 ? (
            <EmptyState title="Không có công nợ" description="Mọi học viên đã đóng đủ học phí." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Học viên</Th>
                  <Th align="right">Còn lại</Th>
                  <Th align="right">Công nợ</Th>
                </tr>
              </thead>
              <tbody>
                {(dues.data ?? []).map((d) => {
                  const s = d.student_id ? nameOf.get(d.student_id) : undefined
                  return (
                    <tr key={d.enrollment_id}>
                      <Td>
                        <Link
                          href={`/students/${d.student_id}`}
                          className="font-medium text-navy-900 hover:text-navy-600"
                        >
                          {s?.full_name ?? '—'}
                        </Link>
                        <span className="ml-1.5 text-xs text-navy-400">{s?.student_code}</span>
                      </Td>
                      <Td align="right">{formatNumber(d.lessons_remaining)} buổi</Td>
                      <Td align="right" className="font-semibold text-burgundy-700">
                        {formatCurrency(d.outstanding_amount)}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Hàng 6 — buổi học tới */}
        <Card>
          <CardHeader title="Buổi học sắp tới" />
          {(upcoming.data ?? []).length === 0 ? (
            <EmptyState
              title="Chưa có buổi nào được lên lịch"
              description="Thêm lịch học định kỳ trong phần Lớp học."
            />
          ) : (
            <ul className="divide-y divide-navy-100">
              {(upcoming.data ?? []).map((l) => (
                <li key={l.lesson_id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="w-14 shrink-0 text-center">
                    <p className="tabular text-sm font-semibold text-navy-900">
                      {formatTime(l.scheduled_start_at)}
                    </p>
                    <p className="text-[0.6875rem] text-navy-400">
                      {formatDate(l.scheduled_start_at).slice(0, 5)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-navy-900">
                      {l.student_names || l.class_name}
                    </p>
                    <p className="truncate text-xs text-navy-500">
                      {l.teacher_name ?? 'Chưa phân công'} ·{' '}
                      {l.class_type ? CLASS_TYPE[l.class_type].short : '—'} ·{' '}
                      {formatDuration(l.duration_minutes)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Hàng 7 — thanh toán gần đây */}
        <Card>
          <CardHeader title="Thanh toán gần đây" />
          {(recentPayments.data ?? []).length === 0 ? (
            <EmptyState title="Chưa có thanh toán nào được ghi nhận" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Ngày</Th>
                  <Th>Học viên</Th>
                  <Th>Hình thức</Th>
                  <Th align="right">Số tiền</Th>
                </tr>
              </thead>
              <tbody>
                {(recentPayments.data ?? []).map((p) => (
                  <tr key={p.id}>
                    <Td className="whitespace-nowrap text-navy-500">{formatDate(p.payment_date)}</Td>
                    <Td className="font-medium">
                      {(p.students as { full_name: string } | null)?.full_name ?? '—'}
                    </Td>
                    <Td className="text-navy-500">{PAYMENT_METHOD[p.method]}</Td>
                    <Td align="right" className="font-semibold text-sage-700">
                      {formatCurrency(p.amount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-navy-400">
        Cập nhật {formatDateTime(new Date())}. Lợi nhuận gộp = doanh thu ghi nhận (buổi đã dạy) −
        chi phí − lương giáo viên phát sinh. Tiền mặt đã thu được hiển thị riêng vì đó là dòng tiền,
        không phải doanh thu.
      </p>
    </>
  )
}

function trendCaption(pct: number | null): string | undefined {
  if (pct === null) return undefined
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(0)}% so với kỳ trước`
}
