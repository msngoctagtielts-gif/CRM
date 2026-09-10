'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { PERIOD_KEYS, PERIOD_LABEL, type PeriodKey } from '@/lib/period'

/**
 * Bộ lọc thời gian. Ghi vào query string nên có thể chia sẻ / bookmark được,
 * và dữ liệu vẫn lấy từ server (không đẩy số liệu tài chính xuống client).
 */
export function PeriodFilter({ current }: { current: PeriodKey }) {
  const router = useRouter()
  const params = useSearchParams()
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')

  function go(key: PeriodKey, f?: string, t?: string) {
    const next = new URLSearchParams(params.toString())
    next.set('period', key)
    if (key === 'custom') {
      if (f) next.set('from', f)
      if (t) next.set('to', t)
    } else {
      next.delete('from')
      next.delete('to')
    }
    router.push(`?${next.toString()}`)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => go(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
              current === key
                ? 'bg-navy-800 text-white'
                : 'bg-white text-navy-600 ring-1 ring-inset ring-navy-200 hover:bg-navy-50',
            )}
          >
            {PERIOD_LABEL[key]}
          </button>
        ))}
      </div>

      {current === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border-0 bg-white px-2.5 py-1.5 text-[0.8125rem] ring-1 ring-inset ring-navy-200"
            aria-label="Từ ngày"
          />
          <span className="text-navy-400">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border-0 bg-white px-2.5 py-1.5 text-[0.8125rem] ring-1 ring-inset ring-navy-200"
            aria-label="Đến ngày"
          />
          <button
            type="button"
            onClick={() => go('custom', from, to)}
            disabled={!from || !to}
            className="rounded-lg bg-gold-500 px-3 py-1.5 text-[0.8125rem] font-medium text-navy-900 hover:bg-gold-400 disabled:opacity-50"
          >
            Áp dụng
          </button>
        </div>
      ) : null}
    </div>
  )
}
