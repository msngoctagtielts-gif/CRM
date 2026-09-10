'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { ATTENDANCE_STATUS, ATTITUDE, HOMEWORK_COMPLETION } from '@/lib/labels'
import { saveTeachingReport } from '../actions'

type Student = {
  id: string
  full_name: string
  nickname: string | null
  student_code: string | null
}

type Defaults = {
  start_time: string
  end_time: string
  lesson_content: string
  teacher_comments: string
  next_lesson_recommendation: string
  homework_title: string
  homework_description: string
  homework_due_date: string
  recording_url: string
  lessonCompleted: boolean
}

/**
 * Biểu mẫu báo cáo giảng dạy — thiết kế mobile-first.
 *
 * Giáo viên thường nhập trên điện thoại ngay sau buổi dạy, nên:
 *   · một cột duy nhất, không có bảng cần cuộn ngang
 *   · vùng bấm cao tối thiểu 44px
 *   · ba trường bắt buộc (bài tập, recording, nhận xét) được đánh dấu rõ
 *   · dùng form action của server nên vẫn gửi được khi mạng yếu
 */
export function ReportForm({
  lessonId,
  canEdit,
  students,
  defaults,
  attendance,
  feedback,
}: {
  lessonId: string
  canEdit: boolean
  students: Student[]
  defaults: Defaults
  attendance: Record<string, string>
  feedback: Record<
    string,
    { attitude: string; performance: string; comments: string; homework_completion: string }
  >
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(saveTeachingReport, null)

  return (
    <form action={action} className="space-y-5 pb-24">
      <input type="hidden" name="lesson_id" value={lessonId} />
      <FormMessage state={state} />

      <Card>
        <CardHeader title="Thời gian buổi học" description="Dùng để tính thời lượng và lương" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Giờ bắt đầu" required>
            <Input
              type="datetime-local"
              name="start_time"
              defaultValue={defaults.start_time}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Giờ kết thúc" required hint="Hạn nộp báo cáo tính từ mốc này + 10 giờ">
            <Input
              type="datetime-local"
              name="end_time"
              defaultValue={defaults.end_time}
              disabled={!canEdit}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Điểm danh" description="Vắng có phép không bị trừ buổi" />
        <CardBody className="space-y-4">
          {students.length === 0 ? (
            <p className="text-[0.8125rem] text-navy-400">
              Lớp này chưa có học viên. Thêm học viên vào lớp trước khi điểm danh.
            </p>
          ) : (
            students.map((s) => (
              <div key={s.id} className="rounded-lg bg-navy-50 p-3">
                <p className="text-[0.8125rem] font-medium text-navy-900">
                  {s.full_name}
                  {s.nickname ? (
                    <span className="ml-1.5 font-normal text-navy-400">({s.nickname})</span>
                  ) : null}
                </p>
                <div className="mt-2">
                  <Select
                    name={`attendance_${s.id}`}
                    defaultValue={attendance[s.id] ?? 'present'}
                    disabled={!canEdit}
                    aria-label={`Điểm danh ${s.full_name}`}
                  >
                    {Object.entries(ATTENDANCE_STATUS).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Nội dung đã dạy" />
        <CardBody>
          <Field label="Nội dung buổi học" hint="Unit, chủ điểm, kỹ năng đã luyện">
            <Textarea
              name="lesson_content"
              defaultValue={defaults.lesson_content}
              rows={3}
              disabled={!canEdit}
              placeholder="Ví dụ: Unit 4 — Daily routines. Luyện thì hiện tại đơn, 12 từ vựng mới."
            />
          </Field>
        </CardBody>
      </Card>

      {/* Ba trường bắt buộc theo quy định vận hành */}
      <Card className="ring-1 ring-gold-300">
        <CardHeader
          title="Ba trường bắt buộc"
          description="Thiếu bất kỳ trường nào sau 10 giờ sẽ sinh cảnh báo chất lượng"
        />
        <CardBody className="space-y-4">
          <div className="space-y-3 rounded-lg bg-gold-50 p-3">
            <p className="mnee-label">1 · Bài tập về nhà</p>
            <Field label="Tên bài tập" required>
              <Input
                name="homework_title"
                defaultValue={defaults.homework_title}
                disabled={!canEdit}
                maxLength={200}
                placeholder="Ví dụ: Workbook trang 32-33"
              />
            </Field>
            <Field label="Yêu cầu chi tiết">
              <Textarea
                name="homework_description"
                defaultValue={defaults.homework_description}
                rows={2}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Hạn hoàn thành">
              <Input
                type="date"
                name="homework_due_date"
                defaultValue={defaults.homework_due_date}
                disabled={!canEdit}
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg bg-gold-50 p-3">
            <p className="mnee-label">2 · Link recording</p>
            <Field label="Đường dẫn video buổi học" required hint="Google Drive, YouTube hoặc Zoom">
              <Input
                type="url"
                name="recording_url"
                defaultValue={defaults.recording_url}
                disabled={!canEdit}
                placeholder="https://drive.google.com/..."
                inputMode="url"
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg bg-gold-50 p-3">
            <p className="mnee-label">3 · Nhận xét của giáo viên</p>
            <Field label="Nhận xét chung về buổi học" required>
              <Textarea
                name="teacher_comments"
                defaultValue={defaults.teacher_comments}
                rows={4}
                disabled={!canEdit}
                placeholder="Học viên làm được gì, còn khó ở đâu, cần luyện thêm điều gì."
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {students.length > 0 ? (
        <Card>
          <CardHeader
            title="Đánh giá từng học viên"
            description="Không bắt buộc, nhưng rất hữu ích cho báo cáo phụ huynh"
          />
          <CardBody className="space-y-5">
            {students.map((s) => {
              const f = feedback[s.id]
              return (
                <div key={s.id} className="space-y-3 border-t border-navy-100 pt-4 first:border-0 first:pt-0">
                  <p className="text-[0.8125rem] font-medium text-navy-900">{s.full_name}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Thái độ">
                      <Select
                        name={`attitude_${s.id}`}
                        defaultValue={f?.attitude ?? ''}
                        disabled={!canEdit}
                      >
                        <option value="">—</option>
                        {Object.entries(ATTITUDE).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Kết quả">
                      <Select
                        name={`performance_${s.id}`}
                        defaultValue={f?.performance ?? ''}
                        disabled={!canEdit}
                      >
                        <option value="">—</option>
                        {Object.entries(ATTITUDE).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Bài tập kỳ trước">
                      <Select
                        name={`homework_completion_${s.id}`}
                        defaultValue={f?.homework_completion ?? ''}
                        disabled={!canEdit}
                      >
                        <option value="">—</option>
                        {Object.entries(HOMEWORK_COMPLETION).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Nhận xét riêng">
                    <Textarea
                      name={`comments_${s.id}`}
                      defaultValue={f?.comments ?? ''}
                      rows={2}
                      disabled={!canEdit}
                    />
                  </Field>
                </div>
              )
            })}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Định hướng buổi sau" />
        <CardBody>
          <Field label="Đề xuất cho buổi tiếp theo">
            <Textarea
              name="next_lesson_recommendation"
              defaultValue={defaults.next_lesson_recommendation}
              rows={2}
              disabled={!canEdit}
            />
          </Field>
        </CardBody>
      </Card>

      {canEdit ? (
        <>
          <label className="mnee-card flex items-start gap-3 px-4 py-3.5">
            <input
              type="checkbox"
              name="mark_completed"
              defaultChecked={defaults.lessonCompleted}
              className="mt-0.5 size-4 rounded border-navy-300 text-navy-800 focus:ring-gold-500"
            />
            <span className="text-[0.8125rem] text-navy-700">
              <span className="font-medium text-navy-900">Xác nhận buổi học đã dạy xong.</span>{' '}
              Đánh dấu ô này bắt đầu tính hạn nộp báo cáo 10 giờ và cho phép sinh buổi tính lương.
            </span>
          </label>

          {/* Thanh lưu dính đáy màn hình — ngón tay luôn chạm tới được trên điện thoại */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <p className="text-xs text-navy-400">Lưu được nhiều lần — không mất dữ liệu đã nhập.</p>
              <SubmitButton size="lg" pendingLabel="Đang lưu báo cáo…">
                Lưu báo cáo
              </SubmitButton>
            </div>
          </div>
        </>
      ) : null}
    </form>
  )
}
