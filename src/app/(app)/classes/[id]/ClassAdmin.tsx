'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { WEEKDAYS } from '@/lib/labels'
import { todayISO } from '@/lib/format'
import { addSchedule, addStudentToClass, generateLessons } from '../actions'

export function ClassAdmin({
  classId,
  defaultDuration,
  students,
}: {
  classId: string
  defaultDuration: number
  students: { id: string; full_name: string; student_code: string | null }[]
}) {
  const [addState, addAction] = useActionState<ActionResult | null, FormData>(
    addStudentToClass,
    null,
  )
  const [schedState, schedAction] = useActionState<ActionResult | null, FormData>(addSchedule, null)
  const [genState, genAction] = useActionState<ActionResult | null, FormData>(generateLessons, null)

  const today = todayISO()
  const inAMonth = new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000)
    .toISOString()
    .slice(0, 10)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Thêm học viên" />
        <CardBody>
          <form action={addAction} className="space-y-3">
            <FormMessage state={addState} />
            <input type="hidden" name="class_id" value={classId} />
            <Field label="Học viên" required>
              <Select name="student_id" required defaultValue="">
                <option value="" disabled>
                  — Chọn học viên —
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} {s.student_code ? `(${s.student_code})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton variant="secondary" size="sm" className="w-full">
              Thêm vào lớp
            </SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Thêm lịch định kỳ" />
        <CardBody>
          <form action={schedAction} className="space-y-3">
            <FormMessage state={schedState} />
            <input type="hidden" name="class_id" value={classId} />
            <Field label="Thứ" required>
              <Select name="weekday" required defaultValue="1">
                {WEEKDAYS.map((label, index) => (
                  <option key={index} value={index}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giờ bắt đầu" required>
                <Input type="time" name="start_time" required defaultValue="19:00" step={300} />
              </Field>
              <Field label="Thời lượng" required>
                <Select name="duration_minutes" required defaultValue={String(defaultDuration)}>
                  <option value="30">30 phút</option>
                  <option value="60">60 phút</option>
                  <option value="90">90 phút</option>
                </Select>
              </Field>
            </div>
            <Field label="Hiệu lực từ">
              <Input type="date" name="effective_from" defaultValue={today} />
            </Field>
            <SubmitButton variant="secondary" size="sm" className="w-full">
              Thêm lịch
            </SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sinh buổi học"
          description="Tạo buổi theo lịch định kỳ; chạy lại không tạo trùng"
        />
        <CardBody>
          <form action={genAction} className="space-y-3">
            <FormMessage state={genState} />
            <input type="hidden" name="class_id" value={classId} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Từ ngày" required>
                <Input type="date" name="from" required defaultValue={today} />
              </Field>
              <Field label="Đến ngày" required>
                <Input type="date" name="to" required defaultValue={inAMonth} />
              </Field>
            </div>
            <SubmitButton variant="gold" size="sm" className="w-full">
              Sinh buổi học
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
