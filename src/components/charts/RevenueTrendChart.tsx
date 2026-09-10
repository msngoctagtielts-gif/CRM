'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatCurrencyShort } from '@/lib/format'

/**
 * Doanh thu ghi nhận so với tiền mặt thực thu.
 *
 * Vẽ hai đường tách biệt một cách có chủ ý: gộp chúng lại sẽ làm Founder hiểu
 * sai tình hình (xem mục XII trong PROJECT_PLAN.md).
 */
export function RevenueTrendChart({
  data,
}: {
  data: { day: string; revenue: number; cash: number }[]
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-[0.8125rem] text-navy-400">
        Chưa có dữ liệu trong khoảng thời gian này.
      </p>
    )
  }

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13294b" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#13294b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e9f2" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(v: string) => v.slice(8, 10) + '/' + v.slice(5, 7)}
            tick={{ fontSize: 11, fill: '#6885ad' }}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrencyShort(v)}
            tick={{ fontSize: 11, fill: '#6885ad' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: number, name) => [
              formatCurrency(value),
              name === 'revenue' ? 'Doanh thu ghi nhận' : 'Tiền mặt đã thu',
            ]}
            labelFormatter={(v: string) => `Ngày ${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e2e9f2',
              fontSize: 12,
              boxShadow: '0 4px 6px -1px rgb(15 32 64 / 0.08)',
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#13294b"
            strokeWidth={2}
            fill="url(#revGradient)"
          />
          <Line
            type="monotone"
            dataKey="cash"
            stroke="#c8a24a"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 3"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-navy-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-navy-800" /> Doanh thu ghi nhận (buổi đã dạy)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-gold-500" /> Tiền mặt đã thu
        </span>
      </div>
    </div>
  )
}
