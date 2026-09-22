'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/lib/actions'
import { huyPhieuThu, suaPhieuThu } from './actions'

/**
 * Sửa hoặc huỷ một phiếu thu đã ghi.
 *
 * KHÔNG CÓ NÚT XOÁ. Bản ghi tiền không được biến mất — huỷ thì phiếu rơi khỏi
 * mọi con số công nợ nhưng vẫn còn trong sổ để đối chiếu với sao kê ngân hàng.
 */
export function SuaPhieuThu({
  paymentId,
  paymentCode,
  paymentDate,
  amount,
  reference,
  daVaoPhieuThang,
}: {
  paymentId: string
  paymentCode: string | null
  paymentDate: string
  amount: number
  reference: string | null
  daVaoPhieuThang: boolean
}) {
  const [mo, setMo] = useState(false)
  const [suaState, suaAction] = useActionState<ActionResult | null, FormData>(suaPhieuThu, null)
  const [huyState, huyAction] = useActionState<ActionResult | null, FormData>(huyPhieuThu, null)

  if (!mo) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setMo(true)}>
        Sửa
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-lg bg-navy-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.8125rem] font-semibold text-navy-800">
          Sửa phiếu thu {paymentCode ?? ''}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setMo(false)}>
          Đóng
        </Button>
      </div>

      {daVaoPhieuThang ? (
        <p className="rounded-md bg-amber-soft-100 p-3 text-xs text-amber-soft-700">
          Phiếu thu này đã nằm trong một phiếu học phí tháng đã phát hành. Sửa số tiền bây giờ sẽ
          làm bảng kê đã gửi phụ huynh nói sai. Huỷ phiếu học phí tháng đó trước.
        </p>
      ) : null}

      <form action={suaAction} className="space-y-3">
        <input type="hidden" name="payment_id" value={paymentId} />
        <FormMessage state={suaState} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ngày thu">
            <Input type="date" name="payment_date" defaultValue={paymentDate} disabled={daVaoPhieuThang} />
          </Field>
          <Field label="Số tiền (₫)">
            <Input type="number" name="amount" defaultValue={amount} min={1} step={1000} disabled={daVaoPhieuThang} />
          </Field>
          <Field label="Mã giao dịch / tham chiếu" className="sm:col-span-2">
            <Input name="reference" defaultValue={reference ?? ''} disabled={daVaoPhieuThang} />
          </Field>
        </div>
        <Field label="Lý do sửa" required>
          <Input
            name="ly_do"
            placeholder="Ví dụ: sao kê ngân hàng ghi ngày 24/8, nhập nhầm thành 27/8"
            disabled={daVaoPhieuThang}
          />
        </Field>
        <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
          Lưu thay đổi
        </SubmitButton>
      </form>

      <form action={huyAction} className="space-y-3 border-t border-navy-200 pt-4">
        <input type="hidden" name="payment_id" value={paymentId} />
        <FormMessage state={huyState} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lý do huỷ" required>
            <Input name="ly_do" placeholder="Ví dụ: nhập trùng, đã có phiếu khác cùng giao dịch" disabled={daVaoPhieuThang} />
          </Field>
          <Field label="Gõ chữ HUY để xác nhận" required>
            <Input name="xac_nhan" placeholder="HUY" autoComplete="off" disabled={daVaoPhieuThang} />
          </Field>
        </div>
        <SubmitButton size="sm" variant="danger" pendingLabel="Đang huỷ…">
          Huỷ phiếu thu
        </SubmitButton>
      </form>
    </div>
  )
}
