import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/Table'
import { ChepLink } from '@/components/ChepLink'
import type { Tables } from '@/types/database.types'

export const metadata: Metadata = { title: 'Hồ sơ trung tâm' }

/**
 * Kho hồ sơ trung tâm: một nơi duy nhất để lấy link gửi cho học viên.
 *
 * Cô Ngọc: "khi mà học viên cần tôi có thể gửi liền cho họ mà không phải tìm
 * kiếm ở nhiều nơi mất thời gian".
 *
 * Trang chỉ giữ ĐƯỜNG DẪN, không giữ nội dung tài liệu. Tài liệu thật nằm ở
 * Google Drive, Notion, website. Chép nội dung sang đây sẽ tạo bản thứ hai rồi
 * hai bản lệch nhau — đúng cái bệnh đang phải chữa.
 *
 * Dòng chưa có link KHÔNG bị giấu đi. Nó hiện rõ là "Cần bổ sung", nhờ vậy kho
 * tài liệu kiêm luôn danh sách việc còn thiếu.
 */

type TaiLieu = Tables<'documents'>

const NHOM: { ma: TaiLieu['category']; ten: string; mo_ta: string }[] = [
  { ma: 'website', ten: 'Website', mo_ta: 'Trang giới thiệu và hệ thống nội bộ' },
  {
    ma: 'thoa_thuan',
    ten: 'Thoả thuận',
    mo_ta: 'Cam kết giữa trung tâm với học viên và giáo viên',
  },
  { ma: 'hoc_phi_lo_trinh', ten: 'Học phí & lộ trình', mo_ta: 'Bảng giá và chương trình học' },
  { ma: 'chinh_sach', ten: 'Chính sách', mo_ta: 'Quy định học tập ba bên' },
  { ma: 'bieu_mau', ten: 'Biểu mẫu', mo_ta: 'Quy trình và bộ tài liệu theo bước' },
  { ma: 'khac', ten: 'Khác', mo_ta: '' },
]

const NGUOI_NHAN: Record<string, string> = {
  hoc_vien: 'Học viên',
  phu_huynh: 'Phụ huynh',
  giao_vien: 'Giáo viên',
  noi_bo: 'Nội bộ',
}

const GIAI_DOAN: Record<number, string> = {
  1: 'Tìm hiểu trung tâm',
  2: 'Tìm hiểu chương trình',
  3: 'Kiểm tra đầu vào',
  4: 'Tư vấn khoá học',
  5: 'Học phí',
  6: 'Chính sách học tập',
  7: 'Bắt đầu học',
}

function coLink(t: TaiLieu): boolean {
  return typeof t.url === 'string' && t.url.trim().length > 0
}

export default async function TaiLieuPage() {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'active')
    .order('sort_order')

  const taiLieu = (data ?? []) as TaiLieu[]
  const daCo = taiLieu.filter(coLink).length
  const thieu = taiLieu.length - daCo

  return (
    <>
      <PageHeader
        title="Hồ sơ trung tâm"
        description="Một nơi duy nhất để lấy link gửi cho học viên và phụ huynh. Bấm “Chép link” rồi dán thẳng vào Zalo."
      />

      {error ? (
        <Alert kind="danger" title="Không đọc được kho hồ sơ">
          {error.message}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Tổng hồ sơ" value={taiLieu.length} accent="navy" />
        <StatCard label="Đã có link, gửi được ngay" value={daCo} accent="sage" />
        <StatCard
          label="Cần bổ sung"
          value={thieu}
          caption={thieu > 0 ? 'chưa gửi được cho học viên' : undefined}
          accent={thieu > 0 ? 'burgundy' : 'sage'}
        />
      </div>

      {thieu > 0 ? (
        <Alert kind="warning" title={`${thieu} hồ sơ chưa có tài liệu`} className="mt-4">
          Những dòng đánh dấu “Cần bổ sung” là hồ sơ hệ thống đã chừa sẵn chỗ nhưng chưa có bản
          thật. Cô soạn xong thì dán link xem (không phải link chỉnh sửa) vào, không cần tôi sửa mã.
        </Alert>
      ) : null}

      {taiLieu.length === 0 && !error ? (
        <Card className="mt-5">
          <CardBody>
            <EmptyState
              title="Chưa có hồ sơ nào"
              description="Kho hồ sơ lưu ở bảng documents trong cơ sở dữ liệu."
            />
          </CardBody>
        </Card>
      ) : null}

      {NHOM.map((nhom) => {
        const cua = taiLieu.filter((t) => t.category === nhom.ma)
        if (cua.length === 0) return null
        return (
          <Card key={nhom.ma} className="mt-5">
            <CardHeader title={nhom.ten} description={nhom.mo_ta || undefined} />
            <CardBody>
              <ul className="divide-y divide-navy-100">
                {cua.map((t) => {
                  const san_sang = coLink(t)
                  return (
                    <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.875rem] font-medium text-navy-900">{t.title}</p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {t.stage ? (
                              <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[0.625rem] text-navy-600">
                                Bước {t.stage} · {GIAI_DOAN[t.stage]}
                              </span>
                            ) : null}
                            {(t.audiences ?? []).map((a) => (
                              <span
                                key={a}
                                className="rounded bg-gold-50 px-1.5 py-0.5 text-[0.625rem] text-gold-700"
                              >
                                {NGUOI_NHAN[a] ?? a}
                              </span>
                            ))}
                          </div>

                          {t.notes ? (
                            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-navy-500">
                              {t.notes}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {san_sang ? (
                            <>
                              <a
                                href={t.url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[0.6875rem] text-navy-600 underline underline-offset-2 hover:text-navy-900"
                              >
                                Mở
                              </a>
                              <ChepLink url={t.url as string} />
                            </>
                          ) : (
                            <span className="rounded-md bg-burgundy-50 px-2 py-1 text-[0.6875rem] font-medium text-burgundy-700">
                              Cần bổ sung
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardBody>
          </Card>
        )
      })}
    </>
  )
}
