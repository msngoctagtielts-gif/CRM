import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod } from '@/lib/period'
import { formatDate, formatDuration, formatNumber, formatTime, todayISO } from '@/lib/format'
import { CLASS_TYPE, LESSON_STATUS, REPORT_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { PeriodFilter } from '@/components/PeriodFilter'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { LessonLogForm, type LopChon } from './LessonLogForm'

export const metadata: Metadata = { title: 'Buổi học' }

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const period = resolvePeriod(sp.period, sp.from, sp.to)
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  const { data: lessons } = await supabase
    .from('v_lesson_reports')
    .select('*')
    .gte('lesson_date', period.from)
    .lte('lesson_date', period.to)
    .order('scheduled_start_at', { ascending: false })
    .limit(400)

  // Danh sách lớp cho biểu mẫu ghi buổi. Giáo viên chỉ thấy lớp mình dạy — RLS
  // trên `classes` đã lọc sẵn, đây chỉ là nguồn cho ô chọn.
  const { data: lopRaw } = await supabase
    .from('classes')
    .select('id, name, teacher_id, teachers(display_name), class_students(status)')
    .eq('status', 'active')
    .order('name')

  const lops: LopChon[] = (lopRaw ?? []).map((c) => ({
    id: c.id,
    ten: c.name,
    teacher_id: c.teacher_id,
    teacher_ten: (c.teachers as { display_name: string | null } | null)?.display_name ?? null,
    si_so: ((c.class_students ?? []) as { status: string }[]).filter(
      (s) => s.status === 'active',
    ).length,
  }))

  const all = lessons ?? []
  const today = todayISO()
  const completed = all.filter((l) => l.lesson_status === 'completed')
  const minutes = completed.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)

  return (
    <>
      <PageHeader
        title="Buổi học"
        description="Lịch dạy, điểm danh và tình trạng báo cáo theo từng buổi."
      />

      <div className="mb-5">
        <PeriodFilter current={period.key} />
      </div>

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tổng buổi trong kỳ" value={formatNumber(all.length)} accent="navy" />
        <StatCard label="Đã dạy" value={formatNumber(completed.length)} accent="sage" />
        <StatCard label="Giờ giảng dạy" value={formatDuration(minutes)} accent="gold" />
        <StatCard
          label="Báo cáo quá hạn"
          value={formatNumber(all.filter((l) => l.is_overdue).length)}
          accent={all.some((l) => l.is_overdue) ? 'burgundy' : 'sage'}
        />
      </section>

      <div className="mb-5">
        <LessonLogForm lops={lops} />
      </div>

      <Card>
        <CardHeader
          title="Danh sách buổi học"
          description={`${formatDate(period.from)} → ${formatDate(period.to)}`}
        />
        {all.length === 0 ? (
          <EmptyState
            title="Không có buổi học nào trong kỳ này"
            description={
              isFounder
                ? 'Thêm lịch định kỳ trong trang Lớp học rồi sinh buổi học.'
                : 'Bạn chưa có buổi học nào trong khoảng thời gian này.'
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Ngày & giờ</Th>
                <Th>Lớp · Học viên</Th>
                {isFounder ? <Th>Giáo viên</Th> : null}
                <Th>Hình thức</Th>
                <Th>Thời lượng</Th>
                <Th align="center">Điểm danh</Th>
                <Th>Buổi học</Th>
                <Th>Báo cáo</Th>
              </tr>
            </thead>
            <tbody>
              {all.map((l) => {
                const lessonMeta = l.lesson_status ? LESSON_STATUS[l.lesson_status] : null
                const reportMeta = l.report_status ? REPORT_STATUS[l.report_status] : null
                const isToday = l.lesson_date === today
                return (
                  <tr
                    key={l.lesson_id}
                    className={isToday ? 'bg-gold-50/50' : l.is_overdue ? 'bg-burgundy-50/40' : undefined}
                  >
                    <Td className="whitespace-nowrap">
                      <p className="font-medium text-navy-900">
                        {formatDate(l.lesson_date)}
                        {isToday ? (
                          <span className="ml-1.5 text-xs font-normal text-gold-700">Hôm nay</span>
                        ) : null}
                      </p>
                      <p className="tabular text-xs text-navy-400">
                        {formatTime(l.scheduled_start_at)}
                      </p>
                    </Td>
                    <Td>
                      <Link
                        href={`/classes/${l.class_id}`}
                        className="text-[0.8125rem] font-medium text-navy-900 hover:text-navy-600"
                      >
                        {l.class_name}
                      </Link>
                      <p className="text-xs text-navy-400">{l.student_names ?? '—'}</p>
                    </Td>
                    {isFounder ? (
                      <Td className="text-[0.8125rem] text-navy-600">{l.teacher_name ?? '—'}</Td>
                    ) : null}
                    <Td>
                      <Badge tone="info">
                        {l.class_type ? CLASS_TYPE[l.class_type].short : '—'}
                      </Badge>
                    </Td>
                    <Td className="text-navy-600">{formatDuration(l.duration_minutes)}</Td>
                    <Td align="center" className="text-navy-600">
                      {l.attendance_count ?? 0}
                    </Td>
                    <Td>{lessonMeta ? <Badge tone={lessonMeta.tone}>{lessonMeta.label}</Badge> : '—'}</Td>
                    <Td>
                      <Link href={`/reports/${l.lesson_id}`}>
                        {reportMeta ? (
                          <Badge tone={l.is_overdue ? 'danger' : reportMeta.tone}>
                            {reportMeta.label}
                          </Badge>
                        ) : (
                          <Badge tone={l.is_overdue ? 'danger' : 'neutral'}>
                            {l.is_overdue ? 'Quá hạn' : 'Chưa có'}
                          </Badge>
                        )}
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
