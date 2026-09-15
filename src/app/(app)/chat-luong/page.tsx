import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Học thuật & chất lượng' }

/**
 * Mốc Founder chốt ngày 15/09/2026: từ tháng 9 giáo viên BẮT BUỘC nhập giờ vào
 * và giờ ra; các buổi trước đó đã trả lương và thu học phí xong ngoài hệ thống
 * nên bỏ qua. Trang này tách hai bên mốc để cô không nhìn nhầm nợ cũ thành lỗi
 * đang xảy ra.
 */
const MOC_BAT_BUOC = '2026-09-01'

type Buoi = {
  lesson_id: string | null
  class_id: string | null
  ten_lop: string | null
  giao_vien: string | null
  lesson_date: string | null
  topic: string | null
  co_gio: boolean | null
  co_noi_dung: boolean | null
  co_nhan_xet: boolean | null
  co_video: boolean | null
}

type Cong = { tong: number; gio: number; noi_dung: number; nhan_xet: number; video: number }

const RONG = (): Cong => ({ tong: 0, gio: 0, noi_dung: 0, nhan_xet: 0, video: 0 })

function cong(vao: Cong, b: Buoi): Cong {
  vao.tong += 1
  if (b.co_gio) vao.gio += 1
  if (b.co_noi_dung) vao.noi_dung += 1
  if (b.co_nhan_xet) vao.nhan_xet += 1
  if (b.co_video) vao.video += 1
  return vao
}

/** Tỉ lệ dạng chữ. Mẫu số 0 thì trả dấu gạch, không trả 0% — 0% nghĩa là có
 *  buổi nhưng thiếu, còn gạch nghĩa là chưa có buổi nào. Hai chuyện khác nhau. */
function tiLe(co: number, tong: number): string {
  if (tong === 0) return '—'
  return `${Math.round((co / tong) * 100)}%`
}

function O({ co }: { co: boolean | null }) {
  return co ? (
    <span className="text-sage-600" aria-label="có">
      ✓
    </span>
  ) : (
    <span className="font-semibold text-burgundy-600" aria-label="còn thiếu">
      ✗
    </span>
  )
}

