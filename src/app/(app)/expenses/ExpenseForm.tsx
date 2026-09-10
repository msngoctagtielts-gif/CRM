'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { EXPENSE_CATEGORY, PAYMENT_METHOD } from '@/lib/labels'
import { todayISO } from '@/lib/format'
import { recordExpense } from './actions'

export function ExpenseForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(recordExpense, null)

  return (
    <Card>
      <CardHeader title="Ghi nhận chi phí" />
      <CardBody>
        <form action={action} className="space-y-3">
          <FormMessage state={state} />

          <Field label="Ngày chi" required>
            <Input type="date" name="expense_date" required defaultValue={todayISO()} />
          </Field>

          <Field label="Hạng mục" required>
            <Select name="category" required defaultValue="other">
              {Object.entries(EXPENSE_CATEGORY).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nội dung" required>
            <Input name="description" required maxLength={500} placeholder="Ví dụ: Gói Zoom Pro tháng 9" />
          </Field>

          <Field label="Số tiền (VND)" required>
            <Input name="amount" inputMode="numeric" required placeholder="500000" />
          </Field>

          <Field label="Hình thức" required>
            <Select name="method" required defaultValue="bank_transfer">
              {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nhà cung cấp">
            <Input name="vendor" maxLength={150} />
          </Field>

          <Field label="Link hoá đơn" hint="Ảnh hoá đơn trên Google Drive">
            <Input type="url" name="receipt_url" placeholder="https://" />
          </Field>

          <Field label="Ghi chú">
            <Textarea name="notes" rows={2} />
          </Field>

          <SubmitButton className="w-full">Ghi nhận chi phí</SubmitButton>
        </form>
      </CardBody>
    </Card>
  )
}
