'use client'

import { useActionState, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { Alert } from '@/components/ui/Alert'
import type { ActionResult } from '@/lib/actions'
import { inviteTeacher } from './actions'

export type GiaoVienChuaCoTaiKhoan = { id: string; ten: string }

/**
 * Mời giáo viên vào hệ thống.
 *
 * Kết quả trả về là một ĐƯỜNG DẪN, không phải mật khẩu. Founder copy đường dẫn
 * gửi qua Zalo; giáo viên bấm vào và tự đặt mật khẩu. Trung tâm không bao giờ
 * biết mật khẩu của giáo viên, và không có mật khẩu nào nằm lại trong lịch sử
 * tin nhắn.
 */
export function InviteTeacherForm({ teachers }: { teachers: GiaoVienChuaCoTaiKhoan[] }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(inviteTeacher, null)
  const [daCopy, setDaCopy] = useState(false)

  // Thông điệp thành công có dạng "…:\n\n<đường dẫn>". Tách ra để hiện nút copy
  // thay vì bắt Founder bôi đen một chuỗi dài trên điện thoại.
  const phan = state?.ok ? (state.message ?? '').split('\n\n') : []
  const loiNhan = phan[0] ?? ''
  const duongDan = phan[1] ?? ''

  return (
    <Card>
      <CardHeader
        title="Mời giáo viên vào hệ thống"
        description="Tạo tài khoản và sinh đường dẫn để giáo viên tự đặt mật khẩu."
      />
      <CardBody>
        {teachers.length === 0 ? (
          <p className="text-[0.8125rem] text-navy-400">
            Tất cả giáo viên đang dạy đều đã có tài khoản.
          </p>
        ) : (
          <form action={action} className="space-y-3">
            {state && !state.ok ? <Alert kind="danger">{state.error}</Alert> : null}

            {state?.ok ? (
              <Alert kind="success">
                <p>{loiNhan}</p>
                {duongDan ? (
                  <>
                    <p className="mt-2 break-all rounded bg-white/70 p-2 font-mono text-[0.7rem] leading-relaxed text-navy-800">
                      {duongDan}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(duongDan).then(() => setDaCopy(true))
                      }}
                      className="mt-2 text-[0.8125rem] font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900"
                    >
                      {daCopy ? 'Đã copy đường dẫn' : 'Copy đường dẫn'}
                    </button>
                  </>
                ) : null}
              </Alert>
            ) : null}

            <Field label="Giáo viên" required>
              <Select name="teacher_id" required defaultValue="">
                <option value="" disabled>
                  — Chọn giáo viên —
                </option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ten}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Email của giáo viên"
              required
              hint="Dùng làm tên đăng nhập. Phải là email giáo viên thật sự đang dùng."
            >
              <Input type="email" name="email" required placeholder="ten@gmail.com" />
            </Field>

            <SubmitButton className="w-full" pendingLabel="Đang tạo…">
              Tạo tài khoản và lấy đường dẫn
            </SubmitButton>

            <p className="text-xs leading-relaxed text-navy-400">
              Hệ thống <strong>không</strong> đặt mật khẩu tạm và không gửi email. Đường dẫn
              hiện ra ở đây, cô copy gửi qua Zalo. Giáo viên bấm vào và tự đặt mật khẩu —
              trung tâm không biết mật khẩu đó. Đường dẫn dùng một lần rồi hết hiệu lực.
            </p>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
