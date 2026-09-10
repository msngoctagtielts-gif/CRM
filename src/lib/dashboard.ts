import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { dayBoundsUTC, previousPeriod, type Period } from '@/lib/period'

export type FounderMetrics = {
  /** Doanh thu GHI NHẬN — phần học phí đã dạy xong trong kỳ. */
  revenueRecognized: number
  /** Tiền mặt THỰC THU trong kỳ. Không phải doanh thu. */
  cashReceived: number
  /** Chi phí trong kỳ, KHÔNG gồm lương giáo viên (tránh đếm hai lần). */
  expensesExcludingPayroll: number
  /** Lương giáo viên phát sinh trong kỳ, tính theo buổi đã dạy. */
  teacherPayroll: number
  /** Tổng chi phí = chi phí khác + lương giáo viên. */
  totalExpenses: number
  /** Lợi nhuận gộp = doanh thu ghi nhận − tổng chi phí. */
  grossProfit: number
  /** Công nợ học phí tại thời điểm hiện tại (không theo kỳ). */
  outstandingTuition: number
  /** Học phí đã thu trước nhưng chưa dạy — nghĩa vụ, không phải lợi nhuận. */
  deferredRevenue: number

  students: { active: number; new: number; paused: number; inactive: number; total: number }
  activeClasses: number
  lessonsCompleted: number
  teachingMinutes: number
  /** Tỷ lệ giữ học viên: đang học / (đang học + đã nghỉ trong kỳ). */
  retentionRate: number | null

  revenueTrend: { day: string; revenue: number; cash: number }[]
  previous: { revenueRecognized: number; cashReceived: number; grossProfit: number }
}

/**
 * Số liệu cho bảng điều khiển Founder.
 *
 * Đọc qua client có RLS ⇒ nếu một ngày nào đó Staff được vào trang này, họ sẽ
 * thấy 0 thay vì số liệu tài chính của trung tâm.
 */
export async function getFounderMetrics(period: Period): Promise<FounderMetrics> {
  const supabase = await createClient()
  const { startUTC, endUTC } = dayBoundsUTC(period)
  const prev = previousPeriod(period)
  const prevBounds = dayBoundsUTC({ ...period, from: prev.from, to: prev.to })

  const [
    consumptions,
    payments,
    expenses,
    payable,
    balances,
    students,
    classes,
    lessons,
    prevConsumptions,
    prevPayments,
    prevExpenses,
    prevPayable,
  ] = await Promise.all([
    supabase
      .from('lesson_consumptions')
      .select('recognized_amount, lessons_deducted, recognized_at')
      .gte('recognized_at', startUTC)
      .lte('recognized_at', endUTC),
    supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'confirmed')
      .gte('payment_date', period.from)
      .lte('payment_date', period.to),
    supabase
      .from('expenses')
      .select('amount, category, payroll_id')
      .gte('expense_date', period.from)
      .lte('expense_date', period.to),
    supabase
      .from('teacher_payable_lessons')
      .select('amount, duration_minutes')
      .gte('lesson_date', period.from)
      .lte('lesson_date', period.to),
    supabase
      .from('v_enrollment_balances')
      .select('outstanding_amount, deferred_revenue, status')
      .in('status', ['active', 'paused']),
    supabase.from('students').select('status, created_at'),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('lessons')
      .select('duration_minutes, status')
      .eq('status', 'completed')
      .gte('lesson_date', period.from)
      .lte('lesson_date', period.to),
    supabase
      .from('lesson_consumptions')
      .select('recognized_amount')
      .gte('recognized_at', prevBounds.startUTC)
      .lte('recognized_at', prevBounds.endUTC),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'confirmed')
      .gte('payment_date', prev.from)
      .lte('payment_date', prev.to),
    supabase
      .from('expenses')
      .select('amount, payroll_id')
      .gte('expense_date', prev.from)
      .lte('expense_date', prev.to),
    supabase
      .from('teacher_payable_lessons')
      .select('amount')
      .gte('lesson_date', prev.from)
      .lte('lesson_date', prev.to),
  ])

  const sum = <T>(rows: T[] | null, pick: (r: T) => unknown): number =>
    (rows ?? []).reduce((acc, r) => acc + num(pick(r)), 0)

  const revenueRecognized = sum(consumptions.data, (r) => r.recognized_amount)
  const cashReceived = sum(payments.data, (r) => r.amount)

  // Lương giáo viên đã hạch toán thành expenses thì không cộng thêm lần nữa.
  const expensesExcludingPayroll = sum(
    (expenses.data ?? []).filter((e) => e.payroll_id === null && e.category !== 'teacher_salary'),
    (r) => r.amount,
  )
  const teacherPayroll = sum(payable.data, (r) => r.amount)
  const totalExpenses = expensesExcludingPayroll + teacherPayroll

  const studentRows = students.data ?? []
  const inPeriod = (iso: string | null) =>
    !!iso && iso.slice(0, 10) >= period.from && iso.slice(0, 10) <= period.to

  const active = studentRows.filter((s) => s.status === 'active').length
  const inactive = studentRows.filter((s) => s.status === 'inactive').length

  const prevRevenue = sum(prevConsumptions.data, (r) => r.recognized_amount)
  const prevExpenseTotal =
    sum(
      (prevExpenses.data ?? []).filter((e) => e.payroll_id === null),
      (r) => r.amount,
    ) + sum(prevPayable.data, (r) => r.amount)

  return {
    revenueRecognized,
    cashReceived,
    expensesExcludingPayroll,
    teacherPayroll,
    totalExpenses,
    grossProfit: revenueRecognized - totalExpenses,
    outstandingTuition: sum(balances.data, (r) => r.outstanding_amount),
    deferredRevenue: sum(balances.data, (r) => r.deferred_revenue),

    students: {
      active,
      new: studentRows.filter((s) => inPeriod(s.created_at)).length,
      paused: studentRows.filter((s) => s.status === 'paused').length,
      inactive,
      total: studentRows.length,
    },
    activeClasses: classes.count ?? 0,
    lessonsCompleted: (lessons.data ?? []).length,
    teachingMinutes: sum(lessons.data, (r) => r.duration_minutes),
    retentionRate: active + inactive > 0 ? active / (active + inactive) : null,

    revenueTrend: buildTrend(period, consumptions.data ?? [], payments.data ?? []),
    previous: {
      revenueRecognized: prevRevenue,
      cashReceived: sum(prevPayments.data, (r) => r.amount),
      grossProfit: prevRevenue - prevExpenseTotal,
    },
  }
}

function buildTrend(
  period: Period,
  consumptions: { recognized_amount: number | string; recognized_at: string }[],
  payments: { amount: number | string; payment_date: string }[],
): { day: string; revenue: number; cash: number }[] {
  const days = new Map<string, { revenue: number; cash: number }>()

  for (let ms = Date.parse(`${period.from}T00:00:00Z`); ms <= Date.parse(`${period.to}T00:00:00Z`); ms += 86_400_000) {
    days.set(new Date(ms).toISOString().slice(0, 10), { revenue: 0, cash: 0 })
  }

  for (const c of consumptions) {
    // recognized_at là timestamptz; quy về ngày địa phương UTC+7.
    const day = new Date(Date.parse(c.recognized_at) + 7 * 3_600_000).toISOString().slice(0, 10)
    const entry = days.get(day)
    if (entry) entry.revenue += num(c.recognized_amount)
  }

  for (const p of payments) {
    const entry = days.get(p.payment_date)
    if (entry) entry.cash += num(p.amount)
  }

  return [...days.entries()].map(([day, v]) => ({ day, ...v }))
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
