import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { ThemKhungGioForm, VaiTroForm, XoaKhungGioNut } from './HoSoForms'

export const metadata: Metadata = { title: 'Hồ sơ giáo viên' }

/** Thứ Hai đầu tuần cho dễ đọc, nhưng mã số vẫn theo dow của Postgres: 0 = CN. */
const THU = [
  { dow: 1, ten: 'Thứ Hai' },
  { dow: 2, ten: 'Thứ Ba' },
  { dow: 3, ten: 'Thứ Tư' },
  { dow: 4, ten: 'Thứ Năm' },
  { dow: 5, ten: 'Thứ Sáu' },
  { dow: 6, ten: 'Thứ Bảy' },
  { dow: 0, ten: 'Chủ nhật' },
]

const gio = (t: string | null | undefined) => (t ? String(t).slice(0, 5) : '—')

const VAI_TRO: Record<string, { nhan: string; tone: 'success' | 'info' | 'neutral' }> = {
  chinh: { nhan: 'Dạy chính', tone: 'success' },
  du_phong: { nhan: 'Dự phòng', tone: 'info' },
}

export default async function HoSoGiaoVienPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounder()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: gv }, { data: hocVien }, { data: khungRanh }, { data: lichDay }, { data: luong }] =
    await Promise.all([
      supabase.from('v_ho_so_giao_vien').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('v_hoc_vien_cua_giao_vien')
        .select('*')
        .eq('teacher_id', id)
        .order('buoi_gan_nhat', { ascending: false }),
      supabase
        .from('teacher_availability')
        .select('id, weekday, start_time, end_time, note')
        .eq('teacher_id', id)
        .eq('status', 'active')
        .order('weekday')
        .order('start_time'),
      supabase
        .from('class_schedules')
        .select(
          'id, weekday, start_time, duration_minutes, classes!inner(id, name, status, teacher_id)',
        )
        .eq('classes.teacher_id', id)
        .eq('classes.status', 'active')
        .order('weekday')
        .order('start_time'),
      supabase
        .from('v_luong_gv_thang')
        .select('thang, so_buoi, tien')
        .eq('teacher_id', id)
        .order('thang', { ascending: false })
        .limit(12),
    ])

  if (!gv) notFound()

  const ranhRows = khungRanh ?? []
  const lichRows = lichDay ?? []
  const hvRows = hocVien ?? []
  const luongRows = luong ?? []

  const ten = gv.display_name ?? gv.full_name ?? 'Giáo viên'
  const vaiTro = gv.vai_tro ? VAI_TRO[gv.vai_tro] : null
  const dangDay = gv.trang_thai === 'active'

  // Học viên nào lâu chưa học thì đẩy lên đầu trong phần cảnh báo.
  const lauChuaHoc = hvRows.filter((h) => Number(h.ngay_ke_tu_buoi_cuoi ?? 0) > 21)

  return (
    <>
      <PageHeader
        title={ten}
        description={[gv.teacher_code, gv.nationality, gv.phone].filter(Boolean).join(' · ')}
        action={
          <Link href="/teachers" className="text-sm text-navy-600 underline hover:text-navy-800">
            Về danh sách giáo viên
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={dangDay ? 'success' : 'neutral'}>{dangDay ? 'Đang dạy' : 'Đã nghỉ'}</Badge>
        {vaiTro ? (
          <Badge tone={vaiTro.tone}>{vaiTro.nhan}</Badge>
        ) : (
          <Badge tone="warning">Chưa phân loại vai trò</Badge>
        )}
        {gv.hired_date ? (
          <span className="text-sm text-navy-500">Bắt đầu {formatDate(gv.hired_date)}</span>
        ) : null}
        {gv.ended_date ? (
          <span className="text-sm text-navy-500">Nghỉ từ {formatDate(gv.ended_date)}</span>
        ) : null}
        {!gv.user_id ? (
          <span className="text-sm text-amber-soft-700">Chưa có tài khoản đăng nhập</span>
        ) : null}
      </div>

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Lớp đang dạy" value={formatNumber(gv.lop_dang_day)} accent="navy" />
        <StatCard
          label="Giờ dạy mỗi tuần"
          value={`${formatNumber(Number(gv.phut_moi_tuan ?? 0) / 60, 1)} h`}
          caption={`${formatNumber(gv.so_khung_lich)} khung lịch cố định`}
          accent="navy"
        />
        <StatCard
          label="Tổng buổi đã dạy"
          value={formatNumber(gv.tong_buoi)}
          caption={
            gv.buoi_gan_nhat ? `gần nhất ${formatDate(gv.buoi_gan_nhat)}` : 'chưa có buổi nào'
          }
          accent="gold"
        />
        <StatCard
          label="Tổng lương đã nhận"
          value={formatCurrency(gv.tong_luong ?? 0)}
          accent="gold"
        />
      </section>

      {lauChuaHoc.length > 0 ? (
        <Alert kind="warning" className="mb-5">
          <strong>{lauChuaHoc.length} học viên</strong> của {ten} đã hơn 3 tuần không có buổi nào:{' '}
          {lauChuaHoc
            .slice(0, 5)
            .map((h) => `${h.ten_hoc_vien} (${h.ngay_ke_tu_buoi_cuoi} ngày)`)
            .join(', ')}
          {lauChuaHoc.length > 5 ? '…' : ''}. Cần hỏi lại xem lớp còn tiếp hay đã dừng.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Giờ có thể nhận lớp"
              description="Khung giờ rảnh do bạn ghi vào. Cột bên phải là lịch đã xếp thật, để đối chiếu."
            />
            {ranhRows.length === 0 && lichRows.length === 0 ? (
              <EmptyState
                title="Chưa có khung giờ nào"
                description="Thêm giờ rảnh ở khung bên cạnh để biết còn xếp lớp được vào lúc nào."
              />
            ) : (
              <CardBody className="space-y-1">
                {THU.map((t) => {
                  const ranh = ranhRows.filter((k) => k.weekday === t.dow)
                  const day = lichRows.filter((k) => k.weekday === t.dow)
                  if (ranh.length === 0 && day.length === 0) return null
                  return (
                    <div
                      key={t.dow}
                      className="grid grid-cols-1 gap-2 border-b border-navy-100 py-2.5 last:border-0 sm:grid-cols-[6rem_1fr_1fr]"
                    >
                      <p className="text-sm font-semibold text-navy-900">{t.ten}</p>
                      <div className="space-y-1">
                        {ranh.length === 0 ? (
                          <p className="text-xs text-navy-300">chưa ghi giờ rảnh</p>
                        ) : (
                          ranh.map((k) => (
                            <div key={k.id} className="flex items-center gap-2">
                              <span className="rounded bg-sage-50 px-2 py-0.5 text-xs font-medium text-sage-700 tabular">
                                {gio(k.start_time)}–{gio(k.end_time)}
                              </span>
                              {k.note ? (
                                <span className="text-xs text-navy-500">{k.note}</span>
                              ) : null}
                              <XoaKhungGioNut id={k.id} teacherId={id} />
                            </div>
                          ))
                        )}
                      </div>
                      <div className="space-y-1">
                        {day.length === 0 ? (
                          <p className="text-xs text-navy-300">chưa xếp lớp nào</p>
                        ) : (
                          day.map((k) => (
                            <p key={k.id} className="text-xs text-navy-700">
                              <span className="tabular font-medium">{gio(k.start_time)}</span>{' '}
                              <span className="text-navy-400">({k.duration_minutes}′)</span>{' '}
                              {k.classes?.name}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
                <p className="pt-2 text-xs text-navy-400">
                  Cột giữa là giờ rảnh, cột phải là lớp đã xếp. Giờ rảnh chưa có lớp nào đè lên
                  chính là chỗ còn nhận thêm học viên được.
                </p>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Học viên và tình trạng buổi gần nhất"
              description="Nhận xét lấy nguyên văn từ báo cáo buổi học của giáo viên."
            />
            {hvRows.length === 0 ? (
              <EmptyState
                title="Chưa dạy học viên nào"
                description="Chưa có buổi học nào hoàn tất gắn với giáo viên này."
              />
            ) : (
              <CardBody className="space-y-4">
                {hvRows.map((h) => {
                  const treNgay = Number(h.ngay_ke_tu_buoi_cuoi ?? 0)
                  return (
                    <article
                      key={`${h.student_id}-${h.lesson_id}`}
                      className="border-b border-navy-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-navy-900">
                          {h.ten_hoc_vien}
                          <span className="ml-2 text-xs font-normal text-navy-400">
                            {h.ten_lop}
                          </span>
                        </p>
                        <p
                          className={cn(
                            'text-xs',
                            treNgay > 21 ? 'font-semibold text-burgundy-700' : 'text-navy-500',
                          )}
                        >
                          Buổi gần nhất {formatDate(h.buoi_gan_nhat)} · {treNgay} ngày trước ·{' '}
                          {formatNumber(h.tong_buoi_voi_gv)} buổi với cô
                        </p>
                      </div>

                      {h.noi_dung_buoi ? (
                        <p className="mt-1.5 text-[0.8125rem] text-navy-500">
                          <span className="font-medium text-navy-700">Nội dung:</span>{' '}
                          {h.noi_dung_buoi}
                        </p>
                      ) : null}

                      {h.diem_manh ? (
                        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-800">
                          <span className="font-medium text-sage-700">Làm được:</span> {h.diem_manh}
                        </p>
                      ) : null}

                      {h.can_cai_thien ? (
                        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-navy-800">
                          <span className="font-medium text-burgundy-700">Cần cải thiện:</span>{' '}
                          {h.can_cai_thien}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[0.8125rem] text-navy-400">
                          Báo cáo buổi này chưa ghi phần cần cải thiện.
                        </p>
                      )}

                      <p className="mt-2 text-xs">
                        <Link
                          href={`/reports/${h.lesson_id}`}
                          className="text-navy-600 underline hover:text-navy-800"
                        >
                          Xem báo cáo đầy đủ
                        </Link>
                      </p>
                    </article>
                  )
                })}
              </CardBody>
            )}
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-1">
          <VaiTroForm teacherId={id} vaiTro={gv.vai_tro} />
          <ThemKhungGioForm teacherId={id} />

          <Card>
            <CardHeader title="Lương 12 tháng gần nhất" />
            {luongRows.length === 0 ? (
              <CardBody>
                <p className="text-sm text-navy-500">Chưa có tháng nào được tính công.</p>
              </CardBody>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tháng</Th>
                    <Th align="right">Buổi</Th>
                    <Th align="right">Tiền</Th>
                  </tr>
                </thead>
                <tbody>
                  {luongRows.map((r) => (
                    <tr key={r.thang}>
                      <Td className="whitespace-nowrap">
                        {String(r.thang).slice(5, 7)}/{String(r.thang).slice(0, 4)}
                      </Td>
                      <Td align="right">{formatNumber(r.so_buoi)}</Td>
                      <Td align="right">{formatCurrency(r.tien)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
