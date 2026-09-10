import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDeadline, formatDuration, formatTime } from '@/lib/format'
import { LESSON_STATUS, REPORT_STATUS, missingFieldLabels } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Báo cáo giảng dạy' }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const user = await requireUser()
  const { filter } = await searchParams
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  // RLS giới hạn phạm vi: giáo viên chỉ nhận buổi của lớp mình.
  let query = supabase
    .from('v_lesson_reports')
    .select('*')
    .order('scheduled_start_at', { ascending: false })
    .limit(120)

  if (filter === 'overdue') query = query.eq('is_overdue', true)
  else if (filter === 'pending') query = query.in('lesson_status', ['completed', 'scheduled'])

  const { data: rows, error } = await query

  const all = rows ?? []
  const needsAction = all.filter(
    (r) =>
      r.lesson_status === 'completed' &&
      (r.report_id === null || (r.missing_fields ?? []).length > 0),
  )
  const overdue = all.filter((r) => r.is_overdue)
  const upcoming = all.filter((r) => r.lesson_status === 'scheduled')

  return (
    <>
      <PageHeader
        title={isFounder ? 'Báo cáo giảng dạy' : 'Báo cáo của tôi'}
        description="Sau mỗi buổi học, báo cáo phải có đủ bài tập, link recording và nhận xét trong vòng 10 giờ."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Cần hoàn tất"
          value={needsAction.length}
          caption="Buổi đã dạy, báo cáo chưa đủ"
          accent={needsAction.length > 0 ? 'gold' : 'sage'}
        />
        <StatCard
          label="Quá hạn 10 giờ"
          value={overdue.length}
          accent={overdue.length > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard label="Buổi sắp tới" value={upcoming.length} accent="navy" />
        <StatCard
          label="Đã nộp đủ"
          value={all.filter((r) => r.report_status === 'submitted' || r.report_status === 'approved').length}
          accent="sage"
        />
      </section>

      {overdue.length > 0 ? (
        <Alert kind="danger" title={`${overdue.length} báo cáo đã quá hạn`} className="mb-5">
          Báo cáo quá hạn làm chậm bảng lương và khiến phụ huynh không nhận được thông tin. Hoàn tất
          các buổi bên dưới trước.
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { value: '', label: 'Tất cả' },
          { value: 'pending', label: 'Cần xử lý' },
          { value: 'overdue', label: 'Quá hạn' },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/reports?filter=${f.value}` : '/reports'}
            className={
              (filter ?? '') === f.value
                ? 'rounded-lg bg-navy-800 px-3 py-1.5 text-[0.8125rem] font-medium text-white'
                : 'rounded-lg bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-navy-600 ring-1 ring-inset ring-navy-200 hover:bg-navy-50'
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title="Buổi học & báo cáo" description={`${all.length} buổi gần nhất`} />
        {error ? (
          <EmptyState title="Không tải được dữ liệu" description={error.message} />
        ) : all.length === 0 ? (
          <EmptyState
            title="Chưa có buổi học nào"
            description={
              isFounder
                ? 'Tạo lớp học và sinh buổi học để bắt đầu ghi nhận báo cáo.'
                : 'Bạn chưa có buổi học nào được phân công.'
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Buổi học</Th>
                <Th>Học viên</Th>
                {isFounder ? <Th>Giáo viên</Th> : null}
                <Th>Trạng thái buổi</Th>
                <Th>Báo cáo</Th>
                <Th>Hạn nộp</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {all.map((r) => {
                const lessonMeta = r.lesson_status ? LESSON_STATUS[r.lesson_status] : null
                const reportMeta = r.report_status ? REPORT_STATUS[r.report_status] : null
                const deadline = formatDeadline(r.report_due_at)
                const missing = missingFieldLabels(r.missing_fields)
                return (
                  <tr key={r.lesson_id} className={r.is_overdue ? 'bg-burgundy-50/40' : undefined}>
                    <Td>
                      <p className="font-medium text-navy-900">{formatDate(r.lesson_date)}</p>
                      <p className="tabular text-xs text-navy-400">
                        {formatTime(r.scheduled_start_at)} · {formatDuration(r.duration_minutes)}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-[0.8125rem]">{r.student_names ?? r.class_name}</p>
                      <p className="text-xs text-navy-400">{r.class_code}</p>
                    </Td>
                    {isFounder ? (
                      <Td className="text-[0.8125rem] text-navy-600">{r.teacher_name ?? '—'}</Td>
                    ) : null}
                    <Td>{lessonMeta ? <Badge tone={lessonMeta.tone}>{lessonMeta.label}</Badge> : '—'}</Td>
                    <Td>
                      {reportMeta ? (
                        <Badge tone={reportMeta.tone}>{reportMeta.label}</Badge>
                      ) : (
                        <Badge tone="neutral">Chưa tạo</Badge>
                      )}
                      {missing.length > 0 ? (
                        <p className="mt-1 text-xs text-burgundy-700">Thiếu: {missing.join(', ')}</p>
                      ) : null}
                    </Td>
                    <Td>
                      {deadline ? (
                        <span
                          className={
                            deadline.overdue
                              ? 'inline-flex items-center gap-1 text-xs font-medium text-burgundy-700'
                              : 'inline-flex items-center gap-1 text-xs text-navy-500'
                          }
                        >
                          {deadline.overdue ? (
                            <AlertTriangle className="size-3.5" />
                          ) : (
                            <Clock className="size-3.5" />
                          )}
                          {deadline.label}
                        </span>
                      ) : (
                        <span className="text-xs text-navy-300">—</span>
                      )}
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/reports/${r.lesson_id}`}
                        className="text-[0.8125rem] font-medium text-navy-600 hover:text-navy-900"
                      >
                        {r.report_id ? 'Sửa' : 'Nhập'}
                      </Link>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
