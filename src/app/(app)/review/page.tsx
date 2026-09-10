import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/Table'
import { ResolveButton } from './ResolveButton'

export const metadata: Metadata = { title: 'Cần đối soát' }

/** Nhãn và đường dẫn tới màn hình sửa của từng loại dòng. */
const ENTITY: Record<string, { label: string; href?: (id: string) => string }> = {
  student: { label: 'Học viên', href: (id) => `/students/${id}` },
  class: { label: 'Lớp học', href: (id) => `/classes/${id}` },
  enrollment: { label: 'Hợp đồng học phí' },
  teacher: { label: 'Giáo viên' },
  payment: { label: 'Thanh toán' },
}

export default async function DataReviewPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('v_data_review')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  const items = rows ?? []
  const byType = new Map<string, number>()
  for (const r of items) {
    if (r.entity_type) byType.set(r.entity_type, (byType.get(r.entity_type) ?? 0) + 1)
  }

  return (
    <>
      <PageHeader
        title="Cần đối soát"
        description="Những dòng di trú từ Google Sheets có dữ liệu nghi vấn. Giá trị gốc được giữ nguyên để đối chiếu."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Tổng số dòng"
          value={items.length}
          accent={items.length > 0 ? 'gold' : 'sage'}
        />
        {['student', 'enrollment', 'payment'].map((t) => (
          <StatCard
            key={t}
            label={ENTITY[t].label}
            value={byType.get(t) ?? 0}
            accent={(byType.get(t) ?? 0) > 0 ? 'burgundy' : 'sage'}
          />
        ))}
      </section>

      <Alert kind="info" className="mb-5">
        Hệ thống <strong>không tự đoán</strong> giá trị đúng. Mỗi dòng ở đây giữ nguyên số liệu như
        trong sheet gốc kèm lý do nghi vấn; sửa ở màn hình của dòng đó rồi quay lại đánh dấu đã đối
        soát xong.
      </Alert>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="Không còn dòng nào cần đối soát"
            description="Mọi dữ liệu di trú đã được Founder xác nhận."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const meta = r.entity_type ? ENTITY[r.entity_type] : undefined
            const href = meta?.href && r.entity_id ? meta.href(r.entity_id) : null
            return (
              <Card key={`${r.entity_type}-${r.entity_id}`}>
                <CardHeader
                  title={
                    href ? (
                      <Link href={href} className="hover:text-navy-600">
                        {r.label ?? '—'}
                      </Link>
                    ) : (
                      (r.label ?? '—')
                    )
                  }
                  description={r.code ?? undefined}
                  action={<Badge tone="warning">{meta?.label ?? r.entity_type}</Badge>}
                />
                <CardBody className="space-y-3">
                  <p className="text-[0.8125rem] text-navy-700">{r.review_note ?? '—'}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-navy-400">
                      Nhập ngày {formatDate(r.created_at)}
                    </span>
                    {r.entity_type && r.entity_id ? (
                      <ResolveButton entityType={r.entity_type} entityId={r.entity_id} />
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
