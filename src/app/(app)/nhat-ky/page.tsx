import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Nhật ký thay đổi' }

/**
 * Nhật ký mọi lần dữ liệu bị sửa hoặc xoá.
 *
 * MẶC ĐỊNH CHỈ HIỆN NHỮNG LẦN NGƯỜI SỬA. Bảng audit_logs đã có 14 trigger tự
 * ghi từ 11/09/2026 và đã tích hơn 6.000 dòng — phần lớn là máy ghi khi buổi
 * học đổi trạng thái, không phải ai đó quyết định sửa gì. Trộn chung thì việc
 * cô Ngọc thật sự cần xem sẽ chìm mất.
 *
 * Dấu hiệu phân biệt: các thao tác đi qua fn_sua_* / fn_xoa_* đều BẮT BUỘC có
 * lý do, nên `ly_do` khác rỗng chính là "người làm, có chủ ý".
 */

const TEN_BANG: Record<string, string> = {
  lessons: 'Buổi học',
  payments: 'Phiếu thu',
  classes: 'Lớp học',
  teachers: 'Giáo viên',
  students: 'Học viên',
  teaching_reports: 'Báo cáo buổi học',
  teacher_payroll: 'Bảng lương',
  student_enrollments: 'Hợp đồng học',
  tuition_statements: 'Phiếu học phí',
  expenses: 'Chi phí',
}

export default async function NhatKyPage({
  searchParams,
}: {
  searchParams: Promise<{ tat_ca?: string }>
}) {
  await requireFounder()
  const { tat_ca } = await searchParams
  const hienTatCa = tat_ca === '1'
  const supabase = await createClient()

  let q = supabase
    .from('v_nhat_ky_thay_doi')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (!hienTatCa) q = q.not('ly_do', 'is', null)

  const { data } = await q
  const rows = data ?? []

  return (
    <>
      <PageHeader
        title="Nhật ký thay đổi"
        description="Ai đã sửa gì, lúc nào, và vì sao. Mỗi lần sửa hay xoá đều chụp lại bản cũ."
      />

      <Alert kind="info" className="mb-5">
        {hienTatCa ? (
          <>
            Đang hiện <strong>cả những dòng máy tự ghi</strong> — phần lớn là hệ thống ghi lại khi
            buổi học đổi trạng thái, không phải ai đó quyết định sửa.{' '}
            <a href="/nhat-ky" className="font-medium underline underline-offset-2">
              Chỉ xem việc do người làm
            </a>
          </>
        ) : (
          <>
            Đang hiện <strong>những lần cô hoặc nhân sự chủ động sửa</strong> — mỗi dòng đều có lý
            do vì hệ thống bắt ghi.{' '}
            <a href="/nhat-ky?tat_ca=1" className="font-medium underline underline-offset-2">
              Xem thêm cả dòng máy tự ghi
            </a>
          </>
        )}
      </Alert>

      <Card>
        <CardHeader
          title={`${formatNumber(rows.length)} thay đổi gần nhất`}
          description="Bản cũ được lưu nguyên vẹn, nên sửa nhầm vẫn dựng lại được."
        />
        {rows.length === 0 ? (
          <CardBody>
            <p className="text-sm text-navy-500">
              Chưa có thay đổi nào do người thực hiện. Khi cô sửa một buổi học hay một phiếu thu,
              dòng đầu tiên sẽ hiện ở đây.
            </p>
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lúc</Th>
                <Th>Người sửa</Th>
                <Th>Việc</Th>
                <Th>Thuộc về</Th>
                <Th>Lý do</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                  <Td>{r.nguoi_sua ?? <span className="text-navy-400">hệ thống</span>}</Td>
                  <Td>
                    <Badge tone={r.action === 'DELETE' ? 'danger' : r.action === 'INSERT' ? 'success' : 'info'}>
                      {r.action === 'DELETE' ? 'Xoá' : r.action === 'INSERT' ? 'Thêm' : 'Sửa'}
                    </Badge>
                  </Td>
                  <Td>{TEN_BANG[r.table_name ?? ''] ?? r.table_name}</Td>
                  <Td className="max-w-md">
                    {r.ly_do ?? <span className="text-navy-400">máy tự ghi</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
