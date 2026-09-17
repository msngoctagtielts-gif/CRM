import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { TaoBanSaoNut } from './TaoBanSaoNut'

export const metadata: Metadata = { title: 'Sao lưu dữ liệu' }

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(2)} MB`

export default async function SaoLuuPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data: banSao } = await supabase
    .from('data_backups')
    .select('id, created_at, loai, so_dong, kich_thuoc_bytes')
    .order('created_at', { ascending: false })

  const rows = banSao ?? []
  const moiNhat = rows[0]
  const dem = (moiNhat?.so_dong ?? {}) as Record<string, number>

  // Bảng nào nhiều dòng nhất thì đáng nhìn nhất khi đối chiếu nhanh.
  const bangChinh = Object.entries(dem)
    .filter(([k]) => !k.endsWith('_khong_sao_luu'))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 12)

  const tongDong = Object.entries(dem)
    .filter(([k]) => !k.endsWith('_khong_sao_luu'))
    .reduce((s, [, v]) => s + Number(v), 0)

  return (
    <>
      <PageHeader
        title="Sao lưu dữ liệu"
        description="Chạy tự động 03:00 sáng Chủ nhật hằng tuần. Giữ 6 bản gần nhất."
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Bản sao đang giữ"
          value={rows.length}
          caption="giữ tối đa 6 bản"
          accent={rows.length > 0 ? 'sage' : 'burgundy'}
        />
        <StatCard
          label="Bản gần nhất"
          value={moiNhat ? formatDateTime(moiNhat.created_at) : 'chưa có'}
          caption={moiNhat ? mb(Number(moiNhat.kich_thuoc_bytes)) : undefined}
          accent="navy"
        />
        <StatCard
          label="Số dòng dữ liệu"
          value={formatNumber(tongDong)}
          caption="trong bản gần nhất"
          accent="navy"
        />
      </section>

      <Alert kind="warning" className="mb-5" title="Bản sao này chống được gì, không chống được gì">
        <p>
          <strong>Chống được:</strong> xoá nhầm, nhập sai hàng loạt, một lần cập nhật cấu trúc làm
          hỏng dữ liệu. Mở lại bản cũ là đối chiếu được ngay.
        </p>
        <p className="mt-2">
          <strong>KHÔNG chống được:</strong> mất cả dự án Supabase — vì bản sao nằm cùng một chỗ với
          dữ liệu gốc. Dự án đang ở gói Free: Supabase không sao lưu tự động cho gói này, và tạm
          dừng dự án nếu 7 ngày ít hoạt động (có 90 ngày để khôi phục).
        </p>
        <p className="mt-2">
          Vì vậy:{' '}
          <strong>
            mỗi tháng một lần, bấm Tải về ở bản mới nhất và cất tệp đó vào Google Drive của trung
            tâm.
          </strong>{' '}
          Đó mới là bản sao nằm ngoài, chống được cả việc mất dự án.
        </p>
      </Alert>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Các bản sao đang giữ"
              description="Mới nhất trước. Bản thứ 7 trở đi tự xoá để không phình dung lượng."
            />
            {rows.length === 0 ? (
              <EmptyState
                title="Chưa có bản sao nào"
                description="Bấm Tạo bản sao lưu ngay ở khung bên cạnh, hoặc chờ đến 03:00 sáng Chủ nhật."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Thời điểm</Th>
                    <Th>Cách tạo</Th>
                    <Th align="right">Dung lượng</Th>
                    <Th align="right">Tải về</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <Td className="whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                      <Td>
                        {r.loai === 'tu_dong' ? (
                          <Badge tone="info">Tự động</Badge>
                        ) : (
                          <Badge tone="neutral">Bấm tay</Badge>
                        )}
                      </Td>
                      <Td align="right">{mb(Number(r.kich_thuoc_bytes))}</Td>
                      <Td align="right">
                        <a
                          href={`/api/sao-luu/${r.id}`}
                          className="font-medium text-navy-700 underline hover:text-navy-900"
                        >
                          Tải tệp JSON
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-1">
          <Card>
            <CardHeader
              title="Tạo bản sao ngay"
              description="Nên bấm trước mỗi lần nhập dữ liệu hàng loạt."
            />
            <CardBody>
              <TaoBanSaoNut />
            </CardBody>
          </Card>

          {bangChinh.length > 0 ? (
            <Card>
              <CardHeader
                title="Bản gần nhất chứa gì"
                description="Số dòng từng bảng, để đối chiếu nhanh khi nghi ngờ mất dữ liệu."
              />
              <Table>
                <thead>
                  <tr>
                    <Th>Bảng</Th>
                    <Th align="right">Dòng</Th>
                  </tr>
                </thead>
                <tbody>
                  {bangChinh.map(([ten, so]) => (
                    <tr key={ten}>
                      <Td className="font-mono text-xs">{ten}</Td>
                      <Td align="right">{formatNumber(Number(so))}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
                Hai bảng <span className="font-mono text-xs">audit_logs</span> và{' '}
                <span className="font-mono text-xs">notifications</span> cố ý không sao lưu: một bên
                là nhật ký phình nhanh, một bên sinh lại được bằng các hàm quét.
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  )
}
