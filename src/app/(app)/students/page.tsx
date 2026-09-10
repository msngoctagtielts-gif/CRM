import type { Metadata } from 'next'
import type { Enums } from '@/types/database.types'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber } from '@/lib/format'
import { STUDENT_STATUS } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Học viên' }

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang học' },
  { value: 'trial', label: 'Học thử' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'lead', label: 'Tiềm năng' },
  { value: 'inactive', label: 'Đã nghỉ' },
] as const

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const user = await requireUser()
  const { q, status } = await searchParams
  const supabase = await createClient()
  const isFounder = user.role_code === 'founder'

  // RLS lo phần phạm vi: giáo viên chỉ nhận về học viên của lớp mình.
  let query = supabase
    .from('v_student_overview')
    .select('*')
    .order('full_name', { ascending: true })
    .limit(300)

  if (q) query = query.or(`full_name.ilike.%${q}%,student_code.ilike.%${q}%,nickname.ilike.%${q}%`)
  // status đến từ query string nên phải đối chiếu với danh sách cho phép
  // trước khi đưa vào truy vấn.
  const statusFilter = STATUS_FILTERS.map((f) => f.value).includes(
    status as (typeof STATUS_FILTERS)[number]['value'],
  )
    ? (status as Enums<'student_status'> | '')
    : ''
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: students, error } = await query

  // Chỉ Founder đọc được số liệu tài chính; giáo viên sẽ nhận mảng rỗng.
  const ids = (students ?? []).map((s) => s.id).filter((x): x is string => !!x)
  const { data: finance } = isFounder && ids.length
    ? await supabase
        .from('v_student_finance')
        .select('student_id, lessons_remaining, outstanding_amount')
        .in('student_id', ids)
    : { data: [] }
  const financeBy = new Map((finance ?? []).map((f) => [f.student_id, f]))

  return (
    <>
      <PageHeader
        title={isFounder ? 'Học viên' : 'Học viên của tôi'}
        description={
          isFounder
            ? 'Toàn bộ học viên của trung tâm, kèm số buổi còn lại và công nợ.'
            : 'Học viên thuộc các lớp bạn đang dạy.'
        }
        action={
          isFounder ? (
            <ButtonLink href="/students/new" size="sm">
              <Plus className="size-4" /> Thêm học viên
            </ButtonLink>
          ) : null
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-300" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm theo tên hoặc mã học viên"
            className="w-full rounded-lg border-0 bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-inset ring-navy-200 focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-navy-200"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy-800 px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-700"
        >
          Lọc
        </button>
      </form>

      <Card>
        {error ? (
          <EmptyState title="Không tải được danh sách" description={error.message} />
        ) : (students ?? []).length === 0 ? (
          <EmptyState
            title="Chưa có học viên nào"
            description={
              q || status
                ? 'Không có kết quả khớp bộ lọc hiện tại.'
                : isFounder
                  ? 'Thêm học viên đầu tiên để bắt đầu.'
                  : 'Bạn chưa được phân công lớp nào.'
            }
            action={
              isFounder && !q && !status ? (
                <ButtonLink href="/students/new" size="sm">
                  <Plus className="size-4" /> Thêm học viên
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Học viên</Th>
                <Th>Trạng thái</Th>
                <Th>Cấp độ</Th>
                <Th>Lớp · Giáo viên</Th>
                <Th>Phụ huynh</Th>
                {isFounder ? <Th align="right">Buổi còn lại</Th> : null}
                {isFounder ? <Th align="right">Công nợ</Th> : null}
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((s) => {
                const fin = s.id ? financeBy.get(s.id) : undefined
                const meta = s.status ? STUDENT_STATUS[s.status] : null
                return (
                  <tr key={s.id} className="hover:bg-navy-50/50">
                    <Td>
                      <Link
                        href={`/students/${s.id}`}
                        className="font-medium text-navy-900 hover:text-navy-600"
                      >
                        {s.full_name}
                      </Link>
                      <p className="text-xs text-navy-400">
                        {s.student_code}
                        {s.nickname ? ` · ${s.nickname}` : ''}
                        {s.age ? ` · ${s.age} tuổi` : ''}
                      </p>
                    </Td>
                    <Td>{meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : '—'}</Td>
                    <Td className="text-navy-600">{s.level_code ?? '—'}</Td>
                    <Td>
                      <p className="text-[0.8125rem]">{s.class_name ?? '—'}</p>
                      <p className="text-xs text-navy-400">{s.teacher_name ?? ''}</p>
                    </Td>
                    <Td>
                      <p className="text-[0.8125rem]">{s.parent_name ?? '—'}</p>
                      <p className="tabular text-xs text-navy-400">{s.parent_phone ?? ''}</p>
                    </Td>
                    {isFounder ? (
                      <Td align="right">
                        {fin ? formatNumber(fin.lessons_remaining) : '—'}
                      </Td>
                    ) : null}
                    {isFounder ? (
                      <Td align="right">
                        {fin && Number(fin.outstanding_amount) > 0 ? (
                          <span className="font-semibold text-burgundy-700">
                            {formatNumber(fin.outstanding_amount)}
                          </span>
                        ) : (
                          <span className="text-navy-300">0</span>
                        )}
                      </Td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {(students ?? []).length > 0 ? (
        <p className="mt-3 text-xs text-navy-400">
          {formatNumber((students ?? []).length)} học viên · cập nhật {formatDate(new Date())}
        </p>
      ) : null}
    </>
  )
}
