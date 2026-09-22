'use client'

import { useMemo, useState } from 'react'
import { CHAN_DUNG } from '@/noi-dung/chan-dung'
import {
  CAU_HOI,
  chamBai,
  cauHoiCanHien,
  daTraLoiDu,
  type CauTraLoi,
} from '@/noi-dung/bai-tu-danh-gia'
import { BieuMauDangKy } from '@/components/BieuMauDangKy'
import { ChuInline } from '@/components/ChuInline'

export function BaiTuDanhGia() {
  const [traLoi, datTraLoi] = useState<CauTraLoi>({})
  const [buoc, datBuoc] = useState(0)
  const [xongRoi, datXong] = useState(false)

  const canHien = useMemo(() => cauHoiCanHien(traLoi), [traLoi])
  const cauHienTai = canHien[buoc]

  function chon(maCau: string, maChon: string) {
    const moi = { ...traLoi, [maCau]: maChon }
    // Đổi câu 1 thì bỏ hết câu sau, vì bộ câu hỏi đổi theo.
    if (maCau === 'nguoi_hoc') {
      for (const c of CAU_HOI.slice(1)) delete moi[c.ma]
    }
    datTraLoi(moi)

    const sauKhiChon = cauHoiCanHien(moi)
    if (buoc + 1 >= sauKhiChon.length) {
      if (daTraLoiDu(moi)) datXong(true)
    } else {
      datBuoc(buoc + 1)
    }
  }

  if (xongRoi) {
    return <KetQua traLoi={traLoi} lamLai={() => {
      datTraLoi({})
      datBuoc(0)
      datXong(false)
    }} />
  }

  if (!cauHienTai) return null

  return (
    <div>
      <ThanhTienDo hienTai={buoc + 1} tong={canHien.length} />

      <h2 className="mt-8 text-2xl font-semibold leading-snug text-navy-900">
        {cauHienTai.cau}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-500">
        {cauHienTai.viSaoHoi}
      </p>

      <div className="mt-6 space-y-3">
        {cauHienTai.luaChon.map((l) => {
          const dangChon = traLoi[cauHienTai.ma] === l.ma
          return (
            <button
              key={l.ma}
              type="button"
              onClick={() => chon(cauHienTai.ma, l.ma)}
              className={[
                'block w-full rounded-lg border px-5 py-4 text-left text-[15px] transition-colors',
                dangChon
                  ? 'border-navy-700 bg-navy-50 text-navy-900'
                  : 'border-navy-200 text-navy-800 hover:border-navy-400 hover:bg-navy-50',
              ].join(' ')}
            >
              {l.nhan}
            </button>
          )
        })}
      </div>

      {buoc > 0 ? (
        <button
          type="button"
          onClick={() => datBuoc(buoc - 1)}
          className="mt-6 text-sm text-navy-500 underline-offset-4 hover:text-navy-800 hover:underline"
        >
          ← Quay lại câu trước
        </button>
      ) : null}
    </div>
  )
}

function ThanhTienDo({ hienTai, tong }: { hienTai: number; tong: number }) {
  return (
    <div>
      <div className="mnee-label">
        Câu {hienTai} / {tong}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full bg-gold-500 transition-all duration-300"
          style={{ width: `${(hienTai / tong) * 100}%` }}
        />
      </div>
    </div>
  )
}

function KetQua({ traLoi, lamLai }: { traLoi: CauTraLoi; lamLai: () => void }) {
  const ma = chamBai(traLoi)
  const cd = CHAN_DUNG[ma]

  return (
    <div>
      <div className="mnee-label">Kết quả</div>
      <h2 className="mnee-rule mt-2 text-3xl font-semibold leading-tight text-navy-900">
        {cd.ten}
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-navy-700">{cd.motCau}</p>

      <Muc tieuDe="Dấu hiệu thường đi cùng">
        <Danh y={cd.dauHieu} />
      </Muc>

      <Muc tieuDe="Vì sao chuyện này xảy ra">
        <Danh y={cd.viSao} />
      </Muc>

      <Muc tieuDe="Cách học phù hợp với bạn">
        <Danh y={cd.phuongPhap} />
      </Muc>

      <Muc tieuDe="Ba việc làm được ngay tuần này — không cần đăng ký gì">
        <ol className="space-y-3">
          {cd.vieclamNgay.map((v, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-navy-800">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-semibold text-gold-700">
                {i + 1}
              </span>
              <span>
                <ChuInline chu={v} />
              </span>
            </li>
          ))}
        </ol>
      </Muc>

      <div className="mt-8 rounded-lg border border-burgundy-200 bg-burgundy-50 px-5 py-4">
        <div className="mnee-label text-burgundy-700">Điều dễ làm sai nhất</div>
        <p className="mt-2 text-[15px] leading-relaxed text-burgundy-800">
          <ChuInline chu={cd.canhBao} />
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-navy-200 bg-navy-50 p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-navy-900">
          Muốn nghe tư vấn cụ thể cho trường hợp của bạn?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Ở trung tâm, trường hợp này thường hợp với: <strong>{cd.hopVoi}</strong> Để lại
          thông tin, chúng tôi gọi lại và xếp một buổi kiểm tra đầu vào để biết bạn đang ở đâu.
        </p>
        <div className="mt-6">
          <BieuMauDangKy
            nguon="thau_hieu"
            maChanDung={ma}
            cauTraLoi={traLoi}
            hoiTuoi={ma === 'phu_huynh'}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={lamLai}
        className="mt-8 text-sm text-navy-500 underline-offset-4 hover:text-navy-800 hover:underline"
      >
        Làm lại bài tự đánh giá
      </button>
    </div>
  )
}

function Muc({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="text-base font-semibold text-navy-900">{tieuDe}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Danh({ y }: { y: string[] }) {
  return (
    <ul className="space-y-2.5">
      {y.map((d, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-navy-800">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-500" />
          <span>
            <ChuInline chu={d} />
          </span>
        </li>
      ))}
    </ul>
  )
}
