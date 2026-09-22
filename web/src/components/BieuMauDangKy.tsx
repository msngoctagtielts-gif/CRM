'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { guiDangKy } from '@/lib/dang-ky'

type Props = {
  /** 'thau_hieu' | 'dang_ky' | 'kien_thuc' — máy chủ dịch lại, client không tự đặt nguồn. */
  nguon: string
  maChanDung?: string
  cauTraLoi?: Record<string, string>
  hoiTuoi?: boolean
}

export function BieuMauDangKy({ nguon, maChanDung, cauTraLoi, hoiTuoi = false }: Props) {
  const router = useRouter()
  const [loi, datLoi] = useState<string | null>(null)
  const [dangGui, batDau] = useTransition()

  function guiDi(su: React.FormEvent<HTMLFormElement>) {
    su.preventDefault()
    const form = new FormData(su.currentTarget)
    datLoi(null)
    batDau(async () => {
      const kq = await guiDangKy(form)
      if (kq.ok) {
        router.push(kq.maLead ? `/cam-on?ma=${encodeURIComponent(kq.maLead)}` : '/cam-on')
      } else {
        datLoi(kq.loi)
      }
    })
  }

  return (
    <form onSubmit={guiDi} className="space-y-4">
      <input type="hidden" name="nguon" value={nguon} />
      {maChanDung ? <input type="hidden" name="ma_chan_dung" value={maChanDung} /> : null}
      {cauTraLoi ? (
        <input type="hidden" name="cau_tra_loi" value={JSON.stringify(cauTraLoi)} />
      ) : null}

      {/* Bẫy máy tự động. Người dùng không nhìn thấy ô này. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Để trống ô này</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O nhan="Tên của bạn" bt>
          <input
            name="ho_ten"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Nguyễn Thị Lan"
            className={O_NHAP}
          />
        </O>
        <O nhan="Số điện thoại" bt>
          <input
            name="dien_thoai"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xx xxx xxx"
            className={O_NHAP}
          />
        </O>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O nhan="Email (không bắt buộc)">
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            className={O_NHAP}
          />
        </O>
        {hoiTuoi ? (
          <O nhan="Tuổi người học (không bắt buộc)">
            <input
              name="tuoi"
              type="number"
              min={1}
              max={120}
              placeholder="9"
              className={O_NHAP}
            />
          </O>
        ) : null}
      </div>

      <O nhan="Điều bạn muốn làm được bằng tiếng Anh (không bắt buộc)">
        <textarea
          name="muc_tieu"
          rows={3}
          maxLength={500}
          placeholder="Ví dụ: nói được trong cuộc họp với đối tác, tháng 12 này."
          className={`${O_NHAP} resize-y`}
        />
      </O>

      {loi ? (
        <p className="rounded-md border border-burgundy-200 bg-burgundy-50 px-4 py-3 text-sm text-burgundy-700">
          {loi}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={dangGui}
        className="w-full rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {dangGui ? 'Đang gửi…' : 'Gửi thông tin'}
      </button>

      <p className="text-xs leading-relaxed text-navy-400">
        Chúng tôi gọi lại để tư vấn và xếp một buổi kiểm tra đầu vào. Không có cam kết đầu ra
        theo mốc thời gian — buổi tư vấn là để xem bạn đang ở đâu và nên bắt đầu từ chỗ nào.
      </p>
    </form>
  )
}

const O_NHAP =
  'w-full rounded-md border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 ' +
  'placeholder:text-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100'

function O({
  nhan,
  bt = false,
  children,
}: {
  nhan: string
  bt?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-700">
        {nhan}
        {bt ? <span className="text-burgundy-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
