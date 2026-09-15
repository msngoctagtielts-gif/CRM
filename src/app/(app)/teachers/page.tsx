import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { TeacherForm } from './TeacherForm'
import { InviteTeacherForm } from './InviteTeacherForm'

export const metadata: Metadata = { title: 'Giáo viên' }

export default async function TeachersPage() {
  await requireFounder()
  const supabase = await createClient()

  const [{ data: teachers }, { data: rates }, { data: classCounts }] = await Promise.all([
    supabase
      .from('teachers')
      .select('*')
      .order('status', { ascending: true })
      .order('full_name', { ascending: true }),
    supabase
      .from('teacher_rates')
      .select('*')
      .order('effective_from', { ascending: false }),
    supabase.from('classes').select('id, teacher_id').eq('status', 'active'),
  ])

  const today = new Date().toISOString().slice(0, 10)

  /** Đơn giá đang có hiệu lực hôm nay, theo thời lượng. */
  const currentRate = (teacherId: string, minutes: number) =>
    (rates ?? []).find(
      (r) =>
        r.teacher_id === teacherId &&
        r.scope === 'duration' &&
        r.duration_minutes === minutes &&
        r.effective_from <= today &&
        (r.effective_to === null || r.effective_to >= today),
    )?.rate_amount ?? null

  const classesOf = (teacherId: string) =>
    (classCounts ?? []).filter((c) => c.teacher_id === teacherId).length

  return (
    <>
      <PageHeader
        title="Giáo viên"
        description="Đơn giá theo thời lượng buổi học. Đổi đơn giá không làm thay đổi lương các buổi đã dạy."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Danh sách giáo viên" />
          {(teachers ?? []).length === 0 ? (
            <EmptyState
              title="Chưa có giáo viên"
              description="Thêm giáo viên ở biểu mẫu bên cạnh."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Giáo viên</Th>
                  <Th align="center">Lớp đang dạy</Th>
                  <Th align="right">30 phút</Th>
                  <Th align="right">60 phút</Th>
                  <Th align="right">90 phút</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {(teachers ?? []).map((t) => (
                  <tr key={t.id}>
                    <Td>
                      <p className="font-medium text-navy-900">{t.full_name}</p>
                      <p className="text-xs text-navy-400">
                        {t.teacher_code}
                        {t.phone ? ` · ${t.phone}` : ''}
                        {t.hired_date ? ` · từ ${formatDate(t.hired_date)}` : ''}
                      </p>
                      {!t.user_id ? (
                        <p className="mt-0.5 text-xs text-amber-soft-700">
                          Chưa liên kết tài khoản đăng nhập
                        </p>
                      ) : null}
                    </Td>
                    <Td align="center">{classesOf(t.id)}</Td>
                    <Td align="right">{rateCell(currentRate(t.id, 30))}</Td>
                    <Td align="right">{rateCell(currentRate(t.id, 60))}</Td>
                    <Td align="right">{rateCell(currentRate(t.id, 90))}</Td>
                    <Td>
                      <Badge tone={t.status === 'active' ? 'success' : 'neutral'}>
                        {t.status === 'active' ? 'Đang dạy' : 'Lưu trữ'}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-5 xl:col-span-1">
          <InviteTeacherForm
            teachers={(teachers ?? [])
              .filter((t) => t.status === 'active' && !t.user_id)
              .map((t) => ({ id: t.id, ten: t.display_name ?? t.full_name, email: t.email }))}
          />
          <TeacherForm teachers={(teachers ?? []).map((t) => ({ id: t.id, full_name: t.full_name }))} />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-navy-400">
        Giáo viên chưa có tài khoản vẫn được tính lương bình thường, nhưng không đăng nhập để
        ghi buổi học và nộp báo cáo được. Mời bằng khung bên trên.
      </p>
    </>
  )
}

function rateCell(amount: string | number | null) {
  return amount === null ? (
    <span className="text-navy-300">—</span>
  ) : (
    formatCurrency(amount)
  )
}
