import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Mắt xích buổi học' }

/**
 * Cô Ngọc: "tôi cần nó là 1 chuỗi liên kết với nhau đưa ra kết quả tuyệt đối".
 *
 * Màn hình này KHÔNG vẽ sơ đồ chuỗi. Nó ĐO chuỗi. Sơ đồ thì lúc nào cũng đẹp;
 * chỗ đứt chỉ hiện ra khi đếm trên dữ liệu thật.
 *
 * Tám mắt xích của một buổi học:
 *   buổi → báo cáo → nội dung → chấm chất lượng → xác minh video
 *        → trừ học phí học viên → tính vào lương → gửi phụ huynh
 *
 * XẾP THEO TIỀN TRƯỚC, KHÔNG XẾP THEO NGÀY. Một buổi đã trả lương giáo viên mà
 * không trừ học phí của ai là tiền đã ra khỏi trung tâm và không có tiền vào
 * đối ứng. Một buổi chưa gửi phụ huynh là mất uy tín, nhưng chưa mất tiền.
 * Hai loại đó không đứng chung một hàng.
 */

type MucDo = 'tien' | 'bang_chung' | 'phu_huynh' | 'xac_minh' | 'du'

const NHOM: Record<
  MucDo,
  { nhan: string; mo_ta: string; tone: 'danger' | 'warning' | 'info' | 'success' }
> = {
  tien: {
    nhan: 'Đứt ở chỗ có tiền',
    mo_ta:
      'Đã trả lương giáo viên nhưng không có bằng chứng dạy, hoặc không trừ học phí của học viên nào.',
    tone: 'danger',
  },
  bang_chung: {
    nhan: 'Thiếu bằng chứng dạy',
    mo_ta: 'Có báo cáo nhưng giáo viên chưa viết nội dung buổi học.',
    tone: 'warning',
  },
  phu_huynh: {
    nhan: 'Chưa đến tay phụ huynh',
    mo_ta: 'Báo cáo đủ nội dung nhưng chưa ghi nhận đã gửi cho phụ huynh.',
    tone: 'info',
  },
  xac_minh: {
    nhan: 'Chưa xác minh video',
    mo_ta: 'Mọi thứ đủ, chỉ còn chưa đối chiếu số phút khai với bản ghi lớp.',
    tone: 'info',
  },
  du: { nhan: 'Đủ tám mắt xích', mo_ta: 'Không thiếu gì.', tone: 'success' },
}

const THU_TU: MucDo[] = ['tien', 'bang_chung', 'phu_huynh', 'xac_minh', 'du']

export default async function MatXichPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_mat_xich_buoi_hoc')
    .select('*')
    .order('lesson_date', { ascending: false })

  const rows = data ?? []
  const tong = rows.length

  const theoNhom = new Map<MucDo, typeof rows>()
  for (const m of THU_TU) theoNhom.set(m, [])
  for (const r of rows) {
    const m = (r.muc_do ?? 'du') as MucDo
    theoNhom.get(m)?.push(r)
  }

  const nhomTien = theoNhom.get('tien') ?? []
  const tienRui = nhomTien.reduce((a, r) => a + Number(r.tien_tra_giao_vien ?? 0), 0)
  const duMatXich = (theoNhom.get('du') ?? []).length
  const tyLe = tong > 0 ? Math.round((duMatXich / tong) * 100) : 0

  return (
    <>
      <PageHeader
        title="Mắt xích buổi học"
        description="Đo độ kín của chuỗi: buổi học → báo cáo → chất lượng → xác minh → học phí → lương → phụ huynh."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Buổi đã hoàn thành" value={formatNumber(tong)} />
        <StatCard
          label="Đủ cả tám mắt xích"
          value={`${formatNumber(duMatXich)} · ${tyLe}%`}
          accent={duMatXich === 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Đứt ở chỗ có tiền"
          value={formatNumber(nhomTien.length)}
          caption="Buổi cần xem trước tiên"
          accent="burgundy"
        />
        <StatCard
          label="Lương đã trả cho số buổi đó"
          value={formatCurrency(tienRui)}
          caption="Tiền đã ra, chưa có đối ứng"
          accent="burgundy"
        />
      </section>

      {duMatXich === 0 ? (
        <Alert kind="warning" className="mb-5">
          <strong>Chưa buổi nào đi hết tám mắt xích.</strong> Điều này không có nghĩa là trung tâm
          dạy sai — nghĩa là chuỗi ghi nhận chưa khép. Hai bước cuối (gửi phụ huynh, xác minh video)
          mới được thêm vào hệ thống nên chưa buổi cũ nào có. Hãy xử lý nhóm{' '}
          <em>đứt ở chỗ có tiền</em> trước; ba nhóm còn lại là việc làm dần.
        </Alert>
      ) : null}

      {THU_TU.map((muc) => {
        const ds = theoNhom.get(muc) ?? []
        if (ds.length === 0) return null
        const meta = NHOM[muc]
        const hien = ds.slice(0, 40)

        return (
          <Card key={muc} className="mb-5">
            <CardHeader
              title={`${meta.nhan} · ${formatNumber(ds.length)} buổi`}
              description={meta.mo_ta}
            />
            <Table>
              <thead>
                <tr>
                  <Th>Lớp</Th>
                  <Th>Ngày</Th>
                  <Th>Giáo viên</Th>
                  <Th>Mắt xích đứt</Th>
                  <Th className="text-right">Lương đã trả</Th>
                  <Th className="text-right">Học phí đã trừ</Th>
                  <Th className="text-right">Đạt</Th>
                </tr>
              </thead>
              <tbody>
                {hien.map((r) => (
                  <tr key={r.lesson_id}>
                    <Td>
                      <Link
                        href={`/reports/${r.lesson_id}`}
                        className="font-medium text-navy-800 underline-offset-2 hover:underline"
                      >
                        {r.class_code}
                      </Link>
                      <span className="block text-xs text-navy-500">{r.ten_lop}</span>
                    </Td>
                    <Td>{r.lesson_date ? formatDate(r.lesson_date) : '—'}</Td>
                    <Td>{r.giao_vien ?? '—'}</Td>
                    <Td>
                      <Badge tone={meta.tone}>{r.diem_dut ?? 'Đủ'}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {r.tien_tra_giao_vien != null
                        ? formatCurrency(Number(r.tien_tra_giao_vien))
                        : '—'}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {r.tien_hoc_phi != null ? formatCurrency(Number(r.tien_hoc_phi)) : '—'}
                    </Td>
                    <Td className="text-right tabular-nums">{r.so_mat_xich_dat}/8</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {ds.length > hien.length ? (
              <CardBody>
                <p className="text-sm text-navy-500">
                  Đang hiện {hien.length} buổi gần nhất trong tổng số {formatNumber(ds.length)}. Sửa
                  xong nhóm này thì phần còn lại hiện tiếp.
                </p>
              </CardBody>
            ) : null}
          </Card>
        )
      })}
    </>
  )
}
