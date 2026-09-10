import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
} from '@/lib/format'
import {
  ATTENDANCE_STATUS,
  ENROLLMENT_STATUS,
  REPORT_STATUS,
  STUDENT_STATUS,
  missingFieldLabels,
} from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Hồ sơ học viên' }

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  const { data: student } = await supabase
    .from('v_student_overview')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  // RLS khiến giáo viên không dạy học viên này nhận về null ⇒ 404, không lộ dữ liệu.
  if (!student) notFound()

  const [finance, enrollments, attendance, reports, homework, recordings] = await Promise.all([
    isFounder
      ? supabase.from('v_student_finance').select('*').eq('student_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    isFounder
      ? supabase
          .from('v_enrollment_balances')
          .select('*')
          .eq('student_id', id)
          .order('start_date', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('attendance')
      .select('id, status, notes, lesson_id, lessons(lesson_date, duration_minutes, status)')
      .eq('student_id', id)
      .order('recorded_at', { ascending: false })
      .limit(12),
    supabase
      .from('teaching_report_students')
      // Chuỗi select phải là literal liền mạch — nối chuỗi sẽ làm mất kiểu.
      .select(
        'id, comments, attitude, performance, recommendation, homework_completion, report_id, teaching_reports(report_date, status, missing_fields, teacher_comments, lesson_content, lesson_id)',
      )
      .eq('student_id', id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('homework')
      .select('id, title, description, due_date, lesson_id, created_at')
      .or(`student_id.eq.${id},student_id.is.null`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('recordings')
      .select('id, url, title, created_at, lesson_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const statusMeta = student.status ? STUDENT_STATUS[student.status] : null
  const fin = finance.data

  return (
    <>
      <PageHeader
        title={student.full_name ?? 'Học viên'}
        description={[
          student.student_code,
          student.nickname ? `“${student.nickname}”` : null,
          student.age ? `${student.age} tuổi` : null,
          student.level_code,
        ]
          .filter(Boolean)
          .join(' · ')}
        action={statusMeta ? <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge> : null}
      />

      {isFounder && fin ? (
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Buổi đã mua" value={formatNumber(fin.lessons_purchased)} />
          <StatCard label="Buổi đã học" value={formatNumber(fin.lessons_completed)} accent="sage" />
          <StatCard label="Buổi còn lại" value={formatNumber(fin.lessons_remaining)} accent="gold" />
          <StatCard
            label="Công nợ"
            value={formatCurrency(fin.outstanding_amount)}
            accent={Number(fin.outstanding_amount) > 0 ? 'burgundy' : 'sage'}
          />
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Thông tin chung" />
          <CardBody>
            <dl className="space-y-3 text-[0.8125rem]">
              <Row label="Ngày sinh" value={formatDate(student.date_of_birth)} />
              <Row label="Chương trình" value={student.program_name ?? '—'} />
              <Row
                label="Cấp độ CEFR"
                value={student.level_name ? `${student.level_code} · ${student.level_name}` : '—'}
              />
              <Row label="Lớp hiện tại" value={student.class_name ?? '—'} />
              <Row label="Giáo viên" value={student.teacher_name ?? '—'} />
              <Row label="Ngày ghi danh" value={formatDate(student.enrollment_date)} />
              <Row label="Nguồn" value={student.source ?? '—'} />
              <div className="border-t border-navy-100 pt-3">
                <dt className="mnee-label">Phụ huynh</dt>
                <dd className="mt-1 text-navy-800">{student.parent_name ?? '—'}</dd>
                <dd className="tabular text-navy-500">{student.parent_phone ?? ''}</dd>
                <dd className="text-navy-500">{student.parent_email ?? ''}</dd>
              </div>
              {student.learning_goal ? (
                <div className="border-t border-navy-100 pt-3">
                  <dt className="mnee-label">Mục tiêu</dt>
                  <dd className="mt-1 leading-relaxed text-navy-700">{student.learning_goal}</dd>
                </div>
              ) : null}
              {student.learning_notes ? (
                <div className="border-t border-navy-100 pt-3">
                  <dt className="mnee-label">Ghi chú học tập</dt>
                  <dd className="mt-1 leading-relaxed whitespace-pre-line text-navy-700">
                    {student.learning_notes}
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-5 xl:col-span-2">
          {isFounder ? (
            <Card>
              <CardHeader
                title="Hợp đồng học phí"
                description="Đơn giá theo từng hợp đồng, không dùng giá chung"
              />
              {(enrollments.data ?? []).length === 0 ? (
                <EmptyState
                  title="Chưa có hợp đồng học phí"
                  description="Tạo hợp đồng để theo dõi số buổi và công nợ (Giai đoạn 2)."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Hợp đồng</Th>
                      <Th align="right">Đơn giá</Th>
                      <Th align="right">Buổi</Th>
                      <Th align="right">Đã trả</Th>
                      <Th align="right">Công nợ</Th>
                      <Th>Trạng thái</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(enrollments.data ?? []).map((e) => {
                      const meta = e.status ? ENROLLMENT_STATUS[e.status] : null
                      return (
                        <tr key={e.enrollment_id}>
                          <Td>
                            <p className="font-medium">{e.enrollment_code}</p>
                            <p className="text-xs text-navy-400">{formatDate(e.start_date)}</p>
                          </Td>
                          <Td align="right">{formatCurrency(e.price_per_lesson)}</Td>
                          <Td align="right">
                            {formatNumber(e.lessons_used)}/{formatNumber(e.lessons_purchased)}
                            <p className="text-xs text-navy-400">
                              còn {formatNumber(e.lessons_remaining)}
                            </p>
                          </Td>
                          <Td align="right">{formatCurrency(e.total_paid)}</Td>
                          <Td align="right">
                            {Number(e.outstanding_amount) > 0 ? (
                              <span className="font-semibold text-burgundy-700">
                                {formatCurrency(e.outstanding_amount)}
                              </span>
                            ) : (
                              <span className="text-navy-300">0</span>
                            )}
                          </Td>
                          <Td>{meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : '—'}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Nhận xét gần đây" description="Từ báo cáo giảng dạy" />
            {(reports.data ?? []).length === 0 ? (
              <EmptyState title="Chưa có nhận xét nào" />
            ) : (
              <ul className="divide-y divide-navy-100">
                {(reports.data ?? []).map((r) => {
                  const rep = r.teaching_reports as {
                    report_date: string
                    status: keyof typeof REPORT_STATUS
                    missing_fields: string[] | null
                    teacher_comments: string | null
                    lesson_content: string | null
                    lesson_id: string
                  } | null
                  const meta = rep?.status ? REPORT_STATUS[rep.status] : null
                  return (
                    <li key={r.id} className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[0.8125rem] font-medium text-navy-900">
                          {formatDate(rep?.report_date)}
                        </p>
                        {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
                      </div>
                      {rep?.lesson_content ? (
                        <p className="mt-1 text-[0.8125rem] text-navy-600">
                          <span className="mnee-label mr-1.5">Nội dung</span>
                          {rep.lesson_content}
                        </p>
                      ) : null}
                      {(r.comments ?? rep?.teacher_comments) ? (
                        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-700">
                          {r.comments ?? rep?.teacher_comments}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.attitude ? <Badge tone="info">Thái độ: {r.attitude}</Badge> : null}
                        {r.performance ? (
                          <Badge tone="info">Kết quả: {r.performance}</Badge>
                        ) : null}
                        {missingFieldLabels(rep?.missing_fields).map((f) => (
                          <Badge key={f} tone="danger">
                            Thiếu: {f}
                          </Badge>
                        ))}
                      </div>
                      {rep?.lesson_id ? (
                        <Link
                          href={`/reports/${rep.lesson_id}`}
                          className="mt-2 inline-block text-xs font-medium text-navy-600 hover:text-navy-900"
                        >
                          Mở báo cáo →
                        </Link>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader title="Điểm danh gần đây" />
              {(attendance.data ?? []).length === 0 ? (
                <EmptyState title="Chưa có dữ liệu điểm danh" />
              ) : (
                <ul className="divide-y divide-navy-100 text-[0.8125rem]">
                  {(attendance.data ?? []).map((a) => {
                    const lesson = a.lessons as {
                      lesson_date: string
                      duration_minutes: number | null
                    } | null
                    const meta = ATTENDANCE_STATUS[a.status]
                    return (
                      <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className="text-navy-700">
                          {formatDate(lesson?.lesson_date)}
                          <span className="ml-1.5 text-xs text-navy-400">
                            {formatDuration(lesson?.duration_minutes)}
                          </span>
                        </span>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Bài tập & recording" />
              <CardBody className="space-y-4">
                <div>
                  <p className="mnee-label">Bài tập gần đây</p>
                  {(homework.data ?? []).length === 0 ? (
                    <p className="mt-1 text-[0.8125rem] text-navy-400">Chưa có bài tập.</p>
                  ) : (
                    <ul className="mt-1.5 space-y-2">
                      {(homework.data ?? []).map((h) => (
                        <li key={h.id} className="text-[0.8125rem]">
                          <p className="font-medium text-navy-800">{h.title}</p>
                          <p className="text-xs text-navy-400">
                            {h.due_date ? `Hạn ${formatDate(h.due_date)}` : formatDate(h.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t border-navy-100 pt-3">
                  <p className="mnee-label">Recording</p>
                  {(recordings.data ?? []).length === 0 ? (
                    <p className="mt-1 text-[0.8125rem] text-navy-400">Chưa có recording.</p>
                  ) : (
                    <ul className="mt-1.5 space-y-1.5">
                      {(recordings.data ?? []).map((r) => (
                        <li key={r.id} className="text-[0.8125rem]">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy-600 underline underline-offset-2 hover:text-navy-900"
                          >
                            {r.title ?? formatDate(r.created_at)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-navy-400">{label}</dt>
      <dd className="text-right font-medium text-navy-800">{value}</dd>
    </div>
  )
}
