'use client'

import { useActionState, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { CLASS_TYPE } from '@/lib/labels'
import { createClass } from './actions'

/** Sĩ số tối đa mặc định theo hình thức lớp. */
const DEFAULT_MAX: Record<string, number> = {
  one_to_one: 1,
  one_to_two: 2,
  small_group: 6,
}

export function ClassForm({
  programs,
  levels,
  teachers,
}: {
  programs: { id: string; name_vi: string }[]
  levels: { id: string; code: string; name_vi: string }[]
  teachers: { id: string; full_name: string }[]
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(createClass, null)
  const [classType, setClassType] = useState('one_to_one')

  return (
    <Card>
      <CardHeader title="Tạo lớp học" />
      <CardBody>
        <form action={action} className="space-y-4">
          <FormMessage state={state} />

          <Field label="Tên lớp" required hint="Ví dụ: Tân - 1:1 Kids A2">
            <Input name="name" required maxLength={120} />
          </Field>

          <Field label="Hình thức" required>
            <Select
              name="class_type"
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              required
            >
              {Object.entries(CLASS_TYPE).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sĩ số tối đa" required>
              <Input
                name="max_students"
                type="number"
                min={1}
                max={30}
                required
                key={classType}
                defaultValue={DEFAULT_MAX[classType] ?? 1}
              />
            </Field>
            <Field label="Thời lượng" required>
              <Select name="default_duration_minutes" defaultValue="60" required>
                <option value="30">30 phút</option>
                <option value="60">60 phút (chuẩn)</option>
                <option value="90">90 phút</option>
              </Select>
            </Field>
          </div>

          <Field label="Giáo viên">
            <Select name="teacher_id" defaultValue="">
              <option value="">— Chưa phân công —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Chương trình">
              <Select name="program_id" defaultValue="">
                <option value="">— Chọn —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_vi}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cấp độ">
              <Select name="level_id" defaultValue="">
                <option value="">— Chọn —</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Ngày khai giảng">
            <Input type="date" name="start_date" />
          </Field>

          <Field label="Link lớp học online" hint="Zoom / Google Meet">
            <Input name="meeting_url" type="url" placeholder="https://" />
          </Field>

          <Field label="Ghi chú">
            <Textarea name="notes" rows={2} />
          </Field>

          <SubmitButton className="w-full">Tạo lớp học</SubmitButton>
        </form>
      </CardBody>
    </Card>
  )
}
