'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { datVaiTroGiangDay, themKhungGioRanh, xoaKhungGioRanh } from '../actions'

/** 0 = Chủ nhật, theo đúng quy ước dow của Postgres mà cả hệ thống đang dùng. */
const THU: { value: number; label: string }[] = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ nhật' },
]

export function VaiTroForm({ teacherId, vaiTro }: { teacherId: string; vaiTro: string | null }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(datVaiTroGiangDay, null)

  return (
    <Card>
      <CardHeader
        title="Vai trò giảng dạy"
        description="Dạy chính là người đang giữ lớp đều đặn. Dự phòng là người nhận lớp khi cần."
      />
      <CardBody>
        <form action={action} className="space-y-3">
          <FormMessage state={state} />
          <input type="hidden" name="teacher_id" value={teacherId} />
          <Field label="Vai trò">
            <Select name="teaching_role" defaultValue={vaiTro ?? ''}>
              <option value="">Chưa phân loại</option>
              <option value="chinh">Dạy chính</option>
              <option value="du_phong">Dự phòng</option>
            </Select>
          </Field>
          <SubmitButton>Lưu vai trò</SubmitButton>
        </form>
      </CardBody>
    </Card>
  )
}

export function ThemKhungGioForm({ teacherId }: { teacherId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(themKhungGioRanh, null)

  return (
    <Card>
      <CardHeader
        title="Thêm khung giờ có thể nhận lớp"
        description="Đây là giờ giáo viên rảnh, không phải lịch đã xếp."
      />
      <CardBody>
        <form action={action} className="space-y-3">
          <FormMessage state={state} />
          <input type="hidden" name="teacher_id" value={teacherId} />
          <Field label="Thứ" required>
            <Select name="weekday" defaultValue="1" required>
              {THU.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Từ" required>
              <Input type="time" name="start_time" required />
            </Field>
            <Field label="Đến" required>
              <Input type="time" name="end_time" required />
            </Field>
          </div>
          <Field label="Ghi chú" hint="Ví dụ: chỉ nhận lớp trẻ em">
            <Input name="note" maxLength={200} />
          </Field>
          <SubmitButton>Thêm khung giờ</SubmitButton>
        </form>
      </CardBody>
    </Card>
  )
}

export function XoaKhungGioNut({ id, teacherId }: { id: string; teacherId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(xoaKhungGioRanh, null)

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="teacher_id" value={teacherId} />
      <button
        type="submit"
        className="rounded px-2 py-1 text-xs font-medium text-burgundy-700 hover:bg-burgundy-50"
      >
        Xoá
      </button>
      {state && !state.ok ? (
        <span className="ml-2 text-xs text-burgundy-700">{state.error}</span>
      ) : null}
    </form>
  )
}
