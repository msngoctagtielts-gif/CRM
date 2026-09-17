import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
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
    supabase.from('teacher_rates').select('*').order('effective_from', { ascending: false }),
    supabase.from('classes').select('id, teacher_id').eq('status', 'active'),
  ])

  // Lịch sử giảng dạy của từng người, kể cả người đã nghỉ. Dữ liệu buổi dạy và
  // lương không bao giờ bị xoá theo giáo viên, nên phần này vẫn đầy đủ sau
  // nhiều năm — đó là lý do lưu trữ giáo viên chứ không xoá hồ sơ.
  const { data: lichSu } = await supabase
    .from('v_luong_gv_thang')
    .select('teacher_id, thang, so_buoi, tien')

  const tongHop = new Map<string, { buoi: number; tien: number; thangCuoi: string }>()
  for (const r of lichSu ?? []) {
    const id = r.teacher_id ?? ''
    if (!id) continue
    const cu = tongHop.get(id) ?? { buoi: 0, tien: 0, thangCuoi: '' }
    const thang = r.thang ?? ''
    tongHop.set(id, {
      buoi: cu.buoi + Number(r.so_buoi ?? 0),
      tien: cu.tien + Number(r.tien ?? 0),
      thangCuoi: thang > cu.thangCuoi ? thang : cu.thangCuoi,
    })
  }

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
                      {tongHop.get(t.id) ? (
                        <p className="mt-0.5 text-xs text-navy-500">
                          {formatNumber(tongHop.get(t.id)!.buoi)} buổi · tổng{' '}
                          {formatCurrency(tongHop.get(t.id)!.tien)} · gần nhất{' '}
                          {tongHop.get(t.id)!.thangCuoi.slice(5, 7)}/
                          {tongHop.get(t.id)!.thangCuoi.slice(0, 4)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-navy-400">Chưa có buổi dạy nào</p>
                      )}
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
                        {t.status === 'active' ? 'Đang dạy' : 'Đã nghỉ'}
                      </Badge>
                      {t.ended_date ? (
                        <p className="mt-1 text-xs text-navy-400">từ {formatDate(t.ended_date)}</p>
                      ) : null}
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
          <TeacherForm
            teachers={(teachers ?? []).map((t) => ({ id: t.id, full_name: t.full_name }))}
          />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-navy-400">
        Giáo viên chưa có tài khoản vẫn được tính lương bình thường, nhưng không đăng nhập để ghi
        buổi học và nộp báo cáo được. Mời bằng khung bên trên.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-navy-400">
        Giáo viên ngừng cộng tác thì chuyển trạng thái sang <strong>Đã nghỉ</strong>, không xoá hồ
        sơ. Buổi dạy, lương và báo cáo của họ vẫn nằm nguyên trong hệ thống và vẫn tra cứu được
        nhiều năm sau — xoá hồ sơ sẽ làm hỏng lịch sử lương của chính những tháng đó.
      </p>
    </>
  )
}

function rateCell(amount: string | number | null) {
  return amount === null ? <span className="text-navy-300">—</span> : formatCurrency(amount)
}
