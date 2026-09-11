import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { monthRange, previousMonth } from '@/lib/period'
import { getOperatingSettings } from '@/lib/settings'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { BILLING_MODE, PAYROLL_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { BuildAllPayrollForm, MonthPicker } from './MonthEndForms'
import { pickReminders, soanTinNhac } from '@/lib/month-end/reminders'
import { ReminderMessage } from './ReminderMessage'

export const metadata: Metadata = { title: 'Chốt tháng' }

/**
 * Màn hình CHỐT THÁNG — gom đúng nhịp vận hành của trung tâm vào một chỗ:
 * chốt sổ ngày cuối tháng, trả lương từ mùng 1 đến mùng 3, nhắc học phí, và
 * nhìn tình hình tháng vừa qua.
 *
 * Mỗi mục là một việc phải xong, xếp theo đúng thứ tự phải làm. Làm ngược thứ tự
 * sẽ sai: tính lương trước khi giáo viên bổ sung giờ dạy thì buổi đó rơi ra
 * ngoài kỳ lương.
 */
export default async function MonthEndPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await requireFounder()
  const sp = await searchParams
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? '') ? sp.month! : previousMonth()
  const { from, to, label } = monthRange(month)

  const supabase = await createClient()
  const settings = await getOperatingSettings()

  const [
    { data: lessons },
    { data: payrolls },
    { data: balances },
    { data: statements },
    { data: students },
    { data: consumptions },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from('v_lesson_reports')
      .select('lesson_id, teacher_name, lesson_date, lesson_status, report_status, missing_fields, actual_start_at, actual_end_at, student_names')
      .gte('lesson_date', from)
      .lte('lesson_date', to),
    supabase
      .from('v_teacher_payroll_summary')
      .select('*')
      .eq('period_start', from)
      .eq('period_end', to),
    supabase
      .from('v_enrollment_balances')
      .select('enrollment_id, student_id, enrollment_code, billing_mode, lessons_remaining, outstanding_amount, price_per_lesson, payer_name, total_paid, lessons_used, revenue_recognized')
      .eq('status', 'active'),
    supabase
      .from('tuition_statements')
      .select('id, enrollment_id, student_id, status, net_amount, paid_amount')
      .eq('period_start', from)
      .eq('period_end', to),
    supabase.from('students').select('id, full_name').limit(600),
    // `!inner` để PostgREST lọc NGAY Ở MÁY CHỦ theo ngày buổi học. Tải hết rồi
    // lọc bằng JavaScript sẽ đếm thiếu doanh thu khi số dòng vượt giới hạn — mà
    // đếm thiếu tiền thì không ai nhận ra cho tới lúc đối chiếu sổ sách.
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
  ])

  const nameOf = new Map((students ?? []).map((s) => [s.id, s.full_name]))
  const allLessons = lessons ?? []

  // --- Mục 1: buổi học có vấn đề, phải xử trước khi tính lương -------------
  const taught = allLessons.filter((l) => l.lesson_status === 'completed')
  const missingTime = taught.filter((l) => !l.actual_start_at || !l.actual_end_at)
  const missingReport = taught.filter(
    (l) => l.report_status === null || l.report_status === 'draft' || l.report_status === 'incomplete',
  )

  // --- Mục 2: lương -------------------------------------------------------
  const payrollRows = payrolls ?? []
  const payrollTotal = payrollRows.reduce((s, p) => s + Number(p.final_amount ?? 0), 0)
  const unpaidPayroll = payrollRows.filter((p) => p.status !== 'paid')

  // --- Mục 3: học phí cần nhắc --------------------------------------------

  const needReminder = pickReminders({
    balances: balances ?? [],
    statements: statements ?? [],
    monthLabel: label,
    alertLessonsRemaining: settings.alertLessonsRemaining,
  }).map((r) => ({
    ...r,
    b: r.balance,
    tin_nhan: soanTinNhac({
      hocVien: nameOf.get(r.balance.student_id!) ?? '',
      nguoiDong: r.balance.payer_name,
      lyDo: r.ly_do,
      soBuoiConLai: r.balance.lessons_remaining === null ? null : Number(r.balance.lessons_remaining),
      donGia: Number(r.balance.price_per_lesson ?? 0),
      congNo: Number(r.balance.outstanding_amount ?? 0),
      traTruoc: r.balance.billing_mode === 'prepaid_package',
    }),
  }))

  // --- Mục 4: tình hình tháng ---------------------------------------------
  const revenueRecognized = (consumptions ?? []).reduce(
    (s, c) => s + Number(c.recognized_amount ?? 0),
    0,
  )
  const cashReceived = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)

  const blocked = missingTime.length > 0

  return (
    <>
      <PageHeader
        title={`Chốt tháng ${label}`}
        description="Chốt sổ ngày cuối tháng · trả lương từ mùng 1 đến mùng 3 · nhắc và thu học phí."
        action={<MonthPicker month={month} />}
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Buổi đã dạy" value={taught.length} caption={`Tháng ${label}`} accent="navy" />
        <StatCard
          label="Chưa đủ điều kiện tính lương"
          value={missingTime.length}
          caption="Thiếu giờ dạy thực tế"
          accent={missingTime.length > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Lương phải trả"
          value={formatCurrency(payrollTotal)}
          caption={`${payrollRows.length} kỳ lương`}
          accent="gold"
        />
        <StatCard
          label="Cần nhắc học phí"
          value={needReminder.length}
          accent={needReminder.length > 0 ? 'burgundy' : 'sage'}
        />
      </section>

      {/* ---- Bước 1 ---------------------------------------------------- */}
      <Card className={blocked ? 'mb-5 ring-1 ring-burgundy-300' : 'mb-5'}>
        <CardHeader
          title="Bước 1 · Soát buổi học trước khi tính lương"
          description="Buổi thiếu giờ dạy thực tế sẽ KHÔNG vào bảng lương. Xử xong bước này rồi mới sang bước 2."
        />
        <CardBody className="space-y-4">
          {blocked ? (
            <Alert kind="danger" title={`${missingTime.length} buổi chưa có giờ dạy thực tế`}>
              Tính lương bây giờ thì những buổi này rơi ra ngoài kỳ lương, và giáo viên bị trả
              thiếu. Nhắc giáo viên bổ sung giờ dạy trước.
            </Alert>
          ) : (
            <Alert kind="success">
              Mọi buổi đã dạy trong tháng đều có giờ dạy thực tế. Tính lương được.
            </Alert>
          )}

          {missingTime.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Ngày</Th>
                  <Th>Học viên</Th>
                  <Th>Giáo viên</Th>
                  <Th>Việc cần làm</Th>
                </tr>
              </thead>
              <tbody>
                {missingTime.slice(0, 15).map((l) => (
                  <tr key={l.lesson_id}>
                    <Td className="whitespace-nowrap">{formatDate(l.lesson_date)}</Td>
                    <Td>{l.student_names ?? '—'}</Td>
                    <Td>{l.teacher_name ?? '—'}</Td>
                    <Td>
                      <Link
                        href={`/reports/${l.lesson_id}`}
                        className="font-medium text-navy-700 hover:text-navy-900"
                      >
                        Mở báo cáo để bổ sung giờ →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}

          {missingReport.length > 0 ? (
            <p className="text-[0.8125rem] text-navy-600">
              Ngoài ra có <strong>{missingReport.length} báo cáo</strong> chưa đạt đủ tiêu chí chất
              lượng.{' '}
              <Link href="/reports" className="font-medium text-navy-700 hover:text-navy-900">
                Xem danh sách báo cáo
              </Link>
              . Việc này <em>không</em> chặn trả lương — trung tâm vẫn trả, chỉ gắn cờ.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* ---- Bước 2 ---------------------------------------------------- */}
      <Card className="mb-5">
        <CardHeader
          title="Bước 2 · Tính và trả lương"
          description="Chốt ngày cuối tháng, trả từ mùng 1 đến mùng 3."
          action={
            <Link href="/payroll" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
              Trang bảng lương
            </Link>
          }
        />
        <CardBody className="space-y-4">
          <BuildAllPayrollForm month={month} />

          {payrollRows.length === 0 ? (
            <p className="text-[0.8125rem] text-navy-400">
              Chưa có kỳ lương nào cho tháng {label}. Bấm nút trên để tính.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Giáo viên</Th>
                  <Th align="right">Số buổi</Th>
                  <Th align="right">Giờ dạy</Th>
                  <Th align="right">Thực nhận</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map((p) => {
                  const meta = p.status ? PAYROLL_STATUS[p.status] : null
                  return (
                    <tr key={p.payroll_id}>
                      <Td className="font-medium">
                        <Link
                          href={`/payroll/${p.payroll_id}`}
                          className="text-navy-900 hover:text-navy-600"
                        >
                          {p.teacher_name}
                        </Link>
                      </Td>
                      <Td align="right">{formatNumber(p.lessons_count)}</Td>
                      <Td align="right">{formatNumber(p.teaching_hours, 1)} h</Td>
                      <Td align="right" className="font-semibold">
                        {formatCurrency(p.final_amount)}
                      </Td>
                      <Td>{meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}

          {unpaidPayroll.length > 0 ? (
            <p className="text-[0.8125rem] text-navy-600">
              Còn <strong>{unpaidPayroll.length} kỳ chưa trả</strong>. Mở từng kỳ để duyệt rồi đánh
              dấu đã trả — cơ sở dữ liệu bắt buộc duyệt trước, trả sau.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* ---- Bước 3 ---------------------------------------------------- */}
      <Card className="mb-5">
        <CardHeader
          title="Bước 3 · Nhắc và thu học phí"
          description={`Gói trả trước: còn ${settings.alertLessonsRemaining} buổi trở xuống. Cuối tháng: lập phiếu rồi thu.`}
          action={
            <Link href="/statements" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
              Phiếu học phí tháng
            </Link>
          }
        />
        {needReminder.length === 0 ? (
          <EmptyState
            title="Không ai cần nhắc"
            description="Mọi hợp đồng đều còn đủ buổi và không có công nợ."
          />
        ) : (
          <CardBody className="space-y-5">
            {needReminder.map(({ b, ly_do, gap, tin_nhan }) => (
              <div
                key={b.enrollment_id}
                className="space-y-3 border-t border-navy-100 pt-5 first:border-0 first:pt-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/students/${b.student_id}`}
                      className="text-[0.9375rem] font-semibold text-navy-900 hover:text-navy-600"
                    >
                      {nameOf.get(b.student_id!) ?? b.enrollment_code}
                    </Link>
                    <p className="mt-0.5 text-xs text-navy-500">
                      Nhắn cho: <strong className="text-navy-700">{b.payer_name ?? '—'}</strong>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.billing_mode ? (
                      <Badge tone={b.billing_mode === 'prepaid_package' ? 'info' : 'gold'}>
                        {BILLING_MODE[b.billing_mode].short}
                      </Badge>
                    ) : null}
                    <Badge tone={gap ? 'danger' : 'warning'}>{ly_do}</Badge>
                  </div>
                </div>

                {/* Đối chiếu: đã đóng bao nhiêu, đã dùng bao nhiêu */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="mnee-label">Đã đóng</dt>
                    <dd className="tabular font-medium text-sage-700">
                      {formatCurrency(b.total_paid)}
                    </dd>
                  </div>
                  <div>
                    <dt className="mnee-label">Đã học</dt>
                    <dd className="tabular font-medium text-navy-900">
                      {formatNumber(b.lessons_used)} buổi
                    </dd>
                  </div>
                  <div>
                    <dt className="mnee-label">Đã dùng hết</dt>
                    <dd className="tabular font-medium text-navy-900">
                      {formatCurrency(b.revenue_recognized)}
                    </dd>
                  </div>
                  <div>
                    <dt className="mnee-label">Còn nợ</dt>
                    <dd
                      className={
                        Number(b.outstanding_amount ?? 0) > 0
                          ? 'tabular font-semibold text-burgundy-700'
                          : 'tabular font-medium text-navy-500'
                      }
                    >
                      {formatCurrency(b.outstanding_amount)}
                    </dd>
                  </div>
                </dl>

                <ReminderMessage text={tin_nhan} />
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      {/* ---- Bước 4 ---------------------------------------------------- */}
      <Card>
        <CardHeader
          title={`Bước 4 · Tình hình tháng ${label}`}
          description="Doanh thu ghi nhận và tiền mặt thu được là hai con số khác nhau — đừng gộp."
          action={
            <Link href="/dashboard" className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900">
              Bảng điều khiển
            </Link>
          }
        />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-[0.8125rem] lg:grid-cols-4">
            <div>
              <dt className="mnee-label">Doanh thu ghi nhận</dt>
              <dd className="tabular text-base font-semibold text-navy-900">
                {formatCurrency(revenueRecognized)}
              </dd>
              <dd className="mt-0.5 text-xs text-navy-400">Phần đã dạy xong trong tháng</dd>
            </div>
            <div>
              <dt className="mnee-label">Tiền mặt đã thu</dt>
              <dd className="tabular text-base font-semibold text-navy-900">
                {formatCurrency(cashReceived)}
              </dd>
              <dd className="mt-0.5 text-xs text-navy-400">Dòng tiền, chưa phải doanh thu</dd>
            </div>
            <div>
              <dt className="mnee-label">Lương giáo viên</dt>
              <dd className="tabular text-base font-semibold text-navy-900">
                {formatCurrency(payrollTotal)}
              </dd>
              <dd className="mt-0.5 text-xs text-navy-400">Theo buổi đã dạy trong tháng</dd>
            </div>
            <div>
              <dt className="mnee-label">Doanh thu trừ lương</dt>
              <dd
                className={
                  revenueRecognized - payrollTotal < 0
                    ? 'tabular text-base font-semibold text-burgundy-700'
                    : 'tabular text-base font-semibold text-sage-700'
                }
              >
                {formatCurrency(revenueRecognized - payrollTotal)}
              </dd>
              <dd className="mt-0.5 text-xs text-navy-400">Chưa trừ chi phí khác</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </>
  )
}

/**
 * Soạn tin nhắn nhắc học phí.
 *
 * Viết sẵn để Founder chỉ việc chép và gửi, nhưng **không tự gửi** — Founder đọc
 * lại và sửa trước khi gửi, vì mỗi phụ huynh một hoàn cảnh.
 */
