'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { ADJUSTMENT_KIND, PAYMENT_METHOD } from '@/lib/labels'
import { addPayrollAdjustment, buildPayroll, setPayrollStatus } from './actions'

/** Tính bảng lương một tháng cho một giáo viên. */
export function BuildPayrollForm({
  teachers,
  defaultMonth,
}: {
  teachers: { id: string; full_name: string }[]
  defaultMonth: string
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(buildPayroll, null)

  return (
    <Card>
      <CardHeader
        title="Tính bảng lương"
        description="Gom các buổi đã đủ điều kiện trong tháng. Không nhập tay từng buổi."
      />
      <CardBody>
        <form action={action} className="space-y-3">
          <FormMessage state={state} />

          <Field label="Giáo viên" required>
            <Select name="teacher_id" required defaultValue="">
              <option value="" disabled>
                — Chọn giáo viên —
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tháng" required>
            <Input type="month" name="month" required defaultValue={defaultMonth} />
          </Field>

          <SubmitButton className="w-full" pendingLabel="Đang tính…">
            Tính / tính lại
          </SubmitButton>
          <p className="text-xs text-navy-400">
            Đơn giá của mỗi buổi được đóng băng từ lúc buổi đó đủ điều kiện, nên đổi đơn giá về
            sau không làm sai lương đã tính. Kỳ đã duyệt thì không tính lại được.
          </p>
        </form>
      </CardBody>
    </Card>
  )
}

/** Chuyển trạng thái kỳ lương. Duyệt trước, trả sau — trigger trong CSDL bắt buộc thứ tự này. */
export function PayrollStatusForm({
  payrollId,
  status,
}: {
  payrollId: string
  status: string
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(setPayrollStatus, null)

  if (status === 'paid') return null

  const next =
    status === 'draft'
      ? { value: 'pending_review', label: 'Chuyển sang chờ duyệt', variant: 'secondary' as const }
      : status === 'pending_review'
        ? { value: 'approved', label: 'Duyệt kỳ lương', variant: 'gold' as const }
        : { value: 'paid', label: 'Đánh dấu đã trả', variant: 'primary' as const }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="payroll_id" value={payrollId} />
      <input type="hidden" name="status" value={next.value} />
      <FormMessage state={state} />
      {next.value === 'paid' ? (
        <Field label="Trả bằng">
          <Select name="paid_method" defaultValue="bank_transfer">
            {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <SubmitButton size="sm" variant={next.variant} pendingLabel="Đang lưu…">
        {next.label}
      </SubmitButton>
    </form>
  )
}

/** Thêm khoản thưởng / phụ cấp / trừ vào kỳ lương chưa duyệt. */
export function AdjustmentForm({ payrollId }: { payrollId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addPayrollAdjustment, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="payroll_id" value={payrollId} />
      <FormMessage state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Loại" required>
          <Select name="kind" required defaultValue="bonus">
            {Object.entries(ADJUSTMENT_KIND).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Số tiền" required hint="Khoản trừ tự mang dấu âm">
          <Input name="amount" inputMode="numeric" required placeholder="200000" />
        </Field>
        <Field label="Lý do" required className="sm:col-span-1">
          <Input name="description" required maxLength={500} placeholder="Thưởng KPI tháng" />
        </Field>
      </div>
      <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
        Thêm điều chỉnh
      </SubmitButton>
    </form>
  )
}
