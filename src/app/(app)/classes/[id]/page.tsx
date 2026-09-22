import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration, formatTime } from '@/lib/format'
import { CLASS_STATUS, CLASS_TYPE, LESSON_STATUS, REPORT_STATUS, WEEKDAYS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { SuaLop } from './SuaLop'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { ClassAdmin } from './ClassAdmin'

export const metadata: Metadata = { title: 'Chi tiết lớp học' }

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  const { data: cls } = await supabase
    .from('classes')
    .select('*, teachers(full_name), programs(name_vi), levels(code, name_vi)')
    .eq('id', id)
    .maybeSingle()

  if (!cls) notFound()

  const [{ data: roster }, { data: schedules }, { data: lessons }, { data: available }] =
    await Promise.all([
      supabase
        .from('class_students')
        .select('id, joined_at, status, student_id, students(id, full_name, student_code, status)')
        .eq('class_id', id)
        .order('joined_at'),
      supabase
        .from('class_schedules')
        .select('*')
        .eq('class_id', id)
        .eq('status', 'active')
        .order('weekday'),
      supabase
        .from('v_lesson_reports')
        .select('*')
        .eq('class_id', id)
        .order('scheduled_start_at', { ascending: false })
        .limit(25),
      isFounder
        ? supabase
            .from('students')
            .select('id, full_name, student_code')
            .in('status', ['active', 'trial', 'placement', 'lead'])
            .order('full_name')
            .limit(300)
        : Promise.resolve({ data: [] }),
    ])

  const statusMeta = CLASS_STATUS[cls.status]
  const teacher = cls.teachers as { full_name: string } | null
  const program = cls.programs as { name_vi: string } | null
  const level = cls.levels as { code: string; name_vi: string } | null
  const enrolledIds = new Set((roster ?? []).map((r) => r.student_id))

  // Danh sách giáo viên để đổi người phụ trách. Chỉ Founder được sửa nên chỉ
  // Founder mới phải trả giá cho truy vấn này.
  const { data: giaoVienList } = isFounder
    ? await supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name')
    : { data: [] }

  return (
    <>
      <PageHeader
        title={cls.name}
        description={[
          cls.class_code,
          CLASS_TYPE[cls.class_type].label,
          program?.name_vi,
          level ? `${level.code} · ${level.name_vi}` : null,
          formatDuration(cls.default_duration_minutes),
        ]
          .filter(Boolean)
          .join(' · ')}
        action={<Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
      />

      {isFounder ? (
        <div className="mb-5">
          <SuaLop
            classId={cls.id}
            name={cls.name}
            classCode={cls.class_code}
            teacherId={cls.teacher_id}
            status={cls.status}
            meetingUrl={cls.meeting_url}
            notes={cls.notes}
            giaoVienList={giaoVienList ?? []}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Học viên trong lớp"
              description={`${(roster ?? []).filter((r) => r.status === 'active').length}/${cls.max_students} chỗ`}
            />
            {(roster ?? []).length === 0 ? (
              <EmptyState title="Lớp chưa có học viên" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Học viên</Th>
                    <Th>Tham gia từ</Th>
                    <Th>Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {(roster ?? []).map((r) => {
                    const s = r.students as {
                      id: string
                      full_name: string
                      student_code: string | null
                    } | null
                    return (
                      <tr key={r.id}>
                        <Td>
                          <Link
                            href={`/students/${s?.id}`}
                            className="font-medium text-navy-900 hover:text-navy-600"
                          >
                            {s?.full_name ?? '—'}
                          </Link>
                          <span className="ml-1.5 text-xs text-navy-400">{s?.student_code}</span>
                        </Td>
                        <Td className="text-navy-500">{formatDate(r.joined_at)}</Td>
                        <Td>
                          <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>
                            {r.status === 'active' ? 'Đang học' : 'Đã rời lớp'}
                          </Badge>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Buổi học" description="25 buổi gần nhất" />
            {(lessons ?? []).length === 0 ? (
              <EmptyState
                title="Chưa có buổi học nào"
                description="Thêm lịch định kỳ rồi sinh buổi học cho khoảng ngày mong muốn."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Ngày</Th>
                    <Th>Giờ</Th>
                    <Th>Thời lượng</Th>
                    <Th>Buổi học</Th>
                    <Th>Báo cáo</Th>
                  </tr>
                </thead>
                <tbody>
                  {(lessons ?? []).map((l) => {
                    const lessonMeta = l.lesson_status ? LESSON_STATUS[l.lesson_status] : null
                    const reportMeta = l.report_status ? REPORT_STATUS[l.report_status] : null
                    return (
                      <tr key={l.lesson_id}>
                        <Td className="whitespace-nowrap">{formatDate(l.lesson_date)}</Td>
                        <Td className="tabular whitespace-nowrap text-navy-500">
                          {formatTime(l.scheduled_start_at)}
                        </Td>
                        <Td className="text-navy-500">{formatDuration(l.duration_minutes)}</Td>
                        <Td>{lessonMeta ? <Badge tone={lessonMeta.tone}>{lessonMeta.label}</Badge> : '—'}</Td>
                        <Td>
                          <Link
                            href={`/reports/${l.lesson_id}`}
                            className="inline-flex items-center gap-1.5"
                          >
                            {reportMeta ? (
                              <Badge tone={l.is_overdue ? 'danger' : reportMeta.tone}>
                                {reportMeta.label}
                              </Badge>
                            ) : (
                              <Badge tone={l.is_overdue ? 'danger' : 'neutral'}>
                                {l.is_overdue ? 'Chưa nộp — quá hạn' : 'Chưa có'}
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
        </div>

        <div className="space-y-5 xl:col-span-1">
          <Card>
            <CardHeader title="Lịch học định kỳ" />
            {(schedules ?? []).length === 0 ? (
              <EmptyState title="Chưa có lịch định kỳ" />
            ) : (
              <ul className="divide-y divide-navy-100 text-[0.8125rem]">
                {(schedules ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="font-medium text-navy-800">{WEEKDAYS[s.weekday]}</span>
                    <span className="tabular text-navy-600">
                      {s.start_time.slice(0, 5)} · {formatDuration(s.duration_minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {cls.meeting_url ? (
              <CardBody className="border-t border-navy-100">
                <a
                  href={cls.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] font-medium text-navy-600 underline underline-offset-2 hover:text-navy-900"
                >
                  Mở lớp học online →
                </a>
              </CardBody>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Thông tin" />
            <CardBody>
              <dl className="space-y-2.5 text-[0.8125rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Giáo viên</dt>
                  <dd className="font-medium text-navy-800">{teacher?.full_name ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Khai giảng</dt>
                  <dd className="font-medium text-navy-800">{formatDate(cls.start_date)}</dd>
                </div>
                {cls.notes ? (
                  <div className="border-t border-navy-100 pt-2.5">
                    <dt className="mnee-label">Ghi chú</dt>
                    <dd className="mt-1 leading-relaxed whitespace-pre-line text-navy-700">
                      {cls.notes}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>

          {isFounder ? (
            <ClassAdmin
              classId={cls.id}
              defaultDuration={cls.default_duration_minutes}
              students={(available ?? []).filter((s) => !enrolledIds.has(s.id))}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
