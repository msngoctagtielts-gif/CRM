import Link from 'next/link'
import { batBuocDangNhap } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ngay, so } from '@/lib/dinh-dang'
import { Khung } from '@/components/Khung'
import { Nhan, The, TheThan } from '@/components/The'
import type { PortalHocVien, PortalHopDongNhom } from '@/types/portal.types'

const KIEU: Record<string, { nhan: string; mau: 'xanh' | 'lam' | 'vang' | 'xam' }> = {
  goi_tra_truoc: { nhan: 'Gói trả trước', mau: 'xanh' },
  hoc_theo_thang: { nhan: 'Học theo tháng', mau: 'lam' },
  dang_doi_chieu: { nhan: 'Học phí đang đối chiếu', mau: 'vang' },
  chua_co_hop_dong: { nhan: 'Chưa có hợp đồng', mau: 'xam' },
}

export default async function TrangChinh() {
  const nguoiDung = await batBuocDangNhap()
  const supabase = await createClient()

  const [{ data: hv }, { data: nhom }] = await Promise.all([
    supabase.from('v_portal_hoc_vien').select('*').order('ten_hoc_vien'),
    supabase.from('v_portal_hop_dong_nhom').select('*'),
  ])

  const rows = (hv ?? []) as PortalHocVien[]
  const nhomTheoHV = new Map(((nhom ?? []) as PortalHopDongNhom[]).map((n) => [n.student_id, n]))

  return (
    <Khung tenNguoiDung={nguoiDung.full_name}>
      <div className="mb-6">
        <h1 className="mnee-rule text-xl font-semibold text-navy-900 sm:text-2xl">
          {rows.length > 1 ? 'Các học viên của bạn' : 'Tình hình học tập'}
        </h1>
        <p className="mt-2.5 text-[0.8125rem] text-navy-500">
          Bấm vào từng học viên để xem chi tiết từng buổi học, video và nhận xét của giáo viên.
        </p>
      </div>

      {rows.length === 0 ? (
        <The>
          <TheThan>
            <p className="font-medium text-navy-900">Chưa có hồ sơ nào</p>
            <p className="mt-1 text-[0.8125rem] text-navy-500">
              Tài khoản này chưa được liên kết với học viên nào. Vui lòng liên hệ trung tâm.
            </p>
          </TheThan>
        </The>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((h) => {
            const k = KIEU[h.kieu_hoc_phi ?? ''] ?? null
            const g = nhomTheoHV.get(h.student_id)
            return (
              <The key={h.student_id} className="transition hover:border-navy-300">
                <Link href={`/hoc-vien/${h.student_id}`} className="block">
                  <TheThan className="space-y-3">
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
                          {so(h.tong_buoi_da_hoc)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-navy-400">Buổi gần nhất</dt>
                        <dd className="tabular text-xl font-semibold text-navy-900">
                          {ngay(h.buoi_gan_nhat)}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 pt-3">
                      {h.buoi_con_lai != null ? (
                        <Nhan mau="xanh">Còn {so(h.buoi_con_lai)} buổi</Nhan>
                      ) : k ? (
                        <Nhan mau={k.mau}>{k.nhan}</Nhan>
                      ) : null}
                      {g ? (
                        <span className="text-xs text-navy-500">
                          Học phí theo hợp đồng nhóm do {g.nguoi_dung_ten} đứng tên
                        </span>
                      ) : null}
                    </div>
                  </TheThan>
                </Link>
              </The>
            )
          })}
        </div>
      )}
    </Khung>
  )
}
