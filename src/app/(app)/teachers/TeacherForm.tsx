'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { addTeacherRate, createTeacher } from './actions'

export function TeacherForm({ teachers }: { teachers: { id: string; full_name: string }[] }) {
  const [createState, createAction] = useActionState<ActionResult | null, FormData>(
    createTeacher,
    null,
  )
  const [rateState, rateAction] = useActionState<ActionResult | null, FormData>(
    addTeacherRate,
    null,
  )

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Thêm giáo viên" />
        <CardBody>
          <form action={createAction} className="space-y-4">
            <FormMessage state={createState} />
            <Field label="Họ và tên" required>
              <Input name="full_name" required maxLength={120} />
            </Field>
            <Field label="Tên gọi trong lớp" hint="Ví dụ: Ms. Sheba">
              <Input name="display_name" maxLength={80} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Điện thoại">
                <Input name="phone" inputMode="tel" maxLength={30} />
              </Field>
              <Field label="Quốc tịch">
                <Input name="nationality" maxLength={60} />
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" name="email" />
            </Field>
            <Field label="Ngày bắt đầu">
              <Input type="date" name="hired_date" />
            </Field>

            <fieldset className="rounded-lg bg-navy-50 p-3">
              <legend className="mnee-label px-1">Đơn giá theo buổi (VND)</legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <Field label="30 phút">
                  <Input name="rate_30" inputMode="numeric" placeholder="150000" />
                </Field>
                <Field label="60 phút">
                  <Input name="rate_60" inputMode="numeric" placeholder="300000" />
                </Field>
                <Field label="90 phút">
                  <Input name="rate_90" inputMode="numeric" placeholder="420000" />
                </Field>
              </div>
              <p className="mt-2 text-xs text-navy-400">
                Mỗi giáo viên có đơn giá riêng. Để trống nếu chưa dùng thời lượng đó.
              </p>
            </fieldset>

            <SubmitButton className="w-full">Thêm giáo viên</SubmitButton>
          </form>
        </CardBody>
      </Card>

      {teachers.length > 0 ? (
        <Card>
          <CardHeader
            title="Cập nhật đơn giá"
            description="Đơn giá mới chỉ áp dụng từ ngày hiệu lực"
          />
          <CardBody>
            <form action={rateAction} className="space-y-4">
              <FormMessage state={rateState} />
              <Field label="Giáo viên" required>
                <Select name="teacher_id" required defaultValue="">
                  <option value="" disabled>
                    — Chọn giáo viên —
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thời lượng" required>
                  <Select name="duration_minutes" required defaultValue="60">
                    <option value="30">30 phút</option>
                    <option value="60">60 phút</option>
                    <option value="90">90 phút</option>
                  </Select>
                </Field>
                <Field label="Đơn giá mới" required>
                  <Input name="rate_amount" inputMode="numeric" required placeholder="320000" />
                </Field>
              </div>
              <Field label="Hiệu lực từ" hint="Để trống là áp dụng từ hôm nay">
                <Input type="date" name="effective_from" />
              </Field>
              <SubmitButton variant="secondary" className="w-full">
                Thêm đơn giá
              </SubmitButton>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
