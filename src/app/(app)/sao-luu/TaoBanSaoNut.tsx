'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { taoBanSaoLuu } from './actions'

export function TaoBanSaoNut() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    async () => taoBanSaoLuu(),
    null,
  )

  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton>Tạo bản sao lưu ngay</SubmitButton>
    </form>
  )
}
