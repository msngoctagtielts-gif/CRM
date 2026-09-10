'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { rescanOverdueReports } from './actions'

export function RescanButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="text-right">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await rescanOverdueReports()
            setMessage(result.ok ? (result.message ?? 'Đã quét.') : result.error)
          })
        }
      >
        <RefreshCw className={pending ? 'size-4 animate-spin' : 'size-4'} />
        {pending ? 'Đang quét…' : 'Quét lại ngay'}
      </Button>
      {message ? <p className="mt-1 text-xs text-navy-500">{message}</p> : null}
    </div>
  )
}