export default async function ChatLuongPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_ho_so_buoi_hoc')
    .select('*')
    .order('lesson_date', { ascending: false })
    .limit(2000)

  const buoi = (data ?? []) as Buoi[]
  const tuThang9 = buoi.filter((b) => (b.lesson_date ?? '') >= MOC_BAT_BUOC)
  const truocThang9 = buoi.filter((b) => (b.lesson_date ?? '') < MOC_BAT_BUOC)

  const tong9 = tuThang9.reduce(cong, RONG())
  const tongCu = truocThang9.reduce(cong, RONG())

  // Gộp theo giáo viên trên toàn bộ buổi — cô cần thấy ai còn nợ hồ sơ nhiều
  // nhất, không phân biệt trước hay sau mốc.
  const theoGiaoVien = new Map<string, Cong>()
  for (const b of buoi) {
    const ten = b.giao_vien ?? 'Chưa gán giáo viên'
    theoGiaoVien.set(ten, cong(theoGiaoVien.get(ten) ?? RONG(), b))
  }
  const bangGiaoVien = [...theoGiaoVien.entries()].sort((a, z) => z[1].tong - a[1].tong)

  const thieuTuThang9 = tuThang9.filter(
    (b) => !b.co_gio || !b.co_noi_dung || !b.co_nhan_xet || !b.co_video,
  )

  const laFounder = user.role_code === 'founder'

  return (
    <>
      <PageHeader
        title="Học thuật & chất lượng"
        description="Phân hệ 6. Mỗi buổi đã dạy cần đủ bốn thứ: giờ dạy thật, nội dung bài, nhận xét học viên, link video. Trang này chỉ ra buổi nào còn thiếu."
      />

      <section className="mb-5">
        <h2 className="mnee-label mb-2">
          Từ 01/09/2026 — bắt buộc · {formatNumber(tong9.tong)} buổi
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Có giờ dạy thật"
            value={tiLe(tong9.gio, tong9.tong)}
            caption={`${formatNumber(tong9.gio)}/${formatNumber(tong9.tong)} buổi`}
            accent={tong9.gio === tong9.tong ? 'sage' : 'burgundy'}
          />
          <StatCard
            label="Có nội dung bài"
            value={tiLe(tong9.noi_dung, tong9.tong)}
            caption={`${formatNumber(tong9.noi_dung)}/${formatNumber(tong9.tong)} buổi`}
            accent={tong9.noi_dung === tong9.tong ? 'sage' : 'burgundy'}
          />
          <StatCard
            label="Có nhận xét học viên"
            value={tiLe(tong9.nhan_xet, tong9.tong)}
            caption={`${formatNumber(tong9.nhan_xet)}/${formatNumber(tong9.tong)} buổi`}
            accent={tong9.nhan_xet === tong9.tong ? 'sage' : 'gold'}
          />
          <StatCard
            label="Có link video"
            value={tiLe(tong9.video, tong9.tong)}
            caption={`${formatNumber(tong9.video)}/${formatNumber(tong9.tong)} buổi`}
            accent={tong9.video === tong9.tong ? 'sage' : 'burgundy'}
          />
        </div>
      </section>

      <Alert kind="info" className="mb-5">
        <strong>Buổi trước 01/09/2026:</strong> {formatNumber(tongCu.tong)} buổi, trong đó{' '}
        {formatNumber(tongCu.noi_dung)} buổi đã có nội dung bài ({tiLe(tongCu.noi_dung, tongCu.tong)}
        ) và {formatNumber(tongCu.gio)} buổi có giờ dạy thật ({tiLe(tongCu.gio, tongCu.tong)}). Học
        phí và lương của giai đoạn này đã chốt xong ngoài hệ thống, nên phần thiếu ở đây{' '}
        <em>không</em> làm sai sổ sách — nó chỉ làm bảng kê gửi phụ huynh bị trống nội dung.
      </Alert>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Theo giáo viên"
            description="Tính trên toàn bộ buổi đã dạy, cả trước và sau mốc bắt buộc."
          />
          <CardBody>
            {bangGiaoVien.length === 0 ? (
              <EmptyState title="Chưa có buổi học nào" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Giáo viên</Th>
                    <Th align="right">Buổi</Th>
                    <Th align="right">Giờ</Th>
                    <Th align="right">Nội dung</Th>
                    <Th align="right">Nhận xét</Th>
                    <Th align="right">Video</Th>
                  </tr>
                </thead>
                <tbody>
                  {bangGiaoVien.map(([ten, c]) => (
                    <tr key={ten}>
                      <Td className="font-medium">{ten}</Td>
                      <Td align="right">{formatNumber(c.tong)}</Td>
                      <Td align="right">{tiLe(c.gio, c.tong)}</Td>
                      <Td align="right">{tiLe(c.noi_dung, c.tong)}</Td>
                      <Td align="right">{tiLe(c.nhan_xet, c.tong)}</Td>
                      <Td align="right">{tiLe(c.video, c.tong)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Buổi từ tháng 9 còn thiếu hồ sơ"
            description="Đây là phần cần nhắc giáo viên ngay, vì buổi thiếu giờ dạy thì hệ thống không sinh được dòng trả lương."
          />
          <CardBody>
            {thieuTuThang9.length === 0 ? (
              <EmptyState
                title="Không có buổi nào thiếu"
                description={
                  tong9.tong === 0
                    ? 'Chưa có buổi nào được nhập từ 01/09/2026.'
                    : 'Toàn bộ buổi từ tháng 9 đã đủ bốn phần.'
                }
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Ngày</Th>
                    <Th>Lớp</Th>
                    <Th align="center">Giờ</Th>
                    <Th align="center">Nội dung</Th>
                    <Th align="center">Nhận xét</Th>
                    <Th align="center">Video</Th>
                  </tr>
                </thead>
                <tbody>
                  {thieuTuThang9.map((b) => (
                    <tr key={b.lesson_id ?? `${b.class_id}-${b.lesson_date}`}>
                      <Td className="whitespace-nowrap">{formatDate(b.lesson_date)}</Td>
                      <Td>
                        {b.class_id ? (
                          <Link href={`/classes/${b.class_id}`} className="hover:text-navy-600">
                            {b.ten_lop}
                          </Link>
                        ) : (
                          b.ten_lop
                        )}
                      </Td>
                      <Td align="center">
                        <O co={b.co_gio} />
                      </Td>
                      <Td align="center">
                        <O co={b.co_noi_dung} />
                      </Td>
                      <Td align="center">
                        <O co={b.co_nhan_xet} />
                      </Td>
                      <Td align="center">
                        <O co={b.co_video} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      {laFounder ? (
        <p className="mt-5 text-xs text-navy-400">
          Trang này đọc từ view <code>v_ho_so_buoi_hoc</code>. Nó chỉ đếm hồ sơ đã có hay chưa —
          không chấm chất lượng nội dung, và không thay việc cô đọc báo cáo.
        </p>
      ) : null}
    </>
  )
}
