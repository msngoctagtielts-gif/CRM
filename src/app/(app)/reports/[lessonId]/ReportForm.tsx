'use client'

import { useActionState, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { ATTENDANCE_STATUS, ATTITUDE, HOMEWORK_COMPLETION, qcTone } from '@/lib/labels'
import { classifyVideoSource, type FeedbackDraft } from '@/lib/ai/feedback'
import { saveTeachingReport } from '../actions'
import { AIDraftPanel } from './AIDraftPanel'

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
  homework_sentence_patterns: string
  recording_url: string
  video_timestamp: string
  student_quote: string
  strengths: string
  improvements: string
  qc_strengths_deep: boolean | null
  qc_improvements_deep: boolean | null
  lessonCompleted: boolean
}

/**
 * Biểu mẫu báo cáo giảng dạy — thiết kế mobile-first.
 *
 * Giáo viên thường nhập trên điện thoại ngay sau buổi dạy, nên:
 *   · một cột duy nhất, không có bảng cần cuộn ngang
 *   · vùng bấm cao tối thiểu 44px
 *   · dùng form action của server nên vẫn gửi được khi mạng yếu
 *
 * Cấu trúc form bám đúng hai tầng điều kiện của nghiệp vụ (DECISIONS.md):
 *   · Giờ dạy — điều kiện CỨNG, thiếu là buổi không được tính lương (D5)
 *   · Sáu tiêu chí chất lượng — thiếu vẫn tính lương, chỉ gắn cờ (D3, D4)
 * Điểm QC hiện ngay khi gõ để giáo viên biết mình đang đạt hay chưa, thay vì
 * phải lưu rồi mới thấy.
 */
