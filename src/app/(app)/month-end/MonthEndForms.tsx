'use client'

import { useActionState } from 'react'
import { Calculator } from 'lucide-react'
import { Field, Input } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { buildAllPayroll } from './actions'

/** Tính lương cả tháng cho tất cả giáo viên — một lần bấm, không sót ai. */
export function BuildAllPayrollForm({ month }: { month: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(buildAllPayroll, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="month" value={month} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Đang tính lương…">
        <Calculator className="size-4" />
        Tính lương cả tháng cho tất cả giáo viên
      </SubmitButton>
      <p className="text-xs text-navy-400">
        Kỳ lương đã duyệt hoặc đã trả sẽ được bỏ qua, không bị tính đè.
      </p>
    </form>
  )
}

/** Đổi tháng đang xem. Dùng form GET để giữ được địa chỉ khi chia sẻ. */
export function MonthPicker({ month }: { month: string }) {
  return (
    <form method="get" className="flex items-end gap-2">
      <Field label="Tháng chốt" className="w-40">
        <Input type="month" name="month" defaultValue={month} />
      </Field>
      <SubmitButton variant="secondary" size="md">
        Xem
      </SubmitButton>
    </form>
  )
}
