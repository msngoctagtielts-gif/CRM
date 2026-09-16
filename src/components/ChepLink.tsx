'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Nút chép đường dẫn tài liệu vào bộ nhớ tạm.
 *
 * Cô Ngọc cần "gửi liền cho họ" — bấm một nút rồi dán thẳng vào Zalo là xong,
 * không phải mở tài liệu ra rồi đi tìm nút chia sẻ.
 *
 * navigator.clipboard chỉ chạy trên HTTPS và có thể bị trình duyệt từ chối.
 * Khi đó hiện chữ "Không chép được" thay vì im lặng để cô tưởng đã chép rồi.
 */
export function ChepLink({ url }: { url: string }) {
  const [trangThai, setTrangThai] = useState<'thuong' | 'xong' | 'loi'>('thuong')

  const chep = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setTrangThai('xong')
    } catch {
      setTrangThai('loi')
    }
    setTimeout(() => setTrangThai('thuong'), 2500)
  }

  return (
    <button
      type="button"
      onClick={chep}
      className="inline-flex items-center gap-1 rounded-md border border-navy-200 px-2 py-1 text-[0.6875rem] text-navy-600 hover:border-navy-300 hover:text-navy-900"
      aria-label={`Chép đường dẫn: ${url}`}
    >
      {trangThai === 'xong' ? (
        <>
          <Check className="size-3 text-sage-600" strokeWidth={2} />
          Đã chép
        </>
      ) : trangThai === 'loi' ? (
        <span className="text-burgundy-700">Không chép được</span>
      ) : (
        <>
          <Copy className="size-3" strokeWidth={1.75} />
          Chép link
        </>
      )}
    </button>
  )
}
