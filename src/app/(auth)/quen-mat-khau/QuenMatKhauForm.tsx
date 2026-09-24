'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { guiLinkDatLaiMatKhau } from './actions'

export function QuenMatKhauForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    guiLinkDatLaiMatKhau,
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <Field label="Email" required hint="Email cô dùng để đăng nhập hệ thống.">
        <Input name="email" type="email" autoComplete="email" required placeholder="ten@vidu.com" />
      </Field>

      <SubmitButton size="lg" className="w-full" pendingLabel="Đang gửi…">
        Gửi đường dẫn đặt lại
      </SubmitButton>

      <p className="text-center text-[0.8125rem]">
        <Link href="/login" className="text-navy-600 underline-offset-2 hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </form>
  )
}
