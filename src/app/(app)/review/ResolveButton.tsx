'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { resolveDataReview } from './actions'

export function ResolveButton({
  entityType,
  entityId,
}: {
  entityType: string
  entityId: string
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(resolveDataReview, null)

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="entity_id" value={entityId} />
      <FormMessage state={state} />
      <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
        Đã đối soát xong
      </SubmitButton>
    </form>
  )
}