export function ReportForm({
  lessonId,
  canEdit,
  isFounder,
  aiEnabled,
  qcMinScore,
  deadlineHours,
  students,
  defaults,
  attendance,
  feedback,
}: {
  lessonId: string
  canEdit: boolean
  isFounder: boolean
  aiEnabled: boolean
  qcMinScore: number
  deadlineHours: number
  students: Student[]
  defaults: Defaults
  attendance: Record<string, string>
  feedback: Record<
    string,
    { attitude: string; performance: string; comments: string; homework_completion: string }
  >
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(saveTeachingReport, null)

  // Bốn tiêu chí máy tự kiểm được — theo dõi tại chỗ để chấm điểm ngay khi gõ.
  const [recordingUrl, setRecordingUrl] = useState(defaults.recording_url)
  const [videoTimestamp, setVideoTimestamp] = useState(defaults.video_timestamp)
  const [studentQuote, setStudentQuote] = useState(defaults.student_quote)
  const [sentencePatterns, setSentencePatterns] = useState(defaults.homework_sentence_patterns)

  // Bốn ô dưới đây cũng do AI điền được, nên phải là ô có trạng thái — nếu để
  // defaultValue thì kết quả AI trả về sẽ không hiện ra.
  const [strengths, setStrengths] = useState(defaults.strengths)
  const [improvements, setImprovements] = useState(defaults.improvements)
  const [lessonContent, setLessonContent] = useState(defaults.lesson_content)
  const [nextRecommendation, setNextRecommendation] = useState(defaults.next_lesson_recommendation)

  /** Điền kết quả AI vào form. Chỉ ghi đè ô đang trống để không mất chữ giáo viên đã gõ. */
  function applyDraft(draft: FeedbackDraft) {
    const fill = (value: string, current: string, set: (v: string) => void) => {
      if (value.trim() !== '' && current.trim() === '') set(value)
    }
    fill(draft.strengths, strengths, setStrengths)
    fill(draft.improvements, improvements, setImprovements)
    fill(draft.student_quote, studentQuote, setStudentQuote)
    fill(draft.video_timestamp, videoTimestamp, setVideoTimestamp)
    fill(draft.homework_sentence_patterns, sentencePatterns, setSentencePatterns)
    fill(draft.lesson_content, lessonContent, setLessonContent)
    fill(draft.next_lesson_recommendation, nextRecommendation, setNextRecommendation)
  }

  // Hai tiêu chí "đủ sâu" do Founder hoặc AI chấm, giáo viên không tự bật được.
  const [strengthsDeep, setStrengthsDeep] = useState(defaults.qc_strengths_deep === true)
  const [improvementsDeep, setImprovementsDeep] = useState(defaults.qc_improvements_deep === true)

  const criteria = [
    { key: 'video', label: 'Link video', passed: recordingUrl.trim() !== '' },
    { key: 'timestamp', label: 'Timestamp đối chiếu', passed: videoTimestamp.trim() !== '' },
    { key: 'student_quote', label: 'Trích nguyên văn lời học viên', passed: studentQuote.trim() !== '' },
    { key: 'strengths_deep', label: 'Điểm mạnh đủ sâu', passed: strengthsDeep },
    { key: 'improvements_deep', label: 'Phần cần cải thiện đủ sâu', passed: improvementsDeep },
    { key: 'homework_pattern', label: 'Homework có mẫu câu', passed: sentencePatterns.trim() !== '' },
  ]
  const passedCount = criteria.filter((c) => c.passed).length
  const score = Math.round((passedCount * 100) / criteria.length)

  return (
    <form action={action} className="space-y-5 pb-28">
      <input type="hidden" name="lesson_id" value={lessonId} />
      <FormMessage state={state} />

      {/* ---- Điều kiện CỨNG để được tính lương (D5) ---------------------- */}
      <Card className="ring-1 ring-burgundy-300">
        <CardHeader
          title="Giờ dạy — bắt buộc để được tính lương"
          description="Thiếu ngày giờ là buổi này không vào bảng lương. Đây là điều kiện cứng, không phải khuyến nghị."
        />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Giờ bắt đầu" required>
            <Input
              type="datetime-local"
              name="start_time"
              defaultValue={defaults.start_time}
              disabled={!canEdit}
            />
          </Field>
          <Field
            label="Giờ kết thúc"
            required
            hint={`Hạn nộp báo cáo tính từ mốc này + ${deadlineHours} giờ`}
          >
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

      {/* ---- Bảng điểm chất lượng, cập nhật ngay khi gõ ------------------- */}
      <Card className="ring-1 ring-gold-300">
        <CardHeader
          title="Sáu tiêu chí chất lượng"
          description={`Đạt từ ${qcMinScore} điểm trở lên thì báo cáo được tính là hoàn tất. Thiếu vẫn được trả lương, nhưng sẽ hiện cảnh báo cho Founder.`}
          action={
            <Badge tone={qcTone(score)}>
              {score}/100 · {passedCount}/{criteria.length} tiêu chí
            </Badge>
          }
        />
        <CardBody className="space-y-1.5">
          {criteria.map((c) => (
            <div
              key={c.key}
              className="flex items-center gap-2 text-[0.8125rem]"
              aria-label={`${c.label}: ${c.passed ? 'đã có' : 'còn thiếu'}`}
            >
              <span
                aria-hidden
                className={
                  c.passed
                    ? 'inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700'
                    : 'inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-400'
                }
              >
                {c.passed ? '✓' : '—'}
              </span>
              <span className={c.passed ? 'text-navy-700' : 'text-navy-400'}>{c.label}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-navy-400">
            Hai tiêu chí “đủ sâu” do Founder hoặc AI chấm sau khi đọc nội dung, giáo viên không tự
            bật được.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Nội dung đã dạy" />
        <CardBody className="space-y-4">
          <Field label="Nội dung buổi học" hint="Unit, chủ điểm, kỹ năng đã luyện">
            <Textarea
              name="lesson_content"
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              rows={3}
              disabled={!canEdit}
              placeholder="Ví dụ: Unit 4 — Daily routines. Luyện thì hiện tại đơn, 12 từ vựng mới."
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---- Bằng chứng: video + timestamp + trích lời học viên ----------- */}
      <Card>
        <CardHeader
          title="Bằng chứng buổi học"
          description="Ba tiêu chí đầu của bảng chấm. Nếu chỉ có link video, AI sẽ viết giúp phần nhận xét."
        />
        <CardBody className="space-y-4">
          <Field
            label="Link video buổi học"
            hint="Google Drive, YouTube hoặc Zoom"
            error={undefined}
          >
            <Input
              type="url"
              name="recording_url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://drive.google.com/..."
              inputMode="url"
            />
          </Field>

          <Field
            label="Timestamp đối chiếu"
            hint="Mốc thời gian trong video minh hoạ cho nhận xét, ví dụ 12:40"
          >
            <Input
              name="video_timestamp"
              value={videoTimestamp}
              onChange={(e) => setVideoTimestamp(e.target.value)}
              disabled={!canEdit}
              maxLength={100}
              placeholder="12:40"
            />
          </Field>

          <Field
            label="Trích nguyên văn lời học viên"
            hint="Chép đúng một câu học viên đã nói — đây là thứ phụ huynh tin nhất"
          >
            <Textarea
              name="student_quote"
              value={studentQuote}
              onChange={(e) => setStudentQuote(e.target.value)}
              rows={2}
              disabled={!canEdit}
              placeholder='Ví dụ: "I go to school by my mother car."'
            />
          </Field>
        </CardBody>
      </Card>

      {canEdit ? (
        <AIDraftPanel
          lessonId={lessonId}
          enabled={aiEnabled}
          videoSource={classifyVideoSource(recordingUrl)}
          onDraft={applyDraft}
        />
      ) : null}

      {/* ---- Nhận xét có cấu trúc ---------------------------------------- */}
      <Card>
        <CardHeader
          title="Nhận xét"
          description="Viết tách hai phần để Founder và phụ huynh đọc được ngay, thay vì một đoạn gộp."
        />
        <CardBody className="space-y-4">
          <Field
            label="Điểm mạnh"
            hint="Cụ thể việc học viên làm được, kèm ví dụ trong buổi"
          >
            <Textarea
              name="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
              disabled={!canEdit}
              placeholder="Ví dụ: Phát âm /θ/ đã đúng ở 8/10 lần, tự sửa lại khi nghe mẫu."
            />
          </Field>

          <Field
            label="Phần cần cải thiện"
            hint="Nói rõ luyện thế nào, không dừng ở “cần cố gắng hơn”"
          >
            <Textarea
              name="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
              disabled={!canEdit}
              placeholder="Ví dụ: Còn quên -s ở ngôi thứ ba. Buổi sau luyện 10 câu mô tả thói quen."
            />
          </Field>

          <Field label="Ghi chú chung" hint="Không bắt buộc — dành cho điều không thuộc hai mục trên">
            <Textarea
              name="teacher_comments"
              defaultValue={defaults.teacher_comments}
              rows={2}
              disabled={!canEdit}
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---- Bài tập về nhà, gồm mẫu câu bắt buộc ------------------------ */}
      <Card>
        <CardHeader
          title="Bài tập về nhà"
          description="Mẫu câu là tiêu chí thứ sáu — bài tập không có mẫu câu bị coi là chưa đạt."
        />
        <CardBody className="space-y-4">
          <Field label="Tên bài tập">
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
          <Field
            label="Mẫu câu bắt buộc dùng"
            hint="Học viên phải dùng đúng những mẫu câu này khi làm bài"
          >
            <Textarea
              name="homework_sentence_patterns"
              value={sentencePatterns}
              onChange={(e) => setSentencePatterns(e.target.value)}
              rows={2}
              disabled={!canEdit}
              placeholder={'Ví dụ: I usually … / She doesn’t … / How often do you …?'}
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
              value={nextRecommendation}
              onChange={(e) => setNextRecommendation(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---- Chỉ Founder mới chấm được hai tiêu chí "đủ sâu" -------------- */}
      {isFounder ? (
        <Card className="ring-1 ring-navy-200">
          <CardHeader
            title="Founder chấm chất lượng"
            description="Đọc phần nhận xét rồi xác nhận đã đủ sâu chưa. Hai ô này quyết định 2 trong 6 tiêu chí."
          />
          <CardBody className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="qc_strengths_deep"
                checked={strengthsDeep}
                onChange={(e) => setStrengthsDeep(e.target.checked)}
                className="mt-0.5 size-4 rounded border-navy-300 text-navy-800 focus:ring-gold-500"
              />
              <span className="text-[0.8125rem] text-navy-700">
                Phần <span className="font-medium text-navy-900">điểm mạnh</span> đã đủ sâu và có ví
                dụ cụ thể.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="qc_improvements_deep"
                checked={improvementsDeep}
                onChange={(e) => setImprovementsDeep(e.target.checked)}
                className="mt-0.5 size-4 rounded border-navy-300 text-navy-800 focus:ring-gold-500"
              />
              <span className="text-[0.8125rem] text-navy-700">
                Phần <span className="font-medium text-navy-900">cần cải thiện</span> đã chỉ rõ cách
                luyện, không chung chung.
              </span>
            </label>
            <Field label="Ghi chú chấm chất lượng">
              <Textarea name="qc_notes" rows={2} placeholder="Vì sao chưa đạt, cần sửa gì." />
            </Field>
            <input type="hidden" name="qc_reviewed" value="1" />
          </CardBody>
        </Card>
      ) : null}

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
              Đánh dấu ô này bắt đầu tính hạn nộp báo cáo {deadlineHours} giờ và cho phép sinh buổi
              tính lương.
            </span>
          </label>

          {/* Thanh lưu dính đáy màn hình — ngón tay luôn chạm tới được trên điện thoại */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <p className="text-xs text-navy-400">
                Chất lượng {score}/100 · lưu được nhiều lần, không mất dữ liệu đã nhập.
              </p>
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
