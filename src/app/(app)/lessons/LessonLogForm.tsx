'use client'

import { useActionState, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { todayISO } from '@/lib/format'
import { logLesson } from './actions'

export type LopChon = {
  id: string
  ten: string
  teacher_id: string | null
  teacher_ten: string | null
  si_so: number
}

/**
 * Biểu mẫu ghi buổi học — dùng trên điện thoại ngay sau khi dạy xong.
 *
 * Bốn ô đầu là bắt buộc và không có ngoại lệ: giờ vào, giờ ra, tiêu đề nội dung,
 * link video. Ba con số đo ngày 15/09/2026 giải thích vì sao — 314/458 buổi
 * không sinh được lương vì thiếu giờ, 458/458 buổi trống nội dung, 458/458 buổi
 * không có video. Bỏ ràng buộc là biểu mẫu mất tác dụng.
 *
 * Ô "ghi chú nhanh" cố ý để tự do và không bắt buộc: giáo viên gõ vài gạch đầu
 * dòng ngay lúc còn nhớ. Đây là NGUYÊN LIỆU THẬT để soạn phần nhận xét chi tiết
 * ở bước sau — không phải để thay thế nó.
 */
export function LessonLogForm({ lops }: { lops: LopChon[] }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(logLesson, null)
  const [lopId, setLopId] = useState('')
  const [coPhan2, setCoPhan2] = useState(false)

  const lop = useMemo(() => lops.find((l) => l.id === lopId), [lops, lopId])

  return (
    <Card>
      <CardHeader
        title="Ghi buổi học vừa dạy"
        description="Khoảng hai phút. Điền xong là học phí, lương giáo viên và báo cáo phụ huynh đều có dữ liệu."
      />
      <CardBody>
        {lops.length === 0 ? (
          <p className="text-[0.8125rem] text-navy-400">
            Chưa có lớp nào đang hoạt động để ghi buổi học.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <FormMessage state={state} />

            <Field label="Lớp" required>
              <Select
                name="class_id"
                required
                value={lopId}
                onChange={(e) => setLopId(e.target.value)}
              >
                <option value="" disabled>
                  — Chọn lớp —
                </option>
                {lops.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.ten}
                    {l.teacher_ten ? ` · ${l.teacher_ten}` : ''}
                  </option>
                ))}
              </Select>
            </Field>

            {lop ? (
              <input type="hidden" name="teacher_id" value={lop.teacher_id ?? ''} />
            ) : null}

            {lop && !lop.teacher_id ? (
              <p className="text-xs font-medium text-burgundy-600">
                Lớp này chưa gán giáo viên phụ trách. Gán giáo viên ở trang Lớp học trước, nếu
                không hệ thống sẽ không tính được lương cho buổi này.
              </p>
            ) : null}

            {lop && lop.si_so === 0 ? (
              <p className="text-xs font-medium text-burgundy-600">
                Lớp này chưa có học viên nào đang hoạt động. Thêm học viên vào lớp trước.
              </p>
            ) : null}

            <Field label="Ngày học" required>
              <Input type="date" name="lesson_date" required defaultValue={todayISO()} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Giờ vào" required>
                <Input type="time" name="start_time" required />
              </Field>
              <Field label="Giờ ra" required>
                <Input type="time" name="end_time" required />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-navy-400">
              Ghi giờ thật, không làm tròn. Thời lượng thật là căn cứ tính lương, và cũng là
              bằng chứng khi phụ huynh hỏi buổi học kéo dài bao lâu.
            </p>

            <Field
              label="Tiêu đề nội dung buổi học"
              required
              hint="Một dòng, đủ để nhận ra bài. Ví dụ: Kid's Box 3 Unit 5 Lesson 2 – must và mustn't"
            >
              <Input
                type="text"
                name="topic"
                required
                minLength={3}
                maxLength={300}
                placeholder="Sách, unit, nội dung chính"
              />
            </Field>

            <Field
              label="Link video buổi học"
              required
              hint="Dán đường dẫn ghi hình. Không có link thì buổi học coi như chưa ghi xong."
            >
              <Input type="url" name="video_url" required placeholder="https://..." />
            </Field>

            {coPhan2 ? (
              <Field label="Link video phần 2">
                <Input type="url" name="video_url_2" placeholder="https://..." />
              </Field>
            ) : (
              <button
                type="button"
                onClick={() => setCoPhan2(true)}
                className="text-[0.8125rem] font-medium text-navy-600 underline underline-offset-2 hover:text-navy-900"
              >
                + Buổi này có hai đoạn video
              </button>
            )}

            <Field
              label="Ghi chú nhanh"
              hint="Vài gạch đầu dòng lúc còn nhớ: câu học viên nói được, lỗi lặp lại, bài tập đã giao. Đây là nguyên liệu để soạn nhận xét gửi phụ huynh."
            >
              <Textarea
                name="quick_notes"
                rows={4}
                maxLength={4000}
                placeholder={'- Con nói được: ...\n- Lỗi lặp lại: ...\n- Bài tập: ...'}
              />
            </Field>

            <div className="space-y-2 rounded-lg bg-navy-50 p-3">
              <label className="flex items-start gap-2.5 text-[0.8125rem] text-navy-700">
                <input
                  type="checkbox"
                  name="is_free"
                  value="1"
                  className="mt-0.5 h-4 w-4 rounded border-navy-300 text-gold-600 focus:ring-gold-500"
                />
                <span>
                  Buổi này <strong>miễn phí</strong> — học thử, buổi làm quen, hoặc buổi tặng.
                  Không tính học phí, nhưng vẫn tính lương giáo viên.
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-[0.8125rem] text-navy-700">
                <input
                  type="checkbox"
                  name="is_makeup"
                  value="1"
                  className="mt-0.5 h-4 w-4 rounded border-navy-300 text-gold-600 focus:ring-gold-500"
                />
                <span>Buổi học bù</span>
              </label>
            </div>

            <SubmitButton className="w-full" pendingLabel="Đang ghi…">
              Ghi buổi học
            </SubmitButton>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
