'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/lib/actions'
import { suaLop } from '../actions'

/**
 * Sửa thông tin lớp. KHÔNG có nút xoá — lớp gắn với toàn bộ lịch sử buổi học,
 * học phí đã trừ và lương đã trả. Lớp ngừng thì đổi trạng thái, số liệu cũ vẫn
 * còn nguyên và báo cáo tài chính các tháng trước vẫn đúng.
 */
export function SuaLop({
  classId,
  name,
  classCode,
  teacherId,
  status,
  meetingUrl,
  notes,
  giaoVienList,
}: {
  classId: string
  name: string
  classCode: string | null
  teacherId: string | null
  status: string
  meetingUrl: string | null
  notes: string | null
  giaoVienList: { id: string; full_name: string }[]
}) {
  const [mo, setMo] = useState(false)
  const [state, action] = useActionState<ActionResult | null, FormData>(suaLop, null)

  if (!mo) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setMo(true)}>
        Sửa thông tin lớp
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-lg bg-navy-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.8125rem] font-semibold text-navy-800">Sửa thông tin lớp</p>
        <Button variant="ghost" size="sm" onClick={() => setMo(false)}>
          Đóng
        </Button>
      </div>

      <input type="hidden" name="class_id" value={classId} />
      <FormMessage state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên lớp">
          <Input name="name" defaultValue={name} />
        </Field>
        <Field label="Mã lớp">
          <Input name="class_code" defaultValue={classCode ?? ''} />
        </Field>
        <Field label="Giáo viên phụ trách">
          <Select name="teacher_id" defaultValue={teacherId ?? ''}>
            <option value="">— Giữ nguyên —</option>
            {giaoVienList.map((gv) => (
              <option key={gv.id} value={gv.id}>
                {gv.full_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trạng thái">
          <Select name="status" defaultValue={status}>
            <option value="draft">Nháp</option>
            <option value="active">Đang học</option>
            <option value="paused">Tạm ngưng</option>
            <option value="completed">Đã kết thúc</option>
            <option value="cancelled">Đã huỷ</option>
          </Select>
        </Field>
        <Field label="Link phòng học" className="sm:col-span-2">
          <Input name="meeting_url" defaultValue={meetingUrl ?? ''} placeholder="https://…" />
        </Field>
        <Field label="Ghi chú" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={notes ?? ''} />
        </Field>
      </div>

      <Field label="Lý do sửa" required hint="Bắt buộc, để nhật ký còn dùng được.">
        <Input name="ly_do" placeholder="Ví dụ: đổi giáo viên phụ trách từ tháng 10" />
      </Field>

      <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
        Lưu thay đổi
      </SubmitButton>
    </form>
  )
}
