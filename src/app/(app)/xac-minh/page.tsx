import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Xác minh buổi học' }

type GianDoan = { tu?: string; den?: string; so_giay?: number; dien_ra_gi?: string }

export default async function XacMinhPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_xac_minh_buoi_hoc')
    .select('*')
    .gte('lesson_date', '2026-09-01')
    .order('lesson_date', { ascending: false })

  const rows = data ?? []
  const daXacMinh = rows.filter((r) => r.phut_thuc_te != null)
  const chuaXacMinh = rows.filter((r) => r.phut_thuc_te == null)
  const coYoutube = chuaXacMinh.filter((r) => Number(r.so_video_youtube ?? 0) > 0)
  const chiZoom = chuaXacMinh.filter(
    (r) => Number(r.so_video_youtube ?? 0) === 0 && Number(r.so_video_zoom ?? 0) > 0,
  )

  const tongLech = daXacMinh.reduce((a, r) => a + Number(r.lech_phut ?? 0), 0)

  return (
    <>
      <PageHeader
        title="Xác minh buổi học từ video"
        description="Đối chiếu số phút giáo viên khai với số phút đo được từ bản ghi lớp."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Đã xác minh" value={formatNumber(daXacMinh.length)} accent="sage" />
        <StatCard
          label="Chờ xác minh · có YouTube"
          value={formatNumber(coYoutube.length)}
          caption="Chạy được ngay"
          accent="gold"
        />
        <StatCard
          label="Chỉ có Zoom Clips"
          value={formatNumber(chiZoom.length)}
          caption="Không tải về được"
          accent="burgundy"
        />
        <StatCard
          label="Tổng lệch phút"
          value={`${tongLech >= 0 ? '+' : ''}${formatNumber(tongLech)}′`}
          caption="So với số khai"
          accent={tongLech < 0 ? 'burgundy' : 'navy'}
        />
      </section>

      {chiZoom.length > 0 ? (
        <Alert kind="warning" className="mb-5">
          <strong>{chiZoom.length} buổi chỉ có video trên Zoom Clips.</strong> Đó là link riêng tư
          nên không dịch vụ nào tải về được — kể cả Gemini. Muốn xác minh những buổi này, giáo viên
          phải tải bản ghi lên YouTube (chế độ không công khai cũng được) hoặc Google Drive của
          trung tâm.
        </Alert>
      ) : null}

      <Card className="mb-5">
        <CardHeader
          title="Kết quả xác minh"
          description="Số phút thật, thời gian học viên nói, và các lần gián đoạn trên 30 giây."
        />
        {daXacMinh.length === 0 ? (
          <EmptyState
            title="Chưa buổi nào được xác minh"
            description="Chạy scripts/phan-tich-video/phan-tich.mjs sau khi đã có GEMINI_API_KEY."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Ngày · Lớp</Th>
                <Th align="right">Khai</Th>
                <Th align="right">Thật</Th>
                <Th align="right">Lệch</Th>
                <Th align="right">HV nói</Th>
                <Th>Gián đoạn</Th>
                <Th>Không khí lớp</Th>
              </tr>
            </thead>
            <tbody>
              {daXacMinh.map((r) => {
                const lech = Number(r.lech_phut ?? 0)
                const gd = (Array.isArray(r.gian_doan) ? r.gian_doan : []) as GianDoan[]
                const tyLe = Number(r.ty_le_hv_noi_phan_tram ?? 0)
                return (
                  <tr key={r.lesson_id}>
                    <Td className="whitespace-nowrap">
                      <span className="font-medium">{formatDate(r.lesson_date)}</span>
                      <span className="block text-xs text-navy-500">{r.ten_lop}</span>
                    </Td>
                    <Td align="right" className="text-navy-500">
                      {formatNumber(r.phut_khai)}′
                    </Td>
                    <Td align="right" className="font-medium">
                      {formatNumber(r.phut_thuc_te)}′
                    </Td>
                    <Td
                      align="right"
                      className={cn('font-medium', lech < 0 ? 'text-burgundy-700' : 'text-sage-700')}
                    >
                      {lech >= 0 ? '+' : ''}
                      {formatNumber(lech)}′
                    </Td>
                    <Td align="right">
                      {r.thoi_gian_hv_noi == null ? (
                        '—'
                      ) : (
                        <>
                          {formatNumber(r.thoi_gian_hv_noi)}′
                          <span
                            className={cn(
                              'block text-xs',
                              tyLe < 60 ? 'text-burgundy-600' : 'text-sage-600',
                            )}
                          >
                            {tyLe}%
                          </span>
                        </>
                      )}
                    </Td>
                    <Td>
                      {gd.length === 0 ? (
                        <span className="text-xs text-navy-400">không</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {gd.slice(0, 3).map((g, i) => (
                            <li key={i} className="text-xs text-navy-600">
                              <span className="tabular font-medium">{g.tu}</span>{' '}
                              <span className="text-navy-400">({g.so_giay}s)</span> {g.dien_ra_gi}
                            </li>
                          ))}
                          {gd.length > 3 ? (
                            <li className="text-xs text-navy-400">…và {gd.length - 3} lần nữa</li>
                          ) : null}
                        </ul>
                      )}
                    </Td>
                    <Td className="max-w-md text-[0.8125rem] text-navy-600">{r.khong_khi_lop}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
        <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
          Lương và học phí <strong>vẫn tính theo số giáo viên khai</strong>. Bảng này để cô đối
          chiếu và quyết định, hệ thống không tự sửa tiền theo kết quả máy đọc. Tỷ lệ học viên nói
          dưới 60% là dấu hiệu lớp giao tiếp chưa đạt.
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Chờ xác minh"
          description="Buổi đã dạy nhưng chưa đối chiếu số phút với video."
        />
        {chuaXacMinh.length === 0 ? (
          <CardBody>
            <p className="text-sm text-navy-500">Không còn buổi nào chờ.</p>
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Ngày · Lớp</Th>
                <Th>Giáo viên</Th>
                <Th align="right">Khai</Th>
                <Th>Nguồn video</Th>
              </tr>
            </thead>
            <tbody>
              {chuaXacMinh.map((r) => {
                const yt = Number(r.so_video_youtube ?? 0)
                const zm = Number(r.so_video_zoom ?? 0)
                return (
                  <tr key={r.lesson_id}>
                    <Td className="whitespace-nowrap">
                      <span className="font-medium">{formatDate(r.lesson_date)}</span>
                      <span className="block text-xs text-navy-500">{r.ten_lop}</span>
                    </Td>
                    <Td>{r.giao_vien ?? '—'}</Td>
                    <Td align="right">{formatNumber(r.phut_khai)}′</Td>
                    <Td>
                      {yt > 0 ? (
                        <Badge tone="success">{yt} video YouTube — chạy được</Badge>
                      ) : zm > 0 ? (
                        <Badge tone="warning">{zm} Zoom Clips — không tải được</Badge>
                      ) : (
                        <Badge tone="neutral">Chưa có video</Badge>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
