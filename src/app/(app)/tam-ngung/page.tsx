import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Học viên tạm ngưng' }

export default async function TamNgungPage() {
  await requireFounder()
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_hoc_vien_tam_ngung')
    .select('*')
    .order('buoi_cuoi', { ascending: false, nullsFirst: false })

  const rows = data ?? []
  const tongCanXuLy = rows.reduce(
    (s, r) => s + Number(r.con_no_hop_dong ?? 0) + Number(r.tien_buoi_vuot ?? 0),
    0,
  )
  const thieuLienHe = rows.filter((r) => !r.lien_he)

  return (
    <>
      <PageHeader
        title="Học viên tạm ngưng"
        description="Đã ngừng học nhưng hồ sơ giữ nguyên, để sau này liên hệ lại."
        action={
          <Link href="/students" className="text-sm text-navy-600 underline hover:text-navy-800">
            Học viên đang học
          </Link>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Đang tạm ngưng" value={rows.length} accent="navy" />
        <StatCard
          label="Tiền còn phải xử lý"
          value={formatCurrency(tongCanXuLy)}
          caption="hợp đồng chưa đóng + buổi dạy vượt gói"
          accent={tongCanXuLy > 0 ? 'burgundy' : 'sage'}
        />
        <StatCard
          label="Chưa có cách liên hệ"
          value={thieuLienHe.length}
          caption={thieuLienHe.length > 0 ? 'cần bổ sung số điện thoại' : 'đủ thông tin'}
          accent={thieuLienHe.length > 0 ? 'burgundy' : 'sage'}
        />
      </section>

      {thieuLienHe.length > 0 ? (
        <Alert kind="warning" className="mb-5" title="Danh sách này chưa liên hệ được">
          <p>
            <strong>
              {thieuLienHe.length} trong {rows.length} em
            </strong>{' '}
            chưa có số điện thoại, email hay thông tin phụ huynh nào trong hệ thống:{' '}
            {thieuLienHe.map((r) => r.ten_hoc_vien).join(', ')}.
          </p>
          <p className="mt-2">
            Một danh sách để liên hệ mà không có cách liên hệ thì không dùng được. Mở hồ sơ từng em
            và bổ sung số điện thoại hoặc thông tin phụ huynh.
          </p>
        </Alert>
      ) : null}

      {tongCanXuLy > 0 ? (
        <Alert kind="warning" className="mb-5" title="Còn tiền chưa xử lý">
          Tổng <strong>{formatCurrency(tongCanXuLy)}</strong> chưa khép lại. Trong đó có phần
          <strong> buổi đã dạy vượt gói</strong> — học viên đã đóng đủ tiền hợp đồng nhưng học nhiều
          hơn số buổi đã mua, nên khoản này <strong>chưa từng được xuất phiếu</strong>. Nhìn vào
          công nợ thông thường sẽ không thấy.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Danh sách"
          description="Sắp theo buổi học gần nhất. Toàn bộ buổi học, báo cáo và video của các em vẫn tra cứu được."
        />
        {rows.length === 0 ? (
          <EmptyState
            title="Không có học viên nào tạm ngưng"
            description="Khi một em ngừng học, chuyển trạng thái sang Tạm ngưng thay vì xoá hồ sơ."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Học viên</Th>
                <Th>Lớp và giáo viên cuối</Th>
                <Th>Buổi cuối</Th>
                <Th align="right">Đã học</Th>
                <Th align="right">Buổi còn lại</Th>
                <Th align="right">Cần xử lý</Th>
                <Th>Liên hệ</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const conLai = Number(r.buoi_con_lai ?? 0)
                const canXuLy = Number(r.con_no_hop_dong ?? 0) + Number(r.tien_buoi_vuot ?? 0)
                return (
                  <tr key={r.student_id}>
                    <Td>
                      <Link
                        href={`/students/${r.student_id}`}
                        className="font-medium text-navy-900 hover:text-navy-600 hover:underline"
                      >
                        {r.ten_hoc_vien}
                      </Link>
                      <p className="text-xs text-navy-400">{r.student_code}</p>
                    </Td>
                    <Td className="text-[0.8125rem]">
                      {r.lop_cuoi ?? '—'}
                      {r.giao_vien_cuoi ? (
                        <p className="text-xs text-navy-400">{r.giao_vien_cuoi}</p>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-[0.8125rem]">
                      {r.buoi_cuoi ? formatDate(r.buoi_cuoi) : 'chưa học buổi nào'}
                    </Td>
                    <Td align="right">{formatNumber(r.tong_buoi_da_hoc)}</Td>
                    <Td
                      align="right"
                      className={cn(conLai < 0 ? 'font-semibold text-burgundy-700' : undefined)}
                    >
                      {formatNumber(conLai, conLai % 1 === 0 ? 0 : 2)}
                      {conLai < 0 ? ' (vượt)' : ''}
                    </Td>
                    <Td
                      align="right"
                      className={cn(
                        canXuLy > 0 ? 'font-semibold text-burgundy-700' : 'text-navy-300',
                      )}
                    >
                      {canXuLy > 0 ? formatCurrency(canXuLy) : '—'}
                    </Td>
                    <Td className="text-[0.8125rem]">
                      {r.lien_he ?? <span className="font-medium text-burgundy-700">Chưa có</span>}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
        <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
          Khi một em ngưng học: hồ sơ chuyển sang <strong>Tạm ngưng</strong>, lớp 1-1 chuyển sang{' '}
          <strong>Tạm dừng</strong> nên khung giờ rời khỏi thời khoá biểu tuần, và dòng ghi danh lớp
          được lưu trữ kèm ngày rời lớp. Không xoá bất cứ thứ gì — buổi học, điểm danh, báo cáo,
          video và lương giáo viên đều giữ nguyên để tra cứu nhiều năm sau.
        </CardBody>
      </Card>
    </>
  )
}
