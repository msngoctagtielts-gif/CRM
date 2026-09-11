import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { monthRange, previousMonth } from '@/lib/period'
import { readOperatingSettings } from '@/lib/settings'
import { pickReminders } from '@/lib/month-end/reminders'

/**
 * Bản tóm tắt chốt tháng, dành cho job nhắc việc chạy ngoài ứng dụng.
 *
 *   POST /api/cron/month-end-digest          → tháng vừa kết thúc
 *   POST /api/cron/month-end-digest?month=2026-08
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Chỉ trả về SỐ ĐẾM và SỐ TIỀN TỔNG, cố ý không trả tên học viên, tên phụ huynh
 * hay số điện thoại: nội dung này đi vào một issue trên GitHub và vào email
 * thông báo của GitHub, tức là ra khỏi vòng kiểm soát của hệ thống. Ai cần biết
 * chi tiết thì mở /month-end — ở đó có RLS canh.
 *
 * Dùng service role vì cron job không có phiên người dùng. Đây là một trong hai
 * chỗ duy nhất được phép dùng service role key.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET chưa được cấu hình trên server.' },
      { status: 500 },
    )
  }

  const header = request.headers.get('authorization') ?? ''
  if (header !== `Bearer ${secret}`) {
    // Không tiết lộ lý do cụ thể để tránh dò secret.
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const raw = new URL(request.url).searchParams.get('month')
  const month = /^\d{4}-\d{2}$/.test(raw ?? '') ? raw! : previousMonth()
  const { from, to, label } = monthRange(month)

  try {
    const supabase = createAdminClient()
    const settings = await readOperatingSettings(supabase)

    const [lessons, payrolls, balances, statements, consumptions, payments, expenses] =
      await Promise.all([
        supabase
          .from('v_lesson_reports')
          .select('lesson_id, lesson_status, report_status, actual_start_at, actual_end_at')
          .gte('lesson_date', from)
          .lte('lesson_date', to),
        supabase
          .from('v_teacher_payroll_summary')
          .select('teacher_name, final_amount, status')
          .eq('period_start', from)
          .eq('period_end', to),
        supabase
          .from('v_enrollment_balances')
          .select(
            'enrollment_id, student_id, enrollment_code, billing_mode, lessons_remaining, outstanding_amount, price_per_lesson, payer_name',
          )
          .eq('status', 'active'),
        supabase
          .from('tuition_statements')
          .select('enrollment_id, status, net_amount, paid_amount')
          .eq('period_start', from)
          .eq('period_end', to),
        // `!inner` để lọc theo ngày buổi học ngay ở máy chủ. Lọc trong JavaScript
        // sẽ đếm thiếu doanh thu khi tháng có nhiều buổi.
        supabase
          .from('lesson_consumptions')
          .select('recognized_amount, lessons!inner(lesson_date)')
          .gte('lessons.lesson_date', from)
          .lte('lessons.lesson_date', to),
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'confirmed')
          .gte('payment_date', from)
          .lte('payment_date', to),
        supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', from)
          .lte('expense_date', to),
      ])

    const failed = [lessons, payrolls, balances, statements, consumptions, payments, expenses].find(
      (r) => r.error,
    )
    if (failed?.error) {
      return NextResponse.json({ ok: false, error: failed.error.message }, { status: 500 })
    }

    const taught = (lessons.data ?? []).filter((l) => l.lesson_status === 'completed')
    const missingTime = taught.filter((l) => !l.actual_start_at || !l.actual_end_at)
    const missingReport = taught.filter(
      (l) =>
        l.report_status === null ||
        l.report_status === 'draft' ||
        l.report_status === 'incomplete',
    )

    const payrollRows = payrolls.data ?? []
    const unpaid = payrollRows.filter((p) => p.status !== 'paid')
    const sum = (rows: { amount: number | string | null }[] | null) =>
      (rows ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)

    const reminders = pickReminders({
      balances: balances.data ?? [],
      statements: statements.data ?? [],
      monthLabel: label,
      alertLessonsRemaining: settings.alertLessonsRemaining,
    })

    const revenueRecognized = (consumptions.data ?? []).reduce(
      (s, c) => s + Number(c.recognized_amount ?? 0),
      0,
    )
    const payrollTotal = payrollRows.reduce((s, p) => s + Number(p.final_amount ?? 0), 0)
    const expenseTotal = sum(expenses.data)

    return NextResponse.json({
      ok: true,
      month,
      label,
      generated_at: new Date().toISOString(),
      lessons: {
        taught: taught.length,
        missing_actual_time: missingTime.length,
        missing_report: missingReport.length,
        /** Tính lương lúc còn buổi thiếu giờ dạy là trả thiếu giáo viên. */
        payroll_blocked: missingTime.length > 0,
      },
      payroll: {
        periods: payrollRows.length,
        total: payrollTotal,
        unpaid_periods: unpaid.length,
        unpaid_total: unpaid.reduce((s, p) => s + Number(p.final_amount ?? 0), 0),
        /** Tên giáo viên là dữ liệu nội bộ nhưng không phải dữ liệu học viên. */
        unpaid_teachers: unpaid.map((p) => p.teacher_name).filter(Boolean),
      },
      tuition: {
        need_reminder: reminders.length,
        /** Đã hết hẳn tiền: hết buổi, học vượt, hoặc chưa lập phiếu tháng. */
        urgent: reminders.filter((r) => r.gap).length,
      },
      finance: {
        revenue_recognized: revenueRecognized,
        cash_received: sum(payments.data),
        payroll: payrollTotal,
        expenses: expenseTotal,
        /** Doanh thu ghi nhận trừ lương và chi phí trong kỳ. */
        profit: revenueRecognized - payrollTotal - expenseTotal,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
