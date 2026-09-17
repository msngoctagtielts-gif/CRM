import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'

export const metadata: Metadata = { title: 'Lịch học' }

/**
 * Thời khoá biểu tuần và xu hướng buổi dạy những ngày gần nhất.
 *
 * Cô Ngọc nói: "tôi chưa nắm được thời khoá biểu một tuần đó diễn ra như thế
 * nào, xu hướng của các lớp ra sao vào các ngày gần nhất". Bảng class_schedules
 * đã có 36 ca từ ngày 11/09 nhưng chưa màn hình nào hiện ra, nên dữ liệu nằm im.
 *
 * Trang trả lời đúng hai câu đó:
 *   1. Một tuần bình thường trông ra sao — lưới bảy ngày, xếp theo giờ.
 *   2. Mười bốn ngày vừa rồi thực tế dạy bao nhiêu so với lịch.
 *
 * RLS vẫn có hiệu lực (dùng createClient, không dùng service role): giáo viên
 * chỉ thấy lớp của chính mình, Founder thấy tất cả.
 */

// class_schedules.weekday: 0 = Chủ nhật, theo đúng quy ước `dow` của Postgres.
// Hiển thị bắt đầu từ Thứ Hai cho hợp cách đọc lịch của người Việt.
const THU = [
  { so: 1, ten: 'Thứ Hai' },
  { so: 2, ten: 'Thứ Ba' },
  { so: 3, ten: 'Thứ Tư' },
  { so: 4, ten: 'Thứ Năm' },
  { so: 5, ten: 'Thứ Sáu' },
  { so: 6, ten: 'Thứ Bảy' },
  { so: 0, ten: 'Chủ nhật' },
]

const SO_NGAY_NHIN_LAI = 14

type Ca = {
  weekday: number
  start_time: string
  duration_minutes: number
  class_id: string
  classes: { name: string; teachers: { full_name: string } | null } | null
}

/** "19:30:00" → "19:30". Giây không mang thông tin gì cho người đọc lịch. */
function gio(t: string): string {
  return t.slice(0, 5)
}

