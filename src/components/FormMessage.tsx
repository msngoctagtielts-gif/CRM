import { Alert } from '@/components/ui/Alert'
import type { ActionResult } from '@/lib/actions'

export function FormMessage({ state }: { state: ActionResult | null }) {
  if (!state) return null
  return state.ok ? (
    <Alert kind="success">{state.message ?? 'Đã lưu.'}</Alert>
  ) : (
    <Alert kind="danger">{state.error}</Alert>
  )
}
