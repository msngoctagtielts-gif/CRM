import Link from 'next/link'
import { notFound } from 'next/navigation'
import { batBuocDangNhap } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { gio, ngay, so, thu, tien } from '@/lib/dinh-dang'
import { Khung } from '@/components/Khung'
import { Nhan, The, TheDau, TheThan } from '@/components/The'
import type {
  PortalBuoiHoc,
  PortalHocPhi,
  PortalHocVien,
  PortalHopDongNhom,
  PortalLichHoc,
} from '@/types/portal.types'

const HINH_THUC: Record<string, string> = {
  prepaid_package: 'Gói trả trước',
  monthly_postpaid: 'Đóng theo tháng',
  undetermined: 'Chưa xác định',
}

export default async function TrangHocVien({ params }: { params: Promise<{ id: string }> }) {
  const nguoiDung = await batBuocDangNhap()
  const { id } = await params
  const supabase = await createClient()

  // Bốn view đều lọc cứng theo tài khoản đang đăng nhập ở tầng cơ sở dữ liệu.
  // Đổi id trên thanh địa chỉ sang học viên khác thì truy vấn trả về rỗng và
  // trang báo không tìm thấy — không phải vì giao diện chặn.
  const [{ data: hv }, { data: buoi }, { data: hocPhi }, { data: nhom }, { data: lich }] =
    await Promise.all([
      supabase.from('v_portal_hoc_vien').select('*').eq('student_id', id).maybeSingle(),
      supabase
        .from('v_portal_buoi_hoc')
        .select('*')
        .eq('student_id', id)
        .order('lesson_date', { ascending: false }),
      supabase.from('v_portal_hoc_phi').select('*').eq('student_id', id),
      supabase.from('v_portal_hop_dong_nhom').select('*').eq('student_id', id).maybeSingle(),
      supabase
        .from('v_portal_lich_hoc')
        .select('*')
        .eq('student_id', id)
        .order('ngay_ke_tiep')
        .order('start_time'),
    ])

  if (!hv) notFound()

  const em = hv as PortalHocVien
  const buoiRows = (buoi ?? []) as PortalBuoiHoc[]
  const phiRows = (hocPhi ?? []) as PortalHocPhi[]
  const g = nhom as PortalHopDongNhom | null
  const lichRows = (lich ?? []) as PortalLichHoc[]

  const coVideo = buoiRows.filter((b) => b.video).length
  const coNhanXet = buoiRows.filter((b) => b.can_cai_thien || b.diem_manh).length
  const dangDoiChieu = em.kieu_hoc_phi === 'dang_doi_chieu'

  return (
    <Khung tenNguoiDung={nguoiDung.full_name}>
      <p className="mb-4 text-sm">
        <Link href="/" className="text-navy-600 underline hover:text-navy-800">
          ← Về trang chính
        </Link>
      </p>

      <header className="mb-6">
        <h1 className="mnee-rule text-xl font-semibold text-navy-900 sm:text-2xl">
          {em.ten_hoc_vien}
        </h1>
        <p className="mt-2.5 text-[0.8125rem] text-navy-500">
          {em.ten_lop ?? 'Chưa xếp lớp'}
          {em.giao_vien ? ` · Giáo viên ${em.giao_vien}` : ''}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        {[
          { nhan: 'Buổi đã học', gt: so(em.tong_buoi_da_hoc) },
          { nhan: 'Buổi có video', gt: so(coVideo) },
          { nhan: 'Buổi có nhận xét', gt: so(coNhanXet) },
        ].map((o) => (
          <The key={o.nhan}>
            <TheThan>
              <p className="text-xs text-navy-400">{o.nhan}</p>
              <p className="tabular mt-1 text-2xl font-semibold text-navy-900">{o.gt}</p>
            </TheThan>
          </The>
        ))}
      </section>

      {lichRows.length > 0 ? (
        <The className="mb-6">
          <TheDau
            tieuDe="Lịch học hằng tuần"
            moTa="Lịch cố định của lớp. Nếu có buổi nghỉ hoặc học bù, trung tâm sẽ báo riêng."
          />
          <TheThan className="space-y-2">
            {lichRows.map((l, i) => (
              <div
                key={`${l.weekday}-${l.start_time}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-navy-100 pb-2 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-navy-900">
                  {thu(l.weekday)} · {gio(l.start_time)}
                  {l.duration_minutes ? ` · ${l.duration_minutes} phút` : ''}
                </p>
                <p className="text-[0.8125rem] text-navy-500">Buổi tới: {ngay(l.ngay_ke_tiep)}</p>
              </div>
            ))}
          </TheThan>
        </The>
      ) : null}

      <The className="mb-6">
        <TheDau tieuDe="Học phí" />
        {g ? (
          <TheThan>
            <p className="text-sm leading-relaxed text-navy-700">
              Lớp <strong>{g.ten_lop}</strong> là lớp nhóm {g.si_so} người. Học phí thuộc hợp đồng
              chung do <strong>{g.nguoi_dung_ten}</strong> đứng tên, nên không hiển thị ở đây.
            </p>
          </TheThan>
        ) : phiRows.length === 0 ? (
          <TheThan>
            <p className="text-sm text-navy-500">Chưa có hợp đồng học phí nào trong hệ thống.</p>
          </TheThan>
        ) : (
          <TheThan className="space-y-4">
            {phiRows.map((p) => (
              <div
                key={p.enrollment_code}
                className="border-b border-navy-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-navy-900">
                    {HINH_THUC[p.hinh_thuc ?? ''] ?? p.hinh_thuc}
                  </p>
                  <p className="text-xs text-navy-400">
                    {p.enrollment_code}
                    {p.start_date ? ` · từ ${ngay(p.start_date)}` : ''}
                  </p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-navy-400">Đơn giá mỗi buổi</dt>
                    <dd className="tabular text-sm font-medium">{tien(p.price_per_lesson)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">Buổi đã mua</dt>
                    <dd className="tabular text-sm font-medium">{so(p.lessons_purchased)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">Buổi còn lại</dt>
                    <dd className="tabular text-sm font-medium">
                      {dangDoiChieu ? 'đang đối chiếu' : so(p.lessons_remaining)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">Đã đóng</dt>
                    <dd className="tabular text-sm font-medium">{tien(p.da_dong)}</dd>
                  </div>
                </dl>
              </div>
            ))}
            {dangDoiChieu ? (
              <p className="rounded-md border border-amber-soft-100 bg-amber-soft-50 px-3 py-2 text-[0.8125rem] leading-relaxed text-amber-soft-700">
                Trung tâm đang đối chiếu lại số buổi của hợp đồng này, nên tạm thời chưa hiển thị số
                buổi còn lại. Quý vị cần con số chính xác ngay, vui lòng nhắn trực tiếp cho trung
                tâm.
              </p>
            ) : null}
          </TheThan>
        )}
      </The>

      <The>
        <TheDau
          tieuDe="Từng buổi học"
          moTa="Mới nhất trước. Nhận xét do chính giáo viên đứng lớp viết sau mỗi buổi."
        />
        {buoiRows.length === 0 ? (
          <TheThan>
            <p className="text-sm text-navy-500">Chưa có buổi học nào hoàn tất.</p>
          </TheThan>
        ) : (
          <TheThan className="space-y-5">
            {buoiRows.map((b) => (
              <article
                key={b.lesson_id}
                className="border-b border-navy-100 pb-5 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-navy-900">{ngay(b.lesson_date)}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-navy-400">
                    {b.duration_minutes ? <span>{b.duration_minutes} phút</span> : null}
                    {b.giao_vien ? <span>· {b.giao_vien}</span> : null}
                    {b.diem_danh === 'present' ? <Nhan mau="xanh">Có mặt</Nhan> : null}
                  </div>
                </div>

                {b.noi_dung ? (
                  <p className="mt-2 text-[0.8125rem] text-navy-600">
                    <span className="font-medium text-navy-800">Nội dung:</span> {b.noi_dung}
                  </p>
                ) : null}

                {b.diem_manh ? (
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy-800">
                    <span className="font-medium text-sage-700">Làm được:</span> {b.diem_manh}
                  </p>
                ) : null}

                {b.can_cai_thien ? (
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy-800">
                    <span className="font-medium text-burgundy-700">Cần cải thiện:</span>{' '}
                    {b.can_cai_thien}
                  </p>
                ) : null}

                {b.bai_tap ? (
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy-700">
                    <span className="font-medium text-navy-800">Bài tập về nhà:</span> {b.bai_tap}
                  </p>
                ) : null}

                {b.de_xuat ? (
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy-700">
                    <span className="font-medium text-navy-800">Đề xuất buổi tới:</span> {b.de_xuat}
                  </p>
                ) : null}

                {b.video ? (
                  <p className="mt-3">
                    <a
                      href={b.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-md border border-navy-200 px-3 py-1.5 text-[0.8125rem] font-medium text-navy-700 hover:border-navy-400"
                    >
                      Xem video buổi học
                    </a>
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-navy-400">Buổi này chưa có video.</p>
                )}
              </article>
            ))}
          </TheThan>
        )}
      </The>
    </Khung>
  )
}