function ngayVN(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Tên thứ của một ngày, tính theo múi giờ Việt Nam. */
function thuCuaNgay(iso: string): string {
  const dow = new Date(`${iso}T00:00:00+07:00`).getUTCDay()
  return THU.find((t) => t.so === dow)?.ten ?? '—'
}

export default async function LichHocPage() {
  await requireUser()
  const supabase = await createClient()

  const { data: caRaw, error: loiCa } = await supabase
    .from('class_schedules')
    .select('weekday, start_time, duration_minutes, class_id, classes(name, teachers(full_name))')
    .eq('status', 'active')
    .order('weekday')
    .order('start_time')

  // Hai lớp của cùng một giáo viên bị đè giờ trong cùng một thứ. Điều kiện chồng
  // giờ định nghĩa một lần trong view, không viết lại ở đây.
  const { data: trungLich } = await supabase.from('v_trung_lich_giao_vien').select('*')

  // Ngày mốc tính theo giờ Việt Nam, không theo giờ máy chủ — máy chủ Netlify
  // chạy giờ UTC nên sau 17:00 VN là đã sang ngày khác.
  const homNay = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const tuNgay = new Date(Date.now() + 7 * 60 * 60 * 1000 - SO_NGAY_NHIN_LAI * 86400000)
    .toISOString()
    .slice(0, 10)

  const { data: buoiRaw } = await supabase
    .from('lessons')
    .select('lesson_date, class_id, status')
    .gte('lesson_date', tuNgay)
    .lte('lesson_date', homNay)

  const ca = (caRaw ?? []) as unknown as Ca[]
  const buoi = buoiRaw ?? []

  const soCaTuan = ca.length
  const soLop = new Set(ca.map((c) => c.class_id)).size
  const gioMoiTuan = ca.reduce((t, c) => t + c.duration_minutes, 0) / 60

  // Đếm số ca theo lịch cho từng thứ, để so với số buổi đã dạy thật.
  const caTheoThu = new Map<number, number>()
  for (const c of ca) caTheoThu.set(c.weekday, (caTheoThu.get(c.weekday) ?? 0) + 1)

  const daDayTheoNgay = new Map<string, number>()
  for (const b of buoi) {
    if (!b.lesson_date) continue
    daDayTheoNgay.set(b.lesson_date, (daDayTheoNgay.get(b.lesson_date) ?? 0) + 1)
  }

  const ngayGanNhat: { ngay: string; thu: string; theoLich: number; daDay: number }[] = []
  for (let i = SO_NGAY_NHIN_LAI - 1; i >= 0; i--) {
    const iso = new Date(Date.now() + 7 * 60 * 60 * 1000 - i * 86400000).toISOString().slice(0, 10)
    const dow = new Date(`${iso}T00:00:00+07:00`).getUTCDay()
    ngayGanNhat.push({
      ngay: iso,
      thu: thuCuaNgay(iso),
      theoLich: caTheoThu.get(dow) ?? 0,
      daDay: daDayTheoNgay.get(iso) ?? 0,
    })
  }

  const tongTheoLich = ngayGanNhat.reduce((t, n) => t + n.theoLich, 0)
  const tongDaDay = ngayGanNhat.reduce((t, n) => t + n.daDay, 0)

  return (
    <>
      <PageHeader
        title="Lịch học"
        description={`Thời khoá biểu một tuần và ${SO_NGAY_NHIN_LAI} ngày gần nhất. Giờ theo múi giờ Việt Nam.`}
      />

      {loiCa ? (
        <Alert kind="danger" title="Không đọc được lịch học">
          {loiCa.message}
        </Alert>
      ) : null}

      {(trungLich ?? []).length > 0 ? (
        <Alert kind="warning" title="Trùng lịch giáo viên" className="mb-5">
          <ul className="space-y-1">
            {(trungLich ?? []).map((t, i) => (
              <li key={i}>
                <strong>{t.ten_giao_vien}</strong>, {THU.find((x) => x.so === t.weekday)?.ten}:{' '}
                <span className="tabular">{String(t.gio_lop_1).slice(0, 5)}</span> ({t.phut_lop_1}
                ′) {t.lop_1} đè lên{' '}
                <span className="tabular">{String(t.gio_lop_2).slice(0, 5)}</span> ({t.phut_lop_2}′){' '}
                {t.lop_2}.
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Hai lớp không thể dạy cùng lúc. Cần dời một trong hai, hoặc chuyển sang giáo viên dự
            phòng.
          </p>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ca mỗi tuần" value={soCaTuan} accent="navy" />
        <StatCard label="Lớp đang chạy" value={soLop} accent="gold" />
        <StatCard
          label="Giờ dạy mỗi tuần"
          value={`${gioMoiTuan.toLocaleString('vi-VN')} giờ`}
          accent="sage"
        />
        <StatCard
          label={`${SO_NGAY_NHIN_LAI} ngày qua`}
          value={`${tongDaDay} / ${tongTheoLich}`}
          caption="đã dạy trên số ca theo lịch"
          accent={tongDaDay < tongTheoLich ? 'burgundy' : 'sage'}
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Thời khoá biểu tuần"
          description="Một tuần bình thường diễn ra như thế nào. Xếp theo giờ bắt đầu."
        />
        <CardBody>
          {soCaTuan === 0 ? (
            <EmptyState
              title="Chưa có ca học nào đang hoạt động"
              description="Lịch học được lưu ở bảng class_schedules. Thêm ca cho lớp thì tuần sẽ hiện ra ở đây."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {THU.map((t) => {
                const cuaThu = ca.filter((c) => c.weekday === t.so)
                return (
                  <div
                    key={t.so}
                    className="rounded-lg border border-navy-100 bg-white p-3 lg:min-h-40"
                  >
                    <p className="mnee-label flex items-baseline justify-between gap-2">
                      <span>{t.ten}</span>
                      <span className="tabular text-navy-400">{cuaThu.length}</span>
                    </p>
                    {cuaThu.length === 0 ? (
                      <p className="mt-2 text-[0.75rem] text-navy-400">Trống</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {cuaThu.map((c, i) => (
                          <li
                            key={`${c.class_id}-${c.start_time}-${i}`}
                            className="border-l-2 border-gold-400 pl-2"
                          >
                            <Link
                              href={`/classes/${c.class_id}`}
                              className="block hover:text-navy-900"
                            >
                              <span className="tabular block text-[0.75rem] font-semibold text-navy-800">
                                {gio(c.start_time)}
                              </span>
                              <span className="block truncate text-[0.75rem] text-navy-600">
                                {c.classes?.name ?? '—'}
                              </span>
                              <span className="block truncate text-[0.6875rem] text-navy-400">
                                {c.classes?.teachers?.full_name ?? 'chưa gán GV'}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader
          title={`Xu hướng ${SO_NGAY_NHIN_LAI} ngày gần nhất`}
          description="Cột “theo lịch” là số ca đáng lẽ diễn ra trong thứ đó. Lệch không phải lúc nào cũng là lỗi — nghỉ lễ, học viên báo nghỉ, hoặc buổi chưa được nhập đều làm lệch."
        />
        <CardBody>
          <Table>
            <thead>
              <tr>
                <Th>Ngày</Th>
                <Th>Thứ</Th>
                <Th className="text-right">Theo lịch</Th>
                <Th className="text-right">Đã dạy</Th>
                <Th className="text-right">Chênh</Th>
              </tr>
            </thead>
            <tbody>
              {ngayGanNhat.map((n) => {
                const chenh = n.daDay - n.theoLich
                return (
                  <tr key={n.ngay} className={n.ngay === homNay ? 'bg-gold-50' : undefined}>
                    <Td className="tabular">
                      {ngayVN(n.ngay)}
                      {n.ngay === homNay ? (
                        <span className="ml-1.5 text-[0.625rem] text-gold-700">hôm nay</span>
                      ) : null}
                    </Td>
                    <Td>{n.thu}</Td>
                    <Td className="tabular text-right">{n.theoLich}</Td>
                    <Td className="tabular text-right">{n.daDay}</Td>
                    <Td className="tabular text-right">
                      {chenh === 0 ? (
                        <span className="text-navy-300">—</span>
                      ) : (
                        <span
                          className={
                            chenh < 0 ? 'font-semibold text-burgundy-700' : 'text-sage-700'
                          }
                        >
                          {chenh > 0 ? `+${chenh}` : chenh}
                        </span>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  )
}
