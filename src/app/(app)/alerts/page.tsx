import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/format'
import { missingFieldLabels } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { updateAlertStatus } from './actions'
import { RescanButton } from './RescanButton'

export const metadata: Metadata = { title: 'Cảnh báo chất lượng' }

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  await requireFounder()
  const { show } = await searchParams
  const supabase = await createClient()

  const statuses =
    show === 'resolved'
      ? (['resolved', 'dismissed'] as const)
      : (['new', 'acknowledged'] as const)

  const [{ data: alerts }, { count: openCount }, { count: resolvedCount }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .in('status', statuses)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['new', 'acknowledged']),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['resolved', 'dismissed']),
  ])

  return (
    <>
      <PageHeader
        title="Cảnh báo chất lượng"
        description="Báo cáo giảng dạy thiếu trường bắt buộc sau hạn 10 giờ kể từ khi buổi học kết thúc."
        action={<RescanButton />}
      />

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Đang mở"
          value={openCount ?? 0}
          accent={(openCount ?? 0) > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard label="Đã xử lý" value={resolvedCount ?? 0} accent="sage" />
        <StatCard label="Hạn nộp" value="10 giờ" caption="Sau khi buổi học kết thúc" accent="navy" />
      </section>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { value: '', label: 'Đang mở' },
          { value: 'resolved', label: 'Đã xử lý' },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/alerts?show=${f.value}` : '/alerts'}
            className={
              (show ?? '') === f.value
                ? 'rounded-lg bg-navy-800 px-3 py-1.5 text-[0.8125rem] font-medium text-white'
                : 'rounded-lg bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-navy-600 ring-1 ring-inset ring-navy-200 hover:bg-navy-50'
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {(alerts ?? []).length === 0 ? (
        <Card>
          <EmptyState
            title={show === 'resolved' ? 'Chưa có cảnh báo nào được xử lý' : 'Không có cảnh báo nào'}
            description={
              show === 'resolved'
                ? undefined
                : 'Toàn bộ báo cáo giảng dạy đã đủ bài tập, recording và nhận xét.'
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(alerts ?? []).map((a) => {
            const payload = (a.payload ?? {}) as Record<string, unknown>
            const missing = Array.isArray(payload.missing_fields)
              ? (payload.missing_fields as string[])
              : []
            const lessonId = typeof payload.lesson_id === 'string' ? payload.lesson_id : null
            return (
              <Card key={a.id} className="border-l-[3px] border-l-burgundy-700">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-burgundy-700" />
                      {a.title}
                    </span>
                  }
                  description={formatDateTime(a.created_at)}
                  action={
                    <Badge tone={a.status === 'new' ? 'danger' : 'warning'}>
                      {a.status === 'new'
                        ? 'Mới'
                        : a.status === 'acknowledged'
                          ? 'Đã xem'
                          : a.status === 'resolved'
                            ? 'Đã xử lý'
                            : 'Đã bỏ qua'}
                    </Badge>
                  }
                />
                <CardBody className="space-y-3">
                  <dl className="space-y-1 text-[0.8125rem]">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-navy-400">Học viên</dt>
                      <dd className="font-medium text-navy-900">
                        {String(payload.student_names ?? payload.class_name ?? '—')}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-navy-400">Giáo viên</dt>
                      <dd className="text-navy-800">
                        {String(payload.teacher_name ?? 'Chưa phân công')}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-navy-400">Hạn nộp</dt>
                      <dd className="text-navy-800">{formatDateTime(a.due_at)}</dd>
                    </div>
                  </dl>

                  <div>
                    <p className="mnee-label">Còn thiếu</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {missingFieldLabels(missing).map((f) => (
                        <Badge key={f} tone="danger">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 pt-3">
                    {lessonId ? (
                      <Link
                        href={`/reports/${lessonId}`}
                        className="inline-flex h-8 items-center rounded-lg bg-navy-800 px-3 text-[0.8125rem] font-medium text-white hover:bg-navy-700"
                      >
                        Mở báo cáo
                      </Link>
                    ) : null}
                    {a.status === 'new' ? (
                      <form action={updateAlertStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="acknowledged" />
                        <Button type="submit" variant="secondary" size="sm">
                          Đã xem
                        </Button>
                      </form>
                    ) : null}
                    {a.status !== 'resolved' && a.status !== 'dismissed' ? (
                      <form action={updateAlertStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="dismissed" />
                        <Button type="submit" variant="ghost" size="sm">
                          Bỏ qua
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-navy-400">
        Cảnh báo tự đóng khi giáo viên bổ sung đủ trường còn thiếu và lần quét tiếp theo chạy. Để tự
        động hoá, gọi <code className="rounded bg-navy-100 px-1">POST /api/cron/scan-reports</code>{' '}
        mỗi giờ từ n8n hoặc dùng pg_cron (xem supabase/README.md).
      </p>
    </>
  )
}
