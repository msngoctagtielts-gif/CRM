import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { missingFieldLabels } from '@/lib/labels'
import { getOperatingSettings } from '@/lib/settings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { updateAlertStatus } from './actions'
import { RescanButton } from './RescanButton'

export const metadata: Metadata = { title: 'Việc cần xử lý' }

/**
 * Bốn mức ưu tiên, xếp theo TIỀN và theo TÍNH KHÔNG THỂ ĐẢO NGƯỢC — không xếp
 * theo ngày. Việc mức 1 để lâu thì càng khó lần ngược; việc mức 4 để một tuần
 * không mất gì.
 */
const UU_TIEN = [
  {
    uu_tien: 1,
    nhan: 'Tiền đang chảy sai',
    vi_sao: 'Đã trả ra mà chưa có đối ứng — để lâu càng khó lần ngược',
    vien: 'border-l-burgundy-700',
  },
  {
    uu_tien: 2,
    nhan: 'Tiền chưa thu được',
    vi_sao: 'Càng để lâu càng khó đòi',
    vien: 'border-l-gold-500',
  },
  {
    uu_tien: 3,
    nhan: 'Uy tín với phụ huynh',
    vi_sao: 'Không mất tiền, nhưng mất niềm tin',
    vien: 'border-l-navy-800',
  },
  {
    uu_tien: 4,
    nhan: 'Hồ sơ chưa đầy đủ',
    vi_sao: 'Làm dần được, nhưng thiếu thì không chấm được chất lượng',
    vien: 'border-l-sage-500',
  },
] as const

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  await requireFounder()
  const { show } = await searchParams
  const supabase = await createClient()
  const settings = await getOperatingSettings()

  const statuses =
    show === 'resolved' ? (['resolved', 'dismissed'] as const) : (['new', 'acknowledged'] as const)

  const [{ data: viecCanQuyet }, { data: alerts }, { count: openCount }, { count: resolvedCount }] =
    await Promise.all([
      supabase
        .from('v_viec_can_quyet')
        .select('*')
        .order('uu_tien')
        .order('so_tien', { ascending: false }),
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

  const dsQuyet = viecCanQuyet ?? []

  return (
    <>
      <PageHeader
        title="Việc cần xử lý"
        description="Mọi thứ đang chờ cô quyết, gom về một chỗ, xếp theo tiền trước."
        action={<RescanButton />}
      />

      {/*
        TRUNG TÂM QUYẾT ĐỊNH.

        Sơ đồ cô đưa ngày 22/09 có một tầng "AI Executive Manager tổng hợp toàn
        trung tâm và chỉ đưa cho cô những việc cần quyết định". Ý đúng, nhưng
        đây là một TRUY VẤN, không phải một tầng AI: mọi con số đã nằm sẵn trong
        cơ sở dữ liệu, cho máy đọc rồi kể lại chỉ thêm một chỗ có thể sai. Và
        một câu văn do AI viết thì không bấm vào được.
      */}
      {dsQuyet.length > 0 ? (
        <section className="mb-6 space-y-4">
          {UU_TIEN.map((muc) => {
            const nhom = dsQuyet.filter((v) => v.uu_tien === muc.uu_tien)
            if (nhom.length === 0) return null
            return (
              <div key={muc.uu_tien}>
                <p className="mb-2 flex items-baseline gap-2">
                  <span className="text-[0.8125rem] font-semibold text-navy-900">{muc.nhan}</span>
                  <span className="text-xs text-navy-400">{muc.vi_sao}</span>
                </p>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {nhom.map((v) => (
                    <Link
                      key={v.tieu_de}
                      href={v.duong_dan ?? '/dashboard'}
                      className={`block rounded-xl border-l-[3px] bg-white p-4 ring-1 ring-navy-200/70 transition-colors hover:ring-navy-300 ${muc.vien}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[0.9375rem] font-semibold text-navy-900">{v.tieu_de}</p>
                        <span className="shrink-0 text-right">
                          <span className="block text-lg leading-none font-semibold tabular-nums text-navy-900">
                            {formatNumber(v.so_luong)}
                          </span>
                          {Number(v.so_tien ?? 0) > 0 ? (
                            <span className="mt-0.5 block text-xs font-medium tabular-nums text-burgundy-700">
                              {formatCurrency(Number(v.so_tien))}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-600">
                        {v.mo_ta}
                      </p>
                      <p className="mt-2 border-t border-navy-100 pt-2 text-[0.8125rem] text-navy-700">
                        <span className="mnee-label mr-1.5">Việc cần làm</span>
                        {v.viec_can_lam}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <Card className="mb-6">
          <EmptyState
            title="Không còn việc nào chờ cô quyết"
            description="Chuỗi ghi nhận đang khép. Khi có buổi học mới hoặc học phí đến hạn, việc sẽ hiện lại ở đây."
          />
        </Card>
      )}

      <h2 className="mnee-rule mb-3 text-[0.9375rem] font-semibold text-navy-900">
        Cảnh báo số dư từng học viên
      </h2>

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Đang mở"
          value={openCount ?? 0}
          accent={(openCount ?? 0) > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard label="Đã xử lý" value={resolvedCount ?? 0} accent="sage" />
        <StatCard
          label="Hạn nộp"
          value={`${settings.reportDeadlineHours} giờ`}
          caption="Sau khi buổi học kết thúc"
          accent="navy"
        />
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
            title={
              show === 'resolved' ? 'Chưa có cảnh báo nào được xử lý' : 'Không có cảnh báo nào'
            }
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
