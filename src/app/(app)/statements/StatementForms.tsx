'use client'

import { useActionState, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { PAYMENT_METHOD } from '@/lib/labels'
import { formatCurrency, todayISO } from '@/lib/format'
import { buildStatement, issueStatement, payStatement } from './actions'

type MonthlyEnrollment = { id: string; label: string }

/** Lập hoặc tính lại phiếu học phí của một tháng. */
export function BuildStatementForm({
  enrollments,
  defaultMonth,
}: {
  enrollments: MonthlyEnrollment[]
  defaultMonth: string
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(buildStatement, null)

  return (
    <Card>
      <CardHeader
        title="Lập phiếu học phí tháng"
        description="Số buổi đã dạy trong tháng × đơn giá tại ngày học, trừ chiết khấu tháng"
      />
      <CardBody>
        {enrollments.length === 0 ? (
          <p className="text-[0.8125rem] text-navy-400">
            Chưa có hợp đồng nào theo hình thức đóng cuối tháng. Tạo hợp đồng ở trang Thu học phí.
          </p>
        ) : (
          <form action={action} className="space-y-3">
            <FormMessage state={state} />

            <Field label="Hợp đồng" required>
              <Select name="enrollment_id" required defaultValue="">
                <option value="" disabled>
                  — Chọn hợp đồng —
                </option>
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tháng đối soát" required>
              <Input type="month" name="month" required defaultValue={defaultMonth} />
            </Field>

            <SubmitButton className="w-full" pendingLabel="Đang tính…">
              Lập / tính lại phiếu
            </SubmitButton>
            <p className="text-xs text-navy-400">
              Lập lại cùng một tháng sẽ tính lại trên số buổi mới nhất, không tạo phiếu trùng.
            </p>
          </form>
        )}
      </CardBody>
    </Card>
  )
}

/** Chốt phiếu nháp rồi gửi cho phụ huynh — bước riêng do người bấm. */
export function IssueStatementForm({ statementId }: { statementId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(issueStatement, null)
  const [showDue, setShowDue] = useState(false)

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="statement_id" value={statementId} />
      <FormMessage state={state} />
      {showDue ? (
        <Field label="Hạn thanh toán">
          <Input type="date" name="due_date" />
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton size="sm" variant="secondary" pendingLabel="Đang chốt…">
          Chốt phiếu
        </SubmitButton>
        {showDue ? null : (
          <button
            type="button"
            onClick={() => setShowDue(true)}
            className="text-xs font-medium text-navy-500 hover:text-navy-800"
          >
            + Đặt hạn thanh toán
          </button>
        )}
      </div>
    </form>
  )
}

/** Ghi nhận tiền thu cho một phiếu đã chốt. */
export function PayStatementForm({
  statementId,
  outstanding,
}: {
  statementId: string
  outstanding: number
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(payStatement, null)
  const today = useMemo(() => todayISO(), [])

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="statement_id" value={statementId} />
      <FormMessage state={state} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="Số tiền">
          <Input
            name="amount"
            inputMode="numeric"
            required
            defaultValue={outstanding > 0 ? String(outstanding) : ''}
          />
        </Field>
        <Field label="Ngày thu">
          <Input type="date" name="payment_date" required defaultValue={today} />
        </Field>
        <Field label="Hình thức">
          <Select name="method" required defaultValue="bank_transfer">
            {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Mã tham chiếu" hint="Mã giao dịch ngân hàng, số phiếu thu">
        <Input name="reference" maxLength={120} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" pendingLabel="Đang ghi…">
          Ghi nhận thu {formatCurrency(outstanding)}
        </SubmitButton>
      </div>
    </form>
  )
}
