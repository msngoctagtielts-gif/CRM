import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber } from '@/lib/format'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Cổng thông tin học viên' }

const KIEU_HOC_PHI: Record<
  string,
  { nhan: string; tone: 'success' | 'info' | 'warning' | 'neutral' }
> = {
  goi_tra_truoc: { nhan: 'Gói trả trước', tone: 'success' },
  hoc_theo_thang: { nhan: 'Học theo tháng', tone: 'info' },
  dang_doi_chieu: { nhan: 'Học phí đang đối chiếu', tone: 'warning' },
  chua_co_hop_dong: { nhan: 'Chưa có hợp đồng', tone: 'neutral' },
}

export default async function PortalPage() {
  await requireUser()
  const supabase = await createClient()

  const [{ data: hocVien }, { data: nhom }] = await Promise.all([
    supabase.from('v_portal_hoc_vien').select('*').order('ten_hoc_vien'),
    supabase.from('v_portal_hop_dong_nhom').select('*'),
  ])

  const rows = hocVien ?? []
  const nhomTheoHV = new Map((nhom ?? []).map((n) => [n.student_id, n]))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy-900 sm:text-2xl">
          {rows.length > 1 ? 'Các học viên của bạn' : 'Tình hình học tập'}
        </h1>
        <p className="mt-1.5 text-sm text-navy-500">
          Bấm vào từng học viên để xem chi tiết từng buổi học, video và nhận xét của giáo viên.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có hồ sơ nào"
          description="Tài khoản này chưa được liên kết với học viên nào. Vui lòng liên hệ trung tâm."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((h) => {
            const kieu = KIEU_HOC_PHI[h.kieu_hoc_phi ?? ''] ?? null
            const g = nhomTheoHV.get(h.student_id)
            return (
              <Card key={h.student_id} className="transition hover:border-navy-300">
                <Link href={`/portal/${h.student_id}`} className="block">
                  <CardBody className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-navy-900">{h.ten_hoc_vien}</p>
                      <p className="text-[0.8125rem] text-navy-500">
                        {h.ten_lop ?? 'Chưa xếp lớp'}
                        {h.giao_vien ? ` · ${h.giao_vien}` : ''}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 border-t border-navy-100 pt-3">
                      <div>
                        <dt className="text-xs text-navy-400">Tổng số buổi đã học</dt>
                        <dd className="tabular text-xl font-semibold text-navy-900">
                          {formatNumber(h.tong_buoi_da_hoc)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-navy-400">Buổi gần nhất</dt>
                        <dd className="tabular text-xl font-semibold text-navy-900">
                          {h.buoi_gan_nhat ? formatDate(h.buoi_gan_nhat) : '—'}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 pt-3">
                      {h.buoi_con_lai != null ? (
                        <Badge tone="success">
                          Còn {formatNumber(Number(h.buoi_con_lai), 0)} buổi
                        </Badge>
                      ) : kieu ? (
                        <Badge tone={kieu.tone}>{kieu.nhan}</Badge>
                      ) : null}
                      {g ? (
                        <span className="text-xs text-navy-500">
                          Học phí theo hợp đồng nhóm do {g.nguoi_dung_ten} đứng tên
                        </span>
                      ) : null}
                    </div>
                  </CardBody>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
