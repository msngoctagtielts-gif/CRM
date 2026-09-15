'use client'

import { useActionState } from 'react'
import { Field, Input } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { datMatKhau } from './actions'

export function DatMatKhauForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(datMatKhau, null)

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <Field label="Mật khẩu mới" required hint="Ít nhất 10 ký tự.">
        <Input
          type="password"
          name="mat_khau"
          required
          minLength={10}
          autoComplete="new-password"
          autoFocus
        />
      </Field>

      <Field label="Nhập lại mật khẩu" required>
        <Input type="password" name="nhap_lai" required minLength={10} autoComplete="new-password" />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Đang lưu…">
        Đặt mật khẩu và vào hệ thống
      </SubmitButton>
    </form>
  )
}
