'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Tin nhắn nhắc học phí soạn sẵn để Founder copy gửi Zalo.
 *
 * Ba điều cố ý:
 *   · Nhắn cho ĐÚNG người đóng tiền, không phải học viên. Lớp Y Khoa là chị
 *     Hoàng Uyên chứ không phải Ms. Min.
 *   · Nêu con số cụ thể (còn mấy buổi, thiếu bao nhiêu) thay vì nhắc chung
 *     chung — phụ huynh không phải hỏi lại.
 *   · KHÔNG tự gửi. Founder đọc, sửa nếu cần, rồi mới gửi.
 */
export function ReminderMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-2">
      <textarea
        readOnly
        value={text}
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        className="block w-full rounded-lg border-0 bg-navy-50 px-3 py-2 text-[0.8125rem] text-navy-800 ring-1 ring-inset ring-navy-200 focus:ring-2 focus:ring-inset focus:ring-gold-500"
      />
      <button
        type="button"
        onClick={() => {
          // clipboard API cần ngữ cảnh bảo mật (https). Không có thì bôi đen sẵn
          // để người dùng tự Ctrl+C, thay vì bấm xong không thấy gì xảy ra.
          navigator.clipboard
            ?.writeText(text)
            .then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => {
              const box = document.activeElement as HTMLElement | null
              box?.blur()
            })
        }}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50 hover:text-navy-900"
      >
        {copied ? <Check className="size-3.5 text-sage-600" /> : <Copy className="size-3.5" />}
        {copied ? 'Đã chép' : 'Chép tin nhắn'}
      </button>
    </div>
  )
}
