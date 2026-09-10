'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { FeedbackDraft } from '@/lib/ai/feedback'
import { draftFeedbackWithAI } from '../actions'

/**
 * Nhờ AI soạn nháp nhận xét (D6).
 *
 * Không dùng thẻ <form> riêng vì cả màn hình đã nằm trong một form; lồng form
 * là HTML không hợp lệ. Gọi thẳng server action trong `useTransition`, rồi điền
 * kết quả vào đúng các ô đang mở để giáo viên sửa tiếp — không tải lại trang
 * nên không mất phần đang gõ dở.
 */
export function AIDraftPanel({
  lessonId,
  enabled,
  videoSource,
  onDraft,
}: {
  lessonId: string
  enabled: boolean
  videoSource: 'youtube' | 'google_drive' | 'other' | null
  onDraft: (draft: FeedbackDraft) => void
}) {
  const [pending, startTransition] = useTransition()
  const [transcript, setTranscript] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Gemini xem được video YouTube, nhưng không mở được file Google Drive riêng
  // tư. Nói thẳng điều đó thay vì để giáo viên bấm rồi thắc mắc vì sao trống.
  const canWatchVideo = videoSource === 'youtube'
  const hasSource = canWatchVideo || transcript.trim() !== ''

  if (!enabled) {
    return (
      <Card>
        <CardHeader
          title="Nhờ AI viết nháp"
          description="Chưa bật — cần khoá API miễn phí của Google AI Studio"
        />
        <CardBody>
          <p className="text-[0.8125rem] text-navy-500">
            Founder tạo khoá miễn phí tại{' '}
            <span className="font-medium text-navy-800">aistudio.google.com</span> rồi đặt vào biến
            môi trường <code className="rounded bg-navy-50 px-1">GOOGLE_AI_API_KEY</code>. Xem hướng
            dẫn từng bước trong <code className="rounded bg-navy-50 px-1">docs/AI_SETUP.md</code>.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="ring-1 ring-navy-200">
      <CardHeader
        title="Nhờ AI viết nháp"
        description="AI viết phần điểm mạnh và cần cải thiện. Bạn đọc lại, sửa, rồi mới gửi phụ huynh."
      />
      <CardBody className="space-y-3">
        {message ? (
          <Alert kind={message.ok ? 'success' : 'danger'}>{message.text}</Alert>
        ) : null}

        {!hasSource ? (
          <Alert kind="warning">
            {videoSource === 'google_drive'
              ? 'Link recording đang là Google Drive — file riêng tư nên AI không xem được. '
              : videoSource === null
                ? 'Chưa có link video. '
                : 'AI không mở được link video này. '}
            AI vẫn viết được nhận xét từ nội dung buổi học, nhưng{' '}
            <strong>sẽ không điền trích lời học viên và timestamp</strong> — vì bịa ra là hỏng lòng
            tin với phụ huynh. Dán bản ghi lời thoại bên dưới để có đủ hai tiêu chí đó.
          </Alert>
        ) : null}

        {showTranscript ? (
          <Field
            label="Bản ghi lời thoại"
            hint="Dán transcript của buổi học. Đây là nguồn duy nhất AI được phép trích."
          >
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              placeholder={'T: What do you do in the morning?\nS: I wake up at six o’clock...'}
            />
          </Field>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setMessage(null)
                const result = await draftFeedbackWithAI(lessonId, transcript)
                if (result.ok) {
                  onDraft(result.draft)
                  setMessage({ ok: true, text: result.message })
                } else {
                  setMessage({ ok: false, text: result.error })
                }
              })
            }
          >
            <Sparkles className={pending ? 'size-4 animate-pulse' : 'size-4'} />
            {pending ? 'AI đang viết…' : 'AI viết nháp'}
          </Button>

          {showTranscript ? null : (
            <button
              type="button"
              onClick={() => setShowTranscript(true)}
              className="text-xs font-medium text-navy-500 hover:text-navy-800"
            >
              + Dán bản ghi lời thoại
            </button>
          )}
        </div>

        <p className="text-xs text-navy-400">
          Gửi cho phụ huynh vẫn là bước riêng do bạn bấm — hệ thống không tự gửi. Hai tiêu chí “đủ
          sâu” do Founder chấm, AI không tự bật được.
        </p>
      </CardBody>
    </Card>
  )
}
