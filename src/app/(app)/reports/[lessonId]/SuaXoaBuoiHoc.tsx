'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import { Field, Input, Select } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/lib/actions'
import { danhDauMienPhi, suaBuoiHoc, xoaBuoiHoc } from '@/app/(app)/lessons/actions'

/**
 * Khu vực sửa và xoá buổi học, đặt ở CUỐI màn hình báo cáo và mặc định đóng.
 *
 * Vì sao đóng sẵn: việc thường ngày trên màn hình này là viết nhận xét, không
 * phải sửa ngày hay xoá buổi. Mở sẵn một nút xoá cạnh ô nhập liệu là mời bấm
 * nhầm.
 *
 * Vì sao bắt gõ chữ XOA: buổi học kéo theo báo cáo, dòng trừ học phí, dòng
 * lương và link video. Một hộp thoại "Bạn có chắc không?" thì ai cũng bấm OK
 * theo phản xạ; gõ tay ba chữ thì phải dừng lại một nhịp.
 */
export function SuaXoaBuoiHoc({
  lessonId,
  lessonDate,
  durationMinutes,
  status,
  daKhoaLuong,
  giaoVienList,
  teacherId,
  mienPhi,
  lyDoMienPhi,
}: {
  lessonId: string
  lessonDate: string
  durationMinutes: number | null
  status: string
  daKhoaLuong: boolean
  giaoVienList: { id: string; full_name: string }[]
  teacherId: string | null
  mienPhi: boolean
  lyDoMienPhi: string | null
}) {
  const [mo, setMo] = useState(false)
  const [suaState, suaAction] = useActionState<ActionResult | null, FormData>(suaBuoiHoc, null)
  const [xoaState, xoaAction] = useActionState<ActionResult | null, FormData>(xoaBuoiHoc, null)
  const [mpState, mpAction] = useActionState<ActionResult | null, FormData>(danhDauMienPhi, null)

  if (!mo) {
    return (
      <div className="mt-6 border-t border-navy-100 pt-4">
        <Button variant="ghost" size="sm" onClick={() => setMo(true)}>
          Sửa hoặc xoá buổi học này
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-5 border-t border-navy-100 pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-800">Sửa hoặc xoá buổi học</h3>
        <Button variant="ghost" size="sm" onClick={() => setMo(false)}>
          Đóng
        </Button>
      </div>

      {daKhoaLuong ? (
        <Alert kind="warning">
          Buổi này đã chốt vào bảng lương nên không sửa và không xoá được. Muốn đổi thì dùng phiếu
          điều chỉnh lương — sửa lén con số gốc sau khi giáo viên đã nhận tiền là làm sai sổ.
        </Alert>
      ) : null}

      {/* SỬA */}
      <form action={suaAction} className="space-y-3">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <FormMessage state={suaState} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ngày học">
            <Input type="date" name="lesson_date" defaultValue={lessonDate} disabled={daKhoaLuong} />
          </Field>
          <Field label="Thời lượng" hint="Ảnh hưởng tới cả lương giáo viên và học phí học viên.">
            <Select name="duration_minutes" defaultValue={String(durationMinutes ?? 60)} disabled={daKhoaLuong}>
              <option value="30">30 phút</option>
              <option value="60">60 phút</option>
              <option value="75">75 phút</option>
              <option value="90">90 phút</option>
            </Select>
          </Field>
          <Field label="Giáo viên">
            <Select name="teacher_id" defaultValue={teacherId ?? ''} disabled={daKhoaLuong}>
              <option value="">— Giữ nguyên —</option>
              {giaoVienList.map((gv) => (
                <option key={gv.id} value={gv.id}>
                  {gv.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select name="status" defaultValue={status} disabled={daKhoaLuong}>
              <option value="scheduled">Đã xếp lịch</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã huỷ</option>
              <option value="no_show">Học viên không vào</option>
              <option value="rescheduled">Đã dời lịch</option>
            </Select>
          </Field>
        </div>

        <Field label="Lý do sửa" required hint="Bắt buộc. Ba tháng sau nhìn lại còn biết vì sao.">
          <Input
            name="ly_do"
            placeholder="Ví dụ: giáo viên ghi nhầm ngày, thực tế dạy 11/09"
            disabled={daKhoaLuong}
          />
        </Field>

        <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
          Lưu thay đổi
        </SubmitButton>
      </form>

      {/* MIỄN PHÍ / THU PHÍ */}
      <form action={mpAction} className="space-y-3 rounded-lg bg-amber-soft-50 p-4">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <FormMessage state={mpState} />

        <p className="text-[0.8125rem] text-navy-700">
          {mienPhi ? (
            <>
              Buổi này <strong>đang miễn phí</strong> — học viên không bị trừ buổi, nhưng giáo viên
              vẫn được trả lương đủ.
              {lyDoMienPhi ? (
                <>
                  {' '}
                  Lý do đã ghi: <em>{lyDoMienPhi}</em>
                </>
              ) : (
                <> Chưa ai ghi lý do — đây chính là chỗ cần cô quyết.</>
              )}
            </>
          ) : (
            <>
              Buổi này <strong>đang thu phí</strong>. Chuyển sang miễn phí sẽ hoàn lại buổi cho học
              viên; lương giáo viên không đổi.
            </>
          )}
        </p>

        <input type="hidden" name="mien_phi" value={mienPhi ? '0' : '1'} />
        <Field label={mienPhi ? 'Lý do thu phí trở lại' : 'Lý do miễn phí'} required>
          <Input
            name="ly_do"
            placeholder={
              mienPhi
                ? 'Ví dụ: đánh dấu nhầm, buổi này có thu phí'
                : 'Ví dụ: buổi kiểm tra đầu vào, không thu phí'
            }
          />
        </Field>

        <SubmitButton size="sm" variant="secondary" pendingLabel="Đang lưu…">
          {mienPhi ? 'Chuyển sang thu phí' : 'Đánh dấu miễn phí'}
        </SubmitButton>
      </form>

      {/* XOÁ */}
      <form action={xoaAction} className="space-y-3 rounded-lg bg-burgundy-50 p-4">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <FormMessage state={xoaState} />

        <p className="text-[0.8125rem] text-burgundy-800">
          Xoá buổi học sẽ xoá theo: báo cáo của giáo viên, các dòng trừ học phí (số buổi sẽ trả lại
          cho học viên), dòng tính lương, điểm danh và link video. Bản cũ được chụp lại đầy đủ trong
          nhật ký nên vẫn dựng lại được nếu xoá nhầm.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lý do xoá" required>
            <Input name="ly_do" placeholder="Ví dụ: ghi trùng, buổi này đã có ở dòng khác" disabled={daKhoaLuong} />
          </Field>
          <Field label="Gõ chữ XOA để xác nhận" required>
            <Input name="xac_nhan" placeholder="XOA" autoComplete="off" disabled={daKhoaLuong} />
          </Field>
        </div>

        <SubmitButton size="sm" variant="danger" pendingLabel="Đang xoá…">
          Xoá buổi học này
        </SubmitButton>
      </form>
    </div>
  )
}
