'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/lib/actions'
import { suaGiaoVien } from '../actions'

/**
 * Sửa hồ sơ giáo viên. KHÔNG có nút xoá — giáo viên gắn với lịch sử dạy và
 * lịch sử lương nhiều tháng.
 *
 * Lưu ý: "lưu trữ" ở đây KHÁC với thu hồi tài khoản đăng nhập. Có giáo viên
 * nghỉ dạy nhưng trung tâm vẫn cần tra lương cũ của họ, nên hai việc tách
 * riêng — thu hồi quyền đăng nhập nằm ở nút riêng.
 */
export function SuaGiaoVien({
  teacherId,
  fullName,
  displayName,
  email,
  phone,
  status,
  notes,
}: {
  teacherId: string
  fullName: string
  displayName: string | null
  email: string | null
  phone: string | null
  status: string
  notes: string | null
}) {
  const [mo, setMo] = useState(false)
  const [state, action] = useActionState<ActionResult | null, FormData>(suaGiaoVien, null)

  if (!mo) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setMo(true)}>
        Sửa hồ sơ
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-lg bg-navy-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.8125rem] font-semibold text-navy-800">Sửa hồ sơ giáo viên</p>
        <Button variant="ghost" size="sm" onClick={() => setMo(false)}>
          Đóng
        </Button>
      </div>

      <input type="hidden" name="teacher_id" value={teacherId} />
      <FormMessage state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Họ tên">
          <Input name="full_name" defaultValue={fullName} />
        </Field>
        <Field label="Tên hiển thị">
          <Input name="display_name" defaultValue={displayName ?? ''} />
        </Field>
        <Field label="Email">
          <Input type="email" name="email" defaultValue={email ?? ''} />
        </Field>
        <Field label="Điện thoại">
          <Input name="phone" defaultValue={phone ?? ''} />
        </Field>
        <Field label="Trạng thái" hint="Lưu trữ = nghỉ dạy. Lương và lịch sử cũ vẫn tra được.">
          <Select name="status" defaultValue={status}>
            <option value="active">Đang dạy</option>
            <option value="archived">Đã lưu trữ</option>
          </Select>
        </Field>
        <Field label="Ghi chú" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={notes ?? ''} />
        </Field>
      </div>

      <Field label="Lý do sửa" required>
        <Input name="ly_do" placeholder="Ví dụ: cập nhật số điện thoại mới" />
      </Field>

      <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
        Lưu thay đổi
      </SubmitButton>
    </form>
  )
}
