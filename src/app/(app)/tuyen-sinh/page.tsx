import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Khách hàng tiềm năng' }

/**
 * Người đăng ký từ website công khai rơi vào đây.
 *
 * Website đó là một ứng dụng RIÊNG (thư mục web/), không dùng chung một dòng mã
 * nào với màn hình này. Nó chỉ gọi được đúng một hàm trong cơ sở dữ liệu và
 * không đọc được bảng nào. Nên bảng dưới đây là chỗ duy nhất dữ liệu ấy hiện ra.
 *
 * Nhãn chân dung được CHÉP LẠI từ web/src/noi-dung/chan-dung.ts chứ không import
 * — cùng lý do cổng học viên không import từ hệ quản trị. Sáu mã này ít khi đổi;
 * khi đổi thì sửa cả hai nơi.
 */
const TEN_CHAN_DUNG: Record<string, string> = {
  ngai_noi: 'Biết nhiều, nói không ra',
  so_sai: 'Sợ sai, sợ bị cười',
  ban_ron: 'Bận, thời gian vụn',
  mat_goc: 'Mất gốc, bắt đầu lại nhiều lần',
  ielts_gap: 'Cần IELTS, có hạn chót',
  phu_huynh: 'Phụ huynh chọn cho con',
}

const TEN_TRANG_THAI: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  consultation: 'Đã tư vấn',
  placement_test: 'Đã kiểm tra đầu vào',
  trial: 'Đang học thử',
  follow_up: 'Cần theo tiếp',
  enrolled: 'Đã nhập học',
  lost: 'Không theo nữa',
}

type Dong = {
  id: string
  lead_code: string | null
  full_name: string | null
  phone: string | null
  email: string | null
  age: number | null
  goal: string | null
  source: string | null
  status: string | null
  created_at: string | null
  ma_chan_dung: string | null
  so_lan_lien_he: number | null
}

export default async function TuyenSinhPage() {
  await requireFounder()
  const supabase = await createClient()

  // `v_tuyen_sinh` ra đời ở migration 0052 nên chưa có trong
  // src/types/database.types.ts — file đó sinh tự động TỪ cơ sở dữ liệu thật,
  // nên nó chỉ biết view này sau khi Founder áp migration rồi chạy
  // `npm run db:types`. Bỏ generic đi để TypeScript không chặn ở đây; hàng rào
  // thật vẫn là RLS của bảng leads, và view đã đặt security_invoker = on.
  const db = supabase as unknown as SupabaseClient

  const { data, error } = await db
    .from('v_tuyen_sinh')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  const dong = (data ?? []) as Dong[]

  const chuaLienHe = dong.filter((d) => d.status === 'new')
  const tuWebsite = dong.filter((d) => (d.source ?? '').startsWith('website'))
  const bayNgay = dong.filter((d) => {
    if (!d.created_at) return false
    return Date.now() - new Date(d.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  })

  return (
    <div>
      <PageHeader
        title="Khách hàng tiềm năng"
        description="Người để lại thông tin trên website công khai, và mọi lead nhập tay khác."
      />

      {error ? (
        <Alert kind="danger" className="mb-5">
          Không đọc được danh sách: {error.message}
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Chưa ai liên hệ"
          value={chuaLienHe.length}
          caption="Trạng thái còn ở mức Mới"
          accent={chuaLienHe.length > 0 ? 'burgundy' : 'navy'}
        />
        <StatCard label="Bảy ngày gần nhất" value={bayNgay.length} caption="Tính cả nhập tay" />
        <StatCard
          label="Đến từ website"
          value={tuWebsite.length}
          caption="Trên tổng số 300 dòng gần nhất"
          accent="gold"
        />
      </div>

      {chuaLienHe.length > 0 ? (
        <Alert kind="warning" className="mb-6">
          Có {chuaLienHe.length} người đã để lại số điện thoại mà chưa ai gọi lại. Người đăng ký
          trên web thường đang so sánh vài nơi cùng lúc — gọi trong ngày khác hẳn gọi sau ba ngày.
        </Alert>
      ) : null}

      <Card>
        <CardHeader title="Danh sách" description="Mới nhất lên trước, tối đa 300 dòng" />
        <CardBody>
          {dong.length === 0 ? (
            <EmptyState
              title="Chưa có ai đăng ký"
              description="Khi website công khai nhận được biểu mẫu đầu tiên, nó sẽ hiện ở đây."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Mã</Th>
                  <Th>Tên</Th>
                  <Th>Điện thoại</Th>
                  <Th>Chân dung</Th>
                  <Th>Mục tiêu tự khai</Th>
                  <Th>Nguồn</Th>
                  <Th>Trạng thái</Th>
                  <Th align="right">Ngày gửi</Th>
                </tr>
              </thead>
              <tbody>
                {dong.map((d) => (
                  <tr key={d.id} className="border-b border-navy-50 last:border-0">
                    <Td className="tabular text-navy-400">{d.lead_code ?? '—'}</Td>
                    <Td className="font-medium text-navy-900">{d.full_name ?? '—'}</Td>
                    <Td className="tabular">{d.phone ?? '—'}</Td>
                    <Td>
                      {d.ma_chan_dung ? (
                        <Badge tone="gold">
                          {TEN_CHAN_DUNG[d.ma_chan_dung] ?? d.ma_chan_dung}
                        </Badge>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </Td>
                    <Td className="max-w-xs text-navy-600">
                      {d.goal ? (
                        <span className="line-clamp-2">{d.goal}</span>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </Td>
                    <Td className="text-navy-500">{d.source ?? '—'}</Td>
                    <Td>
                      <Badge tone={d.status === 'new' ? 'warning' : 'neutral'}>
                        {TEN_TRANG_THAI[d.status ?? ''] ?? d.status ?? '—'}
                      </Badge>
                    </Td>
                    <Td align="right" className="tabular whitespace-nowrap text-navy-500">
                      {d.created_at ? formatDate(d.created_at) : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-navy-400">
        Màn hình này mới chỉ ĐỌC. Đổi trạng thái, ghi nhật ký cuộc gọi và chuyển một người thành
        học viên vẫn phải làm trong Supabase Studio cho tới khi phần Lead CRM của Giai đoạn 3
        có giao diện đầy đủ.
      </p>
    </div>
  )
}
