import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Chi tiết học tập' }

const HINH_THUC: Record<string, string> = {
  prepaid_package: 'Gói trả trước',
  monthly_postpaid: 'Đóng theo tháng',
  undetermined: 'Chưa xác định',
}

export default async function PortalHocVienPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params
  const supabase = await createClient()

  // Cả ba view đều lọc cứng theo tài khoản đang đăng nhập ở tầng cơ sở dữ liệu.
  // Nếu ai đó đổi id trên thanh địa chỉ sang học viên khác, các truy vấn này
  // trả về rỗng và trang báo không tìm thấy — không phải vì giao diện chặn.
  const [{ data: hv }, { data: buoi }, { data: hocPhi }, { data: nhom }] = await Promise.all([
    supabase.from('v_portal_hoc_vien').select('*').eq('student_id', id).maybeSingle(),
    supabase
      .from('v_portal_buoi_hoc')
      .select('*')
      .eq('student_id', id)
      .order('lesson_date', { ascending: false }),
    supabase.from('v_portal_hoc_phi').select('*').eq('student_id', id),
    supabase.from('v_portal_hop_dong_nhom').select('*').eq('student_id', id).maybeSingle(),
  ])

  if (!hv) notFound()

  const buoiRows = buoi ?? []
  const coVideo = buoiRows.filter((b) => b.video).length
  const coNhanXet = buoiRows.filter((b) => b.can_cai_thien || b.diem_manh).length

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/portal" className="text-navy-600 underline hover:text-navy-800">
          ← Về trang chính
        </Link>
      </p>

      <header className="mb-6">
        <h1 className="text-xl font-semibold text-navy-900 sm:text-2xl">{hv.ten_hoc_vien}</h1>
        <p className="mt-1.5 text-sm text-navy-500">
          {hv.ten_lop ?? 'Chưa xếp lớp'}
          {hv.giao_vien ? ` · Giáo viên ${hv.giao_vien}` : ''}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardBody>
            <p className="text-xs text-navy-400">Buổi đã học</p>
            <p className="tabular mt-1 text-2xl font-semibold text-navy-900">
              {formatNumber(hv.tong_buoi_da_hoc)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-navy-400">Buổi có video</p>
            <p className="tabular mt-1 text-2xl font-semibold text-navy-900">{coVideo}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-navy-400">Buổi có nhận xét</p>
            <p className="tabular mt-1 text-2xl font-semibold text-navy-900">{coNhanXet}</p>
          </CardBody>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- Học phí */}
      <Card className="mb-6">
        <CardHeader title="Học phí" />
        {nhom ? (
          <CardBody>
            <p className="text-sm text-navy-700">
              Lớp <strong>{nhom.ten_lop}</strong> là lớp nhóm {nhom.si_so} người. Học phí thuộc hợp
              đồng chung do <strong>{nhom.nguoi_dung_ten}</strong> đứng tên, nên không hiển thị ở
              đây.
            </p>
          </CardBody>
        ) : (hocPhi ?? []).length === 0 ? (
          <CardBody>
            <p className="text-sm text-navy-500">Chưa có hợp đồng học phí nào trong hệ thống.</p>
          </CardBody>
        ) : (
          <CardBody className="space-y-4">
            {(hocPhi ?? []).map((p) => {
              const conLai = p.lessons_remaining == null ? null : Number(p.lessons_remaining)
              const dangDoiChieu = hv.kieu_hoc_phi === 'dang_doi_chieu'
              return (
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
                      {p.start_date ? ` · từ ${formatDate(p.start_date)}` : ''}
                    </p>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-navy-400">Đơn giá mỗi buổi</dt>
                      <dd className="tabular text-sm font-medium">
                        {p.price_per_lesson ? formatCurrency(p.price_per_lesson) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-navy-400">Buổi đã mua</dt>
                      <dd className="tabular text-sm font-medium">
                        {p.lessons_purchased == null
                          ? '—'
                          : formatNumber(Number(p.lessons_purchased), 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-navy-400">Buổi còn lại</dt>
                      <dd className="tabular text-sm font-medium">
                        {dangDoiChieu || conLai == null
                          ? 'đang đối chiếu'
                          : formatNumber(conLai, 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-navy-400">Đã đóng</dt>
                      <dd className="tabular text-sm font-medium">{formatCurrency(p.da_dong)}</dd>
                    </div>
                  </dl>
                </div>
              )
            })}
            {hv.kieu_hoc_phi === 'dang_doi_chieu' ? (
              <Alert kind="info">
                Trung tâm đang đối chiếu lại số buổi của hợp đồng này, nên tạm thời chưa hiển thị số
                buổi còn lại. Quý vị cần con số chính xác ngay, vui lòng nhắn trực tiếp cho trung
                tâm.
              </Alert>
            ) : null}
          </CardBody>
        )}
      </Card>

      {/* ------------------------------------------------------------ Từng buổi học */}
      <Card>
        <CardHeader
          title="Từng buổi học"
          description="Mới nhất trước. Nhận xét do chính giáo viên đứng lớp viết sau mỗi buổi."
        />
        {buoiRows.length === 0 ? (
          <EmptyState title="Chưa có buổi học nào" description="Chưa có buổi học nào hoàn tất." />
        ) : (
          <CardBody className="space-y-5">
            {buoiRows.map((b) => (
              <article
                key={b.lesson_id}
                className="border-b border-navy-100 pb-5 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-navy-900">{formatDate(b.lesson_date)}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-navy-400">
                    {b.duration_minutes ? <span>{b.duration_minutes} phút</span> : null}
                    {b.giao_vien ? <span>· {b.giao_vien}</span> : null}
                    {b.diem_danh === 'present' ? (
                      <Badge tone="success">Có mặt</Badge>
                    ) : b.diem_danh ? (
                      <Badge tone="neutral">{b.diem_danh}</Badge>
                    ) : null}
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
                      className="inline-flex items-center gap-1.5 rounded-md border border-navy-200 px-3 py-1.5 text-[0.8125rem] font-medium text-navy-700 hover:border-navy-400"
                    >
                      Xem video buổi học
                    </a>
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-navy-400">Buổi này chưa có video.</p>
                )}
              </article>
            ))}
          </CardBody>
        )}
      </Card>
    </>
  )
}
