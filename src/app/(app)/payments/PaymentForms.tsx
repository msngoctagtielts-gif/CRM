'use client'

import { useActionState, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { BILLING_MODE, PAYMENT_METHOD } from '@/lib/labels'
import { formatCurrency, todayISO } from '@/lib/format'
import { addTuitionRate, createEnrollment, recordPayment } from './actions'

type Student = { id: string; full_name: string; student_code: string | null }
type Parent = { id: string; full_name: string }
type Enrollment = { id: string; student_id: string; label: string; status: string }
type TuitionRate = {
  enrollment_id: string
  price_per_lesson: number
  effective_from: string
  effective_to: string | null
}

export function PaymentForms({
  students,
  parents,
  classes,
  programs,
  packages,
  enrollments,
  rates,
}: {
  students: Student[]
  parents: Parent[]
  classes: { id: string; name: string }[]
  programs: { id: string; name_vi: string }[]
  packages: { id: string; name: string; lesson_count: number; default_price_per_lesson: number }[]
  enrollments: Enrollment[]
  rates: TuitionRate[]
}) {
  const [payState, payAction] = useActionState<ActionResult | null, FormData>(recordPayment, null)
  const [enrollState, enrollAction] = useActionState<ActionResult | null, FormData>(
    createEnrollment,
    null,
  )

  const [payStudent, setPayStudent] = useState('')
  const [billingMode, setBillingMode] =
    useState<'prepaid_package' | 'monthly_postpaid' | 'undetermined'>('prepaid_package')
  const [lessons, setLessons] = useState('12')
  const [price, setPrice] = useState('250000')
  const [discount, setDiscount] = useState('0')
  const [headcount, setHeadcount] = useState('1')
  const [monthlyDiscount, setMonthlyDiscount] = useState('0')
  const [payer, setPayer] = useState('')

  const isPrepaid = billingMode === 'prepaid_package'

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

  // Trả sau theo tháng: chưa biết số buổi, nên chỉ ước lượng được tiền mỗi buổi.
  const perLessonPreview = useMemo(
    () => (Number(price) || 0) * (Number(headcount) || 1),
    [price, headcount],
  )

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
          description="Đơn giá riêng cho từng học viên — không có giá cố định toàn trung tâm"
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

            {/* D1 — hai hình thức đóng khác nhau về bản chất, không phải tuỳ chọn hiển thị */}
            <Field
              label="Hình thức đóng học phí"
              required
              hint={
                isPrepaid
                  ? 'Đóng trước một gói buổi, trừ dần theo từng buổi đã dạy.'
                  : billingMode === 'monthly_postpaid'
                    ? 'Học trước, cuối tháng lập phiếu đối soát rồi mới thu. Số buổi và tổng tiền chỉ biết khi chốt tháng.'
                    : 'Chưa chốt hình thức — dùng tạm khi di trú dữ liệu, cần đối soát lại sau.'
              }
            >
              <Select
                name="billing_mode"
                required
                value={billingMode}
                onChange={(e) =>
                  setBillingMode(e.target.value as 'prepaid_package' | 'monthly_postpaid' | 'undetermined')
                }
              >
                {Object.entries(BILLING_MODE).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </Field>

            {isPrepaid ? (
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
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {isPrepaid ? (
                <Field label="Số buổi" required>
                  <Input
                    name="lessons_purchased"
                    inputMode="numeric"
                    required
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                  />
                </Field>
              ) : (
                <Field label="Số người trong lớp" hint="Lớp nhóm tính đơn giá theo đầu người">
                  <Input
                    name="headcount"
                    inputMode="numeric"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                  />
                </Field>
              )}
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

            {isPrepaid ? (
              <>
                <Field label="Giảm giá (VND)" hint="Giảm một lần trên toàn bộ gói">
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
              </>
            ) : (
              <>
                <Field
                  label="Chiết khấu mỗi tháng (VND)"
                  hint="Trừ cố định khi lập phiếu đối soát từng tháng"
                >
                  <Input
                    name="monthly_discount_amount"
                    inputMode="numeric"
                    value={monthlyDiscount}
                    onChange={(e) => setMonthlyDiscount(e.target.value)}
                  />
                </Field>

                <div className="rounded-lg bg-navy-50 px-3 py-2.5 text-[0.8125rem]">
                  <div className="flex justify-between text-navy-500">
                    <span>Tiền mỗi buổi ({headcount || 1} người)</span>
                    <span className="tabular">{formatCurrency(perLessonPreview)}</span>
                  </div>
                  <p className="mt-1 text-xs text-navy-400">
                    Tổng tiền cả tháng chỉ chốt được khi biết số buổi đã dạy, nên hợp đồng này
                    không ghi trước tổng tiền.
                  </p>
                </div>
              </>
            )}

            {/* D13, D14 — người đứng tên đóng có thể không phải học viên */}
            <Field
              label="Người đứng tên đóng"
              hint="Lớp nhóm thường có một người đóng cho cả nhóm. Để trống nghĩa là chính học viên đóng."
            >
              <Select name="payer" value={payer} onChange={(e) => setPayer(e.target.value)}>
                <option value="">— Chính học viên của hợp đồng —</option>
                <optgroup label="Học viên khác trong nhóm">
                  {students.map((s) => (
                    <option key={s.id} value={`student:${s.id}`}>
                      {s.full_name}
                    </option>
                  ))}
                </optgroup>
                {parents.length > 0 ? (
                  <optgroup label="Người ngoài đã có hồ sơ">
                    {parents.map((p) => (
                      <option key={p.id} value={`parent:${p.id}`}>
                        {p.full_name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <option value="new">+ Người ngoài chưa có hồ sơ…</option>
              </Select>
            </Field>

            {payer === 'new' ? (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-gold-50 p-3">
                <Field label="Tên người đóng" required>
                  <Input name="payer_new_name" maxLength={200} placeholder="Hoàng Uyên" />
                </Field>
                <Field label="Số điện thoại">
                  <Input name="payer_new_phone" maxLength={40} inputMode="tel" />
                </Field>
              </div>
            ) : null}

            {payer !== '' ? (
              <Field label="Quan hệ với học viên" hint='Ví dụ: "vợ anh Max"'>
                <Input name="payer_note" maxLength={500} />
              </Field>
            ) : null}

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

            <Field label="Ngày bắt đầu" required hint="Cũng là ngày đơn giá trên bắt đầu có hiệu lực">
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

      <TuitionRateForm enrollments={enrollments} rates={rates} today={today} />
    </div>
  )
}

/**
 * Đổi đơn giá học phí kể từ một ngày (D11).
 *
 * Ca thật: Bé Ngân 179.000 ₫ đến 31/08/2026, rồi 190.000 ₫ từ 01/09/2026. Không
 * sửa đè lên đơn giá cũ, vì buổi đã dạy trước ngày đổi giá phải giữ nguyên số
 * tiền đã tính — mỗi mốc là một dòng riêng có ngày hiệu lực.
 */
function TuitionRateForm({
  enrollments,
  rates,
  today,
}: {
  enrollments: Enrollment[]
  rates: TuitionRate[]
  today: string
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addTuitionRate, null)
  const [enrollmentId, setEnrollmentId] = useState('')

  const history = useMemo(
    () =>
      rates
        .filter((r) => r.enrollment_id === enrollmentId)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from)),
    [rates, enrollmentId],
  )

  return (
    <Card>
      <CardHeader
        title="Đổi đơn giá học phí"
        description="Giá mới áp dụng từ một ngày; buổi đã dạy trước đó giữ nguyên giá cũ"
      />
      <CardBody>
        <form action={action} className="space-y-3">
          <FormMessage state={state} />

          <Field label="Hợp đồng" required>
            <Select
              name="enrollment_id"
              required
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
            >
              <option value="" disabled>
                — Chọn hợp đồng —
              </option>
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>

          {history.length > 0 ? (
            <div className="rounded-lg bg-navy-50 px-3 py-2.5 text-[0.8125rem]">
              <p className="mnee-label mb-1.5">Các mốc đã có</p>
              <ul className="space-y-1">
                {history.map((r) => (
                  <li
                    key={`${r.effective_from}-${r.price_per_lesson}`}
                    className="flex justify-between text-navy-600"
                  >
                    <span>
                      Từ {r.effective_from}
                      {r.effective_to ? ` đến ${r.effective_to}` : ' đến nay'}
                    </span>
                    <span className="tabular font-medium text-navy-900">
                      {formatCurrency(r.price_per_lesson)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn giá mới" required>
              <Input name="price_per_lesson" inputMode="numeric" required placeholder="190000" />
            </Field>
            <Field label="Áp dụng từ ngày" required>
              <Input type="date" name="effective_from" required defaultValue={today} />
            </Field>
          </div>

          <Field label="Căn cứ" hint="Chứng từ hoặc ngày Founder chốt giá">
            <Input name="evidence_note" maxLength={500} />
          </Field>

          <SubmitButton variant="secondary" className="w-full">
            Thêm mốc đơn giá
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  )
}
