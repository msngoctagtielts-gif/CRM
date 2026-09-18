import type { Metadata } from 'next'
import Link from 'next/link'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { BieuDoChong, BieuDoCot } from '@/components/ui/BieuDo'
import { StatCard } from '@/components/ui/StatCard'
import { Alert } from '@/components/ui/Alert'
import { EmptyState, Table, Td, Th } from '@/components/ui/Table'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Tài chính theo năm' }

const THANG = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

/** Số tiền rút gọn cho ô ma trận — bảng 13 cột không đủ chỗ cho số đầy đủ. */
function gon(v: number): string {
  if (!v) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}tr`
  return `${Math.round(v / 1000)}k`
}

function ty(tren: number, duoi: number): string {
  if (!duoi) return '—'
  return `${Math.round((tren / duoi) * 100)}%`
}

export default async function TaiChinhPage({
  searchParams,
}: {
  searchParams: Promise<{ nam?: string }>
}) {
  await requireFounder()
  const sp = await searchParams
  const supabase = await createClient()

  // Hai view đều chặn phạm vi ở tầng cơ sở dữ liệu: v_tai_chinh_thang chặn cứng
  // bằng is_founder(), v_luong_gv_thang dựa vào RLS của teacher_payable_lessons.
  const [{ data: thangData }, { data: luongData }] = await Promise.all([
    supabase.from('v_tai_chinh_thang').select('*').order('thang'),
    supabase.from('v_luong_gv_thang').select('*').order('thang'),
  ])

  const rows = thangData ?? []
  const luongRows = luongData ?? []

  const cacNam = Array.from(new Set(rows.map((r) => r.nam ?? '')))
    .filter(Boolean)
    .sort()
    .reverse()
  const nam = sp.nam && cacNam.includes(sp.nam) ? sp.nam : (cacNam[0] ?? '')
  const trongNam = rows.filter((r) => r.nam === nam)

  const tong = trongNam.reduce(
    (a, r) => ({
      doanh_thu: a.doanh_thu + Number(r.doanh_thu ?? 0),
      thu_tien_mat: a.thu_tien_mat + Number(r.thu_tien_mat ?? 0),
      luong_gv: a.luong_gv + Number(r.luong_gv ?? 0),
      chi_khac: a.chi_khac + Number(r.chi_khac ?? 0),
      buoi_day: a.buoi_day + Number(r.buoi_day ?? 0),
      buoi_co_video: a.buoi_co_video + Number(r.buoi_co_video ?? 0),
      buoi_tinh_luong: a.buoi_tinh_luong + Number(r.buoi_tinh_luong ?? 0),
      buoi_chua_gan: a.buoi_chua_gan + Number(r.buoi_chua_gan_hoc_phi ?? 0),
      ngoai_te: a.ngoai_te + Number(r.dong_ngoai_te ?? 0),
    }),
    {
      doanh_thu: 0,
      thu_tien_mat: 0,
      luong_gv: 0,
      chi_khac: 0,
      buoi_day: 0,
      buoi_co_video: 0,
      buoi_tinh_luong: 0,
      buoi_chua_gan: 0,
      ngoai_te: 0,
    },
  )
  const conLai = tong.doanh_thu - tong.luong_gv - tong.chi_khac

  // Dữ liệu biểu đồ: cũ trước mới sau, để đọc xu hướng từ trái sang phải.
  const theoThang = [...trongNam].sort((a, b) => String(a.thang).localeCompare(String(b.thang)))
  const cotTien = theoThang.map((r) => {
    const chi = Number(r.luong_gv ?? 0) + Number(r.chi_khac ?? 0)
    return {
      nhan: String(r.thang ?? '').slice(5, 7),
      duoi: chi,
      tren: Number(r.doanh_thu ?? 0) - chi,
    }
  })
  const cotBuoi = theoThang.map((r) => ({
    nhan: String(r.thang ?? '').slice(5, 7),
    gt: Number(r.buoi_day ?? 0),
  }))

  // Ma trận giáo viên × tháng cho năm đang xem.
  const luongNam = luongRows.filter((r) => r.nam === nam)
  const gvMap = new Map<
    string,
    {
      ten: string
      trang_thai: string
      thang: Map<string, { tien: number; buoi: number }>
      tong: number
      buoi: number
    }
  >()
  for (const r of luongNam) {
    const id = r.teacher_id ?? ''
    if (!id) continue
    let gv = gvMap.get(id)
    if (!gv) {
      gv = {
        ten: r.ten_giao_vien ?? '(không rõ)',
        trang_thai: r.trang_thai_gv ?? 'active',
        thang: new Map(),
        tong: 0,
        buoi: 0,
      }
      gvMap.set(id, gv)
    }
    const mm = (r.thang ?? '').slice(5, 7)
    const tien = Number(r.tien ?? 0)
    const buoi = Number(r.so_buoi ?? 0)
    const cu = gv.thang.get(mm) ?? { tien: 0, buoi: 0 }
    gv.thang.set(mm, { tien: cu.tien + tien, buoi: cu.buoi + buoi })
    gv.tong += tien
    gv.buoi += buoi
  }
  const giaoVien = [...gvMap.values()].sort((a, b) => b.tong - a.tong)

  // Chỉ hiện những tháng thực sự có dữ liệu, để bảng 12 cột không loãng.
  const thangCoDL = THANG.filter((m) => trongNam.some((r) => (r.thang ?? '').slice(5, 7) === m))

  return (
    <>
      <PageHeader
        title="Tài chính theo năm"
        description="Doanh thu ghi nhận theo buổi đã dạy, trừ lương giáo viên và chi phí khác. Chỉ Founder xem được màn hình này."
      />

      {cacNam.length > 1 ? (
        <nav className="mb-5 flex flex-wrap gap-2" aria-label="Chọn năm">
          {cacNam.map((n) => (
            <Link
              key={n}
              href={`/tai-chinh?nam=${n}`}
              className={cn(
                'rounded-md border px-3.5 py-1.5 text-sm font-semibold transition',
                n === nam
                  ? 'border-navy-800 bg-navy-800 text-white'
                  : 'border-navy-200 bg-white text-navy-700 hover:border-navy-400',
              )}
              aria-current={n === nam ? 'page' : undefined}
            >
              Năm {n}
            </Link>
          ))}
        </nav>
      ) : null}

      {trongNam.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu tài chính"
          description="Chưa có buổi dạy, khoản thu hay khoản chi nào được ghi nhận."
        />
      ) : (
        <>
          <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={`Doanh thu ${nam}`}
              value={formatCurrency(tong.doanh_thu)}
              caption="Ghi nhận theo buổi đã dạy"
              accent="navy"
            />
            <StatCard
              label="Lương giáo viên"
              value={formatCurrency(tong.luong_gv)}
              caption={`${ty(tong.luong_gv, tong.doanh_thu)} doanh thu`}
              accent="gold"
            />
            <StatCard
              label="Chi phí khác"
              value={formatCurrency(tong.chi_khac)}
              caption="Không gồm lương"
              accent="gold"
            />
            <StatCard
              label="Còn lại"
              value={formatCurrency(conLai)}
              caption={`${ty(conLai, tong.doanh_thu)} doanh thu`}
              accent={conLai >= 0 ? 'sage' : 'burgundy'}
            />
          </section>

          <Alert kind="info" className="mb-5">
            <strong>Doanh thu</strong> là tiền ghi nhận theo từng buổi đã dạy, không phải tiền mặt
            thu vào. Học phí thu theo gói 10 buổi nên tiền vào tháng nào thường không phải tháng dạy
            — năm {nam} thu tiền mặt {formatCurrency(tong.thu_tien_mat)}, doanh thu ghi nhận{' '}
            {formatCurrency(tong.doanh_thu)}. Muốn xem dòng tiền thật thì đọc cột{' '}
            <em>Tiền mặt thu</em> trong bảng dưới.
          </Alert>

          {tong.buoi_chua_gan > 0 ? (
            <Alert kind="warning" className="mb-5">
              Năm {nam} có{' '}
              <strong>{tong.buoi_chua_gan} buổi đã dạy chưa gắn vào gói học phí nào</strong>. Doanh
              thu các tháng đó đang thiếu đúng phần của những buổi này. Thường là buổi học thử hoặc
              học viên chưa có gói — cần đối chiếu lại trong màn hình Học phí &amp; công nợ.
            </Alert>
          ) : null}

          {tong.ngoai_te > 0 ? (
            <Alert kind="warning" className="mb-5">
              Có {tong.ngoai_te} khoản ghi bằng ngoại tệ trong năm {nam}. Các con số trên{' '}
              <strong>chỉ cộng khoản ghi bằng VND</strong> để không cộng nhầm hai loại tiền. Hãy quy
              đổi các khoản đó sang VND rồi ghi lại.
            </Alert>
          ) : null}

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title={`Doanh thu và lợi nhuận ${nam}`}
                description="Chiều cao cả cột là doanh thu tháng đó. Cột viền đỏ là tháng lỗ."
              />
              <BieuDoChong
                duLieu={cotTien}
                nhanDuoi="Lương giáo viên + chi phí khác"
                nhanTren="Còn lại"
                dinhDang={(v) => `${Math.round(v / 1000000)}tr`}
              />
            </Card>

            <Card>
              <CardHeader
                title={`Số buổi dạy ${nam}`}
                description="Nhìn nhịp hoạt động của trung tâm theo từng tháng."
              />
              <BieuDoCot
                duLieu={cotBuoi}
                dinhDang={(v) => String(v)}
                mau="sage"
                moTa="Tháng có ít buổi bất thường thường là tháng nghỉ lễ, hoặc tháng chưa nhập đủ dữ liệu."
              />
            </Card>
          </div>

          <Card className="mb-5">
            <CardHeader
              title={`Từng tháng năm ${nam}`}
              description="Doanh thu trừ lương và chi phí khác. Cột Tiền mặt thu để đối chiếu dòng tiền."
            />
            <Table>
              <thead>
                <tr>
                  <Th>Tháng</Th>
                  <Th align="right">Doanh thu</Th>
                  <Th align="right">Lương GV</Th>
                  <Th align="right">Chi khác</Th>
                  <Th align="right">Còn lại</Th>
                  <Th align="right">Lương / DT</Th>
                  <Th align="right">Tiền mặt thu</Th>
                </tr>
              </thead>
              <tbody>
                {trongNam.map((r) => {
                  const dt = Number(r.doanh_thu ?? 0)
                  const luong = Number(r.luong_gv ?? 0)
                  const chi = Number(r.chi_khac ?? 0)
                  const con = dt - luong - chi
                  return (
                    <tr key={r.thang}>
                      <Td className="font-semibold text-navy-900">
                        {(r.thang ?? '').slice(5, 7)}/{nam}
                      </Td>
                      <Td align="right">{formatCurrency(dt)}</Td>
                      <Td align="right">{formatCurrency(luong)}</Td>
                      <Td align="right">{formatCurrency(chi)}</Td>
                      <Td
                        align="right"
                        className={cn(
                          'font-semibold',
                          con < 0 ? 'text-burgundy-700' : 'text-sage-700',
                        )}
                      >
                        {formatCurrency(con)}
                      </Td>
                      <Td align="right">{ty(luong, dt)}</Td>
                      <Td align="right" className="text-navy-500">
                        {formatCurrency(Number(r.thu_tien_mat ?? 0))}
                      </Td>
                    </tr>
                  )
                })}
                <tr className="bg-navy-50/60">
                  <Td className="font-semibold text-navy-900">Cả năm</Td>
                  <Td align="right" className="font-semibold">
                    {formatCurrency(tong.doanh_thu)}
                  </Td>
                  <Td align="right" className="font-semibold">
                    {formatCurrency(tong.luong_gv)}
                  </Td>
                  <Td align="right" className="font-semibold">
                    {formatCurrency(tong.chi_khac)}
                  </Td>
                  <Td
                    align="right"
                    className={cn(
                      'font-semibold',
                      conLai < 0 ? 'text-burgundy-700' : 'text-sage-700',
                    )}
                  >
                    {formatCurrency(conLai)}
                  </Td>
                  <Td align="right" className="font-semibold">
                    {ty(tong.luong_gv, tong.doanh_thu)}
                  </Td>
                  <Td align="right" className="font-semibold text-navy-500">
                    {formatCurrency(tong.thu_tien_mat)}
                  </Td>
                </tr>
              </tbody>
            </Table>
          </Card>

          <Card className="mb-5">
            <CardHeader
              title={`Lương từng giáo viên năm ${nam}`}
              description="Tính từ buổi đã sinh công, không phải từ kỳ lương. Số rút gọn: tr = triệu, k = nghìn."
            />
            {giaoVien.length === 0 ? (
              <CardBody>
                <p className="text-sm text-navy-500">
                  Năm {nam} chưa có buổi dạy nào được tính công.
                </p>
              </CardBody>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Giáo viên</Th>
                    {thangCoDL.map((m) => (
                      <Th key={m} align="right">
                        {m}
                      </Th>
                    ))}
                    <Th align="right">Cả năm</Th>
                    <Th align="right">Buổi</Th>
                  </tr>
                </thead>
                <tbody>
                  {giaoVien.map((gv) => (
                    <tr key={gv.ten}>
                      <Td className="font-medium text-navy-900 whitespace-nowrap">
                        {gv.ten}
                        {gv.trang_thai === 'archived' ? (
                          <span className="ml-2 rounded bg-navy-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-navy-500">
                            đã nghỉ
                          </span>
                        ) : null}
                      </Td>
                      {thangCoDL.map((m) => {
                        const o = gv.thang.get(m)
                        return (
                          <Td key={m} align="right" className={o ? undefined : 'text-navy-300'}>
                            {gon(o?.tien ?? 0)}
                          </Td>
                        )
                      })}
                      <Td align="right" className="font-semibold text-navy-900">
                        {formatCurrency(gv.tong)}
                      </Td>
                      <Td align="right">{formatNumber(gv.buoi)}</Td>
                    </tr>
                  ))}
                  <tr className="bg-navy-50/60">
                    <Td className="font-semibold text-navy-900">Tổng</Td>
                    {thangCoDL.map((m) => {
                      const s = giaoVien.reduce((a, g) => a + (g.thang.get(m)?.tien ?? 0), 0)
                      return (
                        <Td key={m} align="right" className="font-semibold">
                          {gon(s)}
                        </Td>
                      )
                    })}
                    <Td align="right" className="font-semibold">
                      {formatCurrency(tong.luong_gv)}
                    </Td>
                    <Td align="right" className="font-semibold">
                      {formatNumber(giaoVien.reduce((a, g) => a + g.buoi, 0))}
                    </Td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title={`Hiệu suất vận hành năm ${nam}`}
              description="Chỉ hiện chỉ số có dữ liệu thật. Buổi gửi phụ huynh và bằng chứng buổi dạy chưa từng được ghi nên không đưa vào đây."
            />
            <Table>
              <thead>
                <tr>
                  <Th>Tháng</Th>
                  <Th align="right">Buổi dạy</Th>
                  <Th align="right">Lớp</Th>
                  <Th align="right">Học viên</Th>
                  <Th align="right">Giáo viên</Th>
                  <Th align="right">DT / buổi</Th>
                  <Th align="right">Có video</Th>
                  <Th align="right">Điểm QC</Th>
                </tr>
              </thead>
              <tbody>
                {trongNam.map((r) => {
                  const buoi = Number(r.buoi_day ?? 0)
                  const dt = Number(r.doanh_thu ?? 0)
                  const tinhLuong = Number(r.buoi_tinh_luong ?? 0)
                  return (
                    <tr key={r.thang}>
                      <Td className="font-semibold text-navy-900">
                        {(r.thang ?? '').slice(5, 7)}/{nam}
                      </Td>
                      <Td align="right">{formatNumber(buoi)}</Td>
                      <Td align="right">{formatNumber(Number(r.so_lop ?? 0))}</Td>
                      <Td align="right">{formatNumber(Number(r.so_hoc_vien ?? 0))}</Td>
                      <Td align="right">{formatNumber(Number(r.so_giao_vien ?? 0))}</Td>
                      <Td align="right">{buoi ? formatCurrency(Math.round(dt / buoi)) : '—'}</Td>
                      <Td align="right">
                        {tinhLuong ? `${ty(Number(r.buoi_co_video ?? 0), tinhLuong)}` : '—'}
                      </Td>
                      <Td align="right">
                        {r.diem_qc == null ? '—' : formatNumber(Number(r.diem_qc), 1)}
                      </Td>
                    </tr>
                  )
                })}
                <tr className="bg-navy-50/60">
                  <Td className="font-semibold text-navy-900">Cả năm</Td>
                  <Td align="right" className="font-semibold">
                    {formatNumber(tong.buoi_day)}
                  </Td>
                  <Td align="right" className="text-navy-400">
                    —
                  </Td>
                  <Td align="right" className="text-navy-400">
                    —
                  </Td>
                  <Td align="right" className="text-navy-400">
                    —
                  </Td>
                  <Td align="right" className="font-semibold">
                    {tong.buoi_day
                      ? formatCurrency(Math.round(tong.doanh_thu / tong.buoi_day))
                      : '—'}
                  </Td>
                  <Td align="right" className="font-semibold">
                    {ty(tong.buoi_co_video, tong.buoi_tinh_luong)}
                  </Td>
                  <Td align="right" className="text-navy-400">
                    —
                  </Td>
                </tr>
              </tbody>
            </Table>
            <CardBody className="border-t border-navy-100 text-[0.8125rem] text-navy-500">
              Cột Lớp, Học viên và Giáo viên đếm số khác nhau trong từng tháng, nên không cộng dồn
              được cả năm — một học viên học suốt 12 tháng vẫn chỉ là một người.
            </CardBody>
          </Card>
        </>
      )}
    </>
  )
}
