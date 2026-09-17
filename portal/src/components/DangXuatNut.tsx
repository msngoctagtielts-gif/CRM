'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DangXuatNut() {
  const router = useRouter()
  const [dangChay, setDangChay] = useState(false)

  return (
    <button
      type="button"
      disabled={dangChay}
      onClick={async () => {
        setDangChay(true)
        await createClient().auth.signOut()
        router.replace('/dang-nhap')
        router.refresh()
      }}
      className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:border-navy-400 disabled:opacity-50"
    >
      {dangChay ? 'Đang thoát…' : 'Đăng xuất'}
    </button>
  )
}
