'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/Button'

/**
 * Nút submit tự khoá khi đang gửi — tránh Founder bấm hai lần và ghi nhận
 * thanh toán trùng.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  size = 'md',
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} className={className}>
      {pending ? (pendingLabel ?? 'Đang lưu…') : children}
    </Button>
  )
}
