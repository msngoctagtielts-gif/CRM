'use client'

import { useActionState, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { PAYMENT_METHOD } from '@/lib/labels'
import { formatCurrency, todayISO } from '@/lib/format'
import { createEnrollment, recordPayment } from './actions'

type Student = { id: string; full_name: string; student_code: string | null }
type Enrollment = { id: string; student_id: string; label: string; status: string }

export function PaymentForms({
  students,
  classes,
  programs,
  packages,
  enrollments,
}: {
  students: Student[]
  classes: { id: string; name: string }[]
  programs: { id: string; name_vi: string }[]
  packages: { id: string; name: string; lesson_count: number; default_price_per_lesson: number }[]
  enrollments: Enrollment[]
}) {
  const [payState, payAction] = useActionState<ActionResult | null, FormData>(recordPayment, null)
  const [enrollState, enrollAction] = useActionState<ActionResult | null, FormData>(
    createEnrollment,
    null,
  )

  const [payStudent, setPayStudent] = useState('')
  const [lessons, setLessons] = useState('12')
  const [price, setPrice] = useState('250000')
  const [discount, setDiscount] = useState('0')

  const studentEnrollments = useMemo(
    () => enrollments.filter((e) => e.student_id === payStudent),
    [enrollments, payStudent],
  )

  // Xem trước số tiền để Founder phát hiện sai sót trước khi lưu.
  const preview = useMemo(() => {
    const gross = (Number(lessons) || 0) * (Number(price) || 0)
    const net = Math.max(0, gross - (Number(discount) || 0))
    return { gross, net }
  }, [lessons, price, discount])

  const today = todayISO()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Ghi nhận thanh toán" description="Tiền đã thực nhận" />
        <CardBody>
          <form action={payAction} className="space-y-3">
            <FormMessage state={payState} />

            <Field label="Học viên" required>
              <Select
                name="student_id"
                required
                value={payStudent}
                onChange={(e) => setPayStudent(e.target.value)}
              >
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

            <Field
              label="Hợp đồng học phí"
              hint={
                payStudent && studentEnrollments.length === 0
                  ? 'Học viên này chưa có hợp đồng — tạo hợp đồng bên dưới để theo dõi công nợ.'
                  : 'Gắn vào hợp đồng để trừ công nợ đúng chỗ'
              }
            >
              <Select name="enrollment_id" defaultValue="" disabled={!payStudent}>
                <option value="">— Không gắn hợp đồng —</option>
                {studentEnrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Số tiền (VND)" required>
              <Input name="amount" inputMode="numeric" required placeholder="3000000" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày thu" required>
                <Input type="date" name="payment_date" required defaultValue={today} />
              </Field>
              <Field label="Hình thức" required>
                <Select name="method" required defaultValue="bank_transfer">
                  {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Mã tham chiếu" hint="Mã giao dịch ngân hàng, số phiếu thu">
              <Input name="reference" maxLength={120} />
            </Field>

            <Field label="Ghi chú">
              <Textarea name="notes" rows={2} />
            </Field>

            <SubmitButton className="w-full">Ghi nhận thanh toán</SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Tạo hợp đồng học phí"
          description="Đơn giá riêng cho từng học viên"
        />
        <CardBody>
          <form action={enrollAction} className="space-y-3">
            <FormMessage state={enrollState} />

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

            <Field label="Gói tham khảo" hint="Chỉ để điền nhanh — giá cuối vẫn do bạn quyết định">
              <Select
                name="tuition_package_id"
                defaultValue=""
                onChange={(e) => {
                  const pkg = packages.find((p) => p.id === e.target.value)
                  if (pkg) {
                    setLessons(String(pkg.lesson_count))
                    setPrice(String(pkg.default_price_per_lesson))
                  }
                }}
              >
                <option value="">— Không dùng gói —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số buổi" required>
                <Input
                  name="lessons_purchased"
                  inputMode="numeric"
                  required
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                />
              </Field>
              <Field label="Đơn giá / buổi" required>
                <Input
                  name="price_per_lesson"
                  inputMode="numeric"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Giảm giá (VND)">
              <Input
                name="discount_amount"
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </Field>

            <div className="rounded-lg bg-navy-50 px-3 py-2.5 text-[0.8125rem]">
              <div className="flex justify-between text-navy-500">
                <span>Tổng trước giảm</span>
                <span className="tabular">{formatCurrency(preview.gross)}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold text-navy-900">
                <span>Phải thanh toán</span>
                <span className="tabular">{formatCurrency(preview.net)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Lớp áp dụng">
                <Select name="class_id" defaultValue="">
                  <option value="">— Không gắn lớp —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
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
            </div>

            <Field label="Ngày bắt đầu" required>
              <Input type="date" name="start_date" required defaultValue={today} />
            </Field>

            <Field label="Ghi chú thoả thuận">
              <Textarea name="agreement_notes" rows={2} />
            </Field>

            <SubmitButton variant="secondary" className="w-full">
              Tạo hợp đồng
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
