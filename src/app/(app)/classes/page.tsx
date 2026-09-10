import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration } from '@/lib/format'
import { CLASS_STATUS, CLASS_TYPE } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { ClassForm } from './ClassForm'

export const metadata: Metadata = { title: 'Lớp học' }

export default async function ClassesPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  const [{ data: classes }, { data: rosters }, { data: programs }, { data: levels }, { data: teachers }] =
    await Promise.all([
      supabase
        .from('classes')
        .select('*, teachers(full_name), programs(name_vi), levels(code)')
        .order('status')
        .order('name'),
      supabase.from('class_students').select('class_id, student_id').eq('status', 'active'),
      isFounder
        ? supabase.from('programs').select('id, name_vi').eq('status', 'active').order('sort_order')
        : Promise.resolve({ data: [] }),
      isFounder
        ? supabase.from('levels').select('id, code, name_vi').eq('status', 'active').order('sort_order')
        : Promise.resolve({ data: [] }),
      isFounder
        ? supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name')
        : Promise.resolve({ data: [] }),
    ])

  const countOf = (classId: string) =>
    (rosters ?? []).filter((r) => r.class_id === classId).length

  const list = (
    <Card>
      <CardHeader
        title={isFounder ? 'Tất cả lớp học' : 'Lớp tôi đang dạy'}
        description={`${(classes ?? []).length} lớp`}
      />
      {(classes ?? []).length === 0 ? (
        <EmptyState
          title="Chưa có lớp học nào"
          description={
            isFounder
              ? 'Tạo lớp ở biểu mẫu bên cạnh, sau đó thêm học viên và lịch học định kỳ.'
              : 'Bạn chưa được phân công lớp nào.'
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Lớp</Th>
              <Th>Hình thức</Th>
              <Th>Giáo viên</Th>
              <Th align="center">Học viên</Th>
              <Th>Thời lượng</Th>
              <Th>Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {(classes ?? []).map((c) => {
              const meta = CLASS_STATUS[c.status]
              const program = c.programs as { name_vi: string } | null
              const level = c.levels as { code: string } | null
              const teacher = c.teachers as { full_name: string } | null
              return (
                <tr key={c.id} className="hover:bg-navy-50/50">
                  <Td>
                    <Link
                      href={`/classes/${c.id}`}
                      className="font-medium text-navy-900 hover:text-navy-600"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-navy-400">
                      {c.class_code}
                      {program ? ` · ${program.name_vi}` : ''}
                      {level ? ` · ${level.code}` : ''}
                      {c.start_date ? ` · từ ${formatDate(c.start_date)}` : ''}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone="info">{CLASS_TYPE[c.class_type].short}</Badge>
                  </Td>
                  <Td className="text-navy-700">{teacher?.full_name ?? '—'}</Td>
                  <Td align="center">
                    {countOf(c.id)}/{c.max_students}
                  </Td>
                  <Td className="text-navy-600">
                    {formatDuration(c.default_duration_minutes)}
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
  )

  return (
    <>
      <PageHeader
        title={isFounder ? 'Lớp học' : 'Lớp của tôi'}
        description="Hỗ trợ lớp 1-1, 1-2 và nhóm nhỏ. Thời lượng chuẩn 60 phút, cho phép 30 / 60 / 90."
      />

      {isFounder ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">{list}</div>
          <div className="xl:col-span-1">
            <ClassForm
              programs={programs ?? []}
              levels={levels ?? []}
              teachers={teachers ?? []}
            />
          </div>
        </div>
      ) : (
        list
      )}
    </>
  )
}
