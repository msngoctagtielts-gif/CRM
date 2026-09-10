'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { STUDENT_STATUS } from '@/lib/labels'
import { createStudent, updateStudent } from './actions'
import type { Views } from '@/types/database.types'

type Option = { id: string; name_vi: string; code?: string }

export function StudentForm({
  programs,
  levels,
  mode,
  student,
}: {
  programs: Option[]
  levels: Option[]
  mode: 'create' | 'edit'
  student?: Views<'v_student_overview'>
}) {
  const action = mode === 'create' ? createStudent : updateStudent
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {student?.id ? <input type="hidden" name="id" value={student.id} /> : null}

      <FormMessage state={state} />

      <Card>
        <CardHeader title="Thông tin học viên" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Họ và tên" required className="sm:col-span-2">
            <Input name="full_name" defaultValue={student?.full_name ?? ''} required maxLength={120} />
          </Field>
          <Field label="Tên thường gọi" hint="Tên giáo viên dùng khi gọi trong lớp">
            <Input name="nickname" defaultValue={student?.nickname ?? ''} maxLength={60} />
          </Field>
          <Field label="Ngày sinh">
            <Input type="date" name="date_of_birth" defaultValue={student?.date_of_birth ?? ''} />
          </Field>
          <Field label="Giới tính">
            <Select name="gender" defaultValue={student?.gender ?? ''}>
              <option value="">— Chọn —</option>
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="other">Khác</option>
            </Select>
          </Field>
          <Field label="Trạng thái học tập" required>
            <Select name="status" defaultValue={student?.status ?? 'lead'} required>
              {Object.entries(STUDENT_STATUS).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Số điện thoại">
            <Input name="phone" defaultValue={student?.phone ?? ''} inputMode="tel" maxLength={30} />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" defaultValue={student?.email ?? ''} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chương trình học" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Chương trình">
            <Select name="program_id" defaultValue={student?.program_id ?? ''}>
              <option value="">— Chọn —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_vi}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cấp độ CEFR hiện tại">
            <Select name="current_level_id" defaultValue={student?.level_id ?? ''}>
              <option value="">— Chọn —</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {l.name_vi}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ngày ghi danh">
            <Input type="date" name="enrollment_date" defaultValue={student?.enrollment_date ?? ''} />
          </Field>
          <Field label="Nguồn" hint="Facebook, giới thiệu, Zalo…">
            <Input name="source" defaultValue={student?.source ?? ''} maxLength={80} />
          </Field>
          <Field label="Mục tiêu học tập" className="sm:col-span-2">
            <Textarea name="learning_goal" defaultValue={student?.learning_goal ?? ''} rows={2} />
          </Field>
          <Field
            label="Ghi chú học tập"
            hint="Điểm mạnh, điểm cần lưu ý khi dạy"
            className="sm:col-span-2"
          >
            <Textarea name="learning_notes" defaultValue={student?.learning_notes ?? ''} rows={3} />
          </Field>
        </CardBody>
      </Card>

      {mode === 'create' ? (
        <Card>
          <CardHeader
            title="Phụ huynh"
            description="Bỏ trống nếu học viên là người lớn tự liên hệ"
          />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên phụ huynh">
              <Input name="parent_name" maxLength={120} />
            </Field>
            <Field label="Quan hệ">
              <Select name="parent_relationship" defaultValue="mother">
                <option value="mother">Mẹ</option>
                <option value="father">Bố</option>
                <option value="guardian">Người bảo hộ</option>
                <option value="other">Khác</option>
              </Select>
            </Field>
            <Field label="Điện thoại phụ huynh">
              <Input name="parent_phone" inputMode="tel" maxLength={30} />
            </Field>
            <Field label="Email phụ huynh">
              <Input type="email" name="parent_email" />
            </Field>
          </CardBody>
        </Card>
      ) : null}

      <div className="flex justify-end gap-2">
        <SubmitButton size="lg">
          {mode === 'create' ? 'Tạo học viên' : 'Lưu thay đổi'}
        </SubmitButton>
      </div>
    </form>
  )
}
