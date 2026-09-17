import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Đối soát học phí' }

const HINH_THUC: Record<string, string> = {
  prepaid_package: 'Gói trả trước',
  monthly_postpaid: 'Theo tháng',
  undetermined: 'Chưa xác định',
}

/**
 * Đối soát học phí theo HỢP ĐỒNG, không theo đầu người.
 *
 * Tiền đi theo hợp đồng. Lớp nhóm chỉ có một hợp đồng đứng tên một người, nên
 * nếu tách ra từng học viên thì các thành viên còn lại hiện ra như đang thiếu
 * dữ liệu — trong khi thực tế họ nằm trong hợp đồng chung. Một dòng một hợp
 * đồng, liệt kê đủ tên thành viên, là cách duy nhất đọc không bị nhầm.
 */
export default async function DoiSoatPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_doi_soat_hoc_phi')
    .select('*')
    .in('trang_thai_lop', ['active', 'paused'])
    .order('lech_buoi', { ascending: false })

  const rows = data ?? []
  const lech = rows.filter((r) => Number(r.lech_buoi ?? 0) !== 0)
  const thieu = rows.filter((r) => Number(r.lech_buoi ?? 0) > 0)
  const du = rows.filter((r) => Number(r.lech_buoi ?? 0) < 0)
  const tongThieu = thieu.reduce((s, r) => s + Number(r.lech_buoi ?? 0), 0)
  const tongDu = du.reduce((s, r) => s + Number(r.lech_buoi ?? 0), 0)

  // Tiền của phần chưa trừ, tính theo đơn giá của chính hợp đồng đó.
  const tienThieu = thieu.reduce(
    (s, r) => s + Number(r.lech_buoi ?? 0) * Number(r.price_per_lesson ?? 0),
    0,
  )

  const lechSiSo = rows.filter(
    (r) =>
      Number(r.si_so_thuc_te ?? 0) > 0 &&
      Number(r.si_so_hop_dong ?? 0) !== Number(r.si_so_thuc_te ?? 0),
  )

  return (
    <>
      <PageHeader
        title="Đối soát học phí"
        description="Một dòng cho mỗi hợp đồng. Lớp nhóm hiện chung một dòng vì cả nhóm dùng chung một hợp đồng."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hợp đồng đang theo dõi" value={rows.length} accent="navy" />
        <StatCard
          label="Hợp đồng lệch sổ"
          value={lech.length}
          caption={`trên ${rows.length} hợp đồng`}
          accent={lech.length > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Buổi đã dạy chưa trừ"
          value={formatNumber(tongThieu, tongThieu % 1 === 0 ? 0 : 1)}
          caption={tienThieu > 0 ? `≈ ${formatCurrency(tienThieu)}` : undefined}
          accent={tongThieu > 0 ? 'gold' : 'sage'}
        />
        <StatCard
          label="Buổi bị trừ dư"
          value={formatNumber(Math.abs(tongDu), tongDu % 1 === 0 ? 0 : 1)}
          caption={du.length > 0 ? `${du.length} hợp đồng` : 'không có'}
          accent={du.length > 0 ? 'burgundy' : 'sage'}
        />
      </section>

      <Alert kind="info" className="mb-5" title="Hai sổ đếm buổi, và vì sao chúng lệch">
        <p>
          Hệ thống đếm buổi ở hai nơi: <strong>buổi lớp đã dạy</strong> (từ điểm danh) và{' '}
          <strong>buổi đã trừ</strong> (từ hợp đồng học phí). Buổi nào chưa được gắn vào hợp đồng
          thì không bị trừ, nên số dư trông vẫn còn trong khi học viên đã học rồi.
        </p>
        <p className="mt-2">
          Cột <em>Lệch</em> dương nghĩa là đã dạy nhưng chưa trừ — tiền chưa được ghi nhận. Cột âm
          nghĩa là trừ nhiều hơn số buổi đã dạy — học viên đang bị trừ oan.
        </p>
      </Alert>

      {lechSiSo.length > 0 ? (
        <Alert kind="warning" className="mb-5" title="Sĩ số hợp đồng không khớp sĩ số lớp">
          {lechSiSo
            .map(
              (r) =>
                `${r.ten_lop}: hợp đồng ghi ${r.si_so_hop_dong} người, lớp có ${r.si_so_thuc_te}`,
            )
            .join(' · ')}
          . Đơn giá theo đầu người sẽ tính sai nếu sĩ số ghi thiếu.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Từng hợp đồng"
          description="Sắp theo mức lệch. Hợp đồng lệch 0 là đã khớp sổ."
        />
        {rows.length === 0 ? (
          <EmptyState title="Chưa có hợp đồng nào" description="Chưa có lớp đang chạy." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lớp và thành viên</Th>
                <Th>Người đứng tên</Th>
                <Th>Hình thức</Th>
                <Th align="right">Lớp đã dạy</Th>
                <Th align="right">Đã trừ</Th>
                <Th align="right">Lệch</Th>
                <Th align="right">Đã đóng</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const l = Number(r.lech_buoi ?? 0)
                const nhom = Number(r.si_so_thuc_te ?? 0) > 1
                return (
                  <tr key={r.enrollment_id}>
                    <Td>
                      <p className="font-medium text-navy-900">
                        {r.ten_lop}
                        {nhom ? (
                          <Badge tone="info" className="ml-2">
                            Nhóm {r.si_so_thuc_te}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-navy-400">
                        {r.thanh_vien ?? 'lớp đã dừng, không còn thành viên'}
                        {r.giao_vien ? ` · ${r.giao_vien}` : ''}
                      </p>
                    </Td>
                    <Td className="text-[0.8125rem]">{r.nguoi_dung_ten}</Td>
                    <Td className="text-[0.8125rem]">
                      {HINH_THUC[r.hinh_thuc ?? ''] ?? r.hinh_thuc}
                      {r.price_per_lesson ? (
                        <p className="text-xs text-navy-400">
                          {formatCurrency(r.price_per_lesson)}/buổi
                        </p>
                      ) : null}
                    </Td>
                    <Td align="right">{formatNumber(r.buoi_lop_da_day)}</Td>
                    <Td align="right">{formatNumber(Number(r.buoi_da_tru ?? 0), 1)}</Td>
                    <Td
                      align="right"
                      className={cn(
                        'font-semibold',
                        l > 0 ? 'text-gold-700' : l < 0 ? 'text-burgundy-700' : 'text-navy-300',
                      )}
                    >
                      {l === 0 ? '—' : formatNumber(l, l % 1 === 0 ? 0 : 1)}
                    </Td>
                    <Td align="right" className="text-navy-600">
                      {formatCurrency(r.da_dong)}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
        <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
          <strong>Lớp nhóm hiện chung một dòng.</strong> Y Khoa 3 người dùng một hợp đồng đứng tên
          Ms. Min; lớp Ms. Hoàng/Huệ dùng một hợp đồng đứng tên Ms. Hoàng. Nếu tách thành từng học
          viên thì các thành viên còn lại sẽ hiện ra như đang thiếu dữ liệu, trong khi họ nằm trong
          hợp đồng chung — chính chỗ này từng làm đọc sai số liệu.
        </CardBody>
      </Card>
    </>
  )
}
