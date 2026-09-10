/**
 * Soạn nhận xét buổi học bằng AI (DECISIONS.md D6).
 *
 * File này CỐ Ý không import gì — không alias `@/`, không thư viện ngoài — để
 * chạy được thẳng bằng `node --test`. Mọi thứ chạm mạng nằm ở `provider.ts`.
 *
 * Nguyên tắc quan trọng nhất ở đây: **AI không được bịa lời học viên**. Trích
 * nguyên văn là một trong 6 tiêu chí chấm chất lượng, nên có áp lực điền cho
 * đủ. Một câu tiếng Anh bịa ra rồi gửi cho phụ huynh là hỏng lòng tin, không
 * phải lỗi nhỏ. Vì vậy prompt bắt AI để trống khi không có nguồn nghe được, và
 * `parseFeedbackJSON` cũng chỉ nhận đúng những gì AI trả về.
 */

export type VideoSource = 'youtube' | 'google_drive' | 'other' | null

/**
 * Gemini đọc trực tiếp được video YouTube qua `fileData`, nhưng KHÔNG mở được
 * link Google Drive (file riêng tư, cần đăng nhập). Trung tâm đang lưu recording
 * trên Drive, nên phần lớn trường hợp sẽ rơi vào nhánh "không xem được video" —
 * khi đó giáo viên dán bản ghi lời thoại, hoặc AI chỉ soạn từ dữ liệu buổi học.
 */
export function classifyVideoSource(url: string | null | undefined): VideoSource {
  const value = (url ?? '').trim()
  if (value === '') return null
  if (!/^https?:\/\//i.test(value)) return null
  if (/(^|\.)(youtube\.com|youtu\.be)(\/|$|:)/i.test(hostOf(value))) return 'youtube'
  if (/(^|\.)(drive|docs)\.google\.com$/i.test(hostOf(value))) return 'google_drive'
  return 'other'
}

function hostOf(url: string): string {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url)
  return match ? match[1].replace(/:\d+$/, '').toLowerCase() : ''
}

export type FeedbackInput = {
  /** Tên gọi thân mật hoặc tên ngắn. KHÔNG truyền họ tên đầy đủ ra dịch vụ ngoài. */
  studentLabel: string
  studentAge: number | null
  className: string
  lessonDate: string
  durationMinutes: number | null
  lessonContent: string
  teacherNotes: string
  /** Bản ghi lời thoại do giáo viên dán vào, nếu có. */
  transcript: string
  videoUrl: string
  videoSource: VideoSource
}

export type FeedbackDraft = {
  student_quote: string
  video_timestamp: string
  strengths: string
  improvements: string
  homework_sentence_patterns: string
  lesson_content: string
  next_lesson_recommendation: string
  /** AI tự khai đã dựa vào đâu — để giáo viên biết có cần kiểm lại không. */
  source_note: string
}

export const EMPTY_DRAFT: FeedbackDraft = {
  student_quote: '',
  video_timestamp: '',
  strengths: '',
  improvements: '',
  homework_sentence_patterns: '',
  lesson_content: '',
  next_lesson_recommendation: '',
  source_note: '',
}

/** AI có nguồn nghe/đọc được lời học viên hay không. Quyết định việc có được phép trích. */
export function hasQuotableSource(input: FeedbackInput): boolean {
  return input.transcript.trim() !== '' || input.videoSource === 'youtube'
}

/**
 * Prompt viết bằng tiếng Việt vì toàn bộ nội dung gửi phụ huynh là tiếng Việt,
 * chỉ trích dẫn và mẫu câu giữ nguyên tiếng Anh.
 */
export function buildFeedbackPrompt(input: FeedbackInput): string {
  const quotable = hasQuotableSource(input)

  const facts = [
    `- Học viên: ${input.studentLabel}`,
    input.studentAge !== null ? `- Tuổi: ${input.studentAge}` : null,
    `- Lớp: ${input.className}`,
    `- Ngày học: ${input.lessonDate}`,
    input.durationMinutes ? `- Thời lượng: ${input.durationMinutes} phút` : null,
    input.lessonContent.trim() !== '' ? `- Nội dung đã dạy: ${input.lessonContent.trim()}` : null,
    input.teacherNotes.trim() !== '' ? `- Ghi chú của giáo viên: ${input.teacherNotes.trim()}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  const sourceBlock = quotable
    ? input.transcript.trim() !== ''
      ? `Bản ghi lời thoại buổi học (nguồn DUY NHẤT được phép trích):\n"""\n${input.transcript.trim()}\n"""`
      : 'Video buổi học được đính kèm ngay sau phần hướng dẫn này. Hãy nghe và trích đúng lời học viên đã nói.'
    : [
        'KHÔNG có bản ghi lời thoại và KHÔNG xem được video (link Google Drive là file riêng tư).',
        'Vì vậy bạn KHÔNG biết học viên đã nói câu gì.',
      ].join(' ')

  return [
    'Bạn soạn nhận xét buổi học tiếng Anh cho trung tâm Ms.Ngọc Elite English.',
    'Triết lý của trung tâm: "Thấu hiểu để dẫn lối" — nhận xét phải cụ thể, tử tế và chỉ ra được đường đi tiếp theo.',
    '',
    'THÔNG TIN BUỔI HỌC',
    facts,
    '',
    'NGUỒN',
    sourceBlock,
    '',
    'QUY TẮC BẮT BUỘC',
    '1. TUYỆT ĐỐI KHÔNG bịa lời học viên. Trường "student_quote" chỉ được điền khi bạn thật sự nghe/đọc được câu đó trong nguồn ở trên. Không có nguồn thì để chuỗi rỗng.',
    '2. Tương tự với "video_timestamp": chỉ điền mốc thời gian bạn thật sự xác định được trong video. Không chắc thì để rỗng.',
    '3. Không suy đoán điểm số, trình độ hay chẩn đoán gì về học viên mà dữ liệu không nói tới.',
    '4. "strengths" và "improvements" viết bằng TIẾNG VIỆT, mỗi phần 2–4 câu, phải nêu việc cụ thể chứ không nói chung chung như "em cần cố gắng hơn".',
    '5. "improvements" phải kèm cách luyện cụ thể cho buổi sau.',
    '6. "homework_sentence_patterns": 2–4 mẫu câu TIẾNG ANH mà học viên phải dùng khi làm bài, bám đúng nội dung đã dạy. Ngăn cách bằng dấu "/".',
    '7. "source_note": một câu tiếng Việt nói rõ bạn đã dựa vào đâu, và nói thẳng nếu chưa có nguồn để trích lời học viên.',
    '8. Đây là BẢN NHÁP cho giáo viên đọc lại, không phải bản gửi thẳng cho phụ huynh.',
    '',
    'Trả về DUY NHẤT một đối tượng JSON với đúng các khoá sau, không thêm chữ nào ngoài JSON:',
    '{"student_quote":"","video_timestamp":"","strengths":"","improvements":"","homework_sentence_patterns":"","lesson_content":"","next_lesson_recommendation":"","source_note":""}',
  ].join('\n')
}

/**
 * Gộp phần chữ từ câu trả lời của model.
 *
 * Gemini 3.x trả về cả phần "suy nghĩ" của nó trong `parts`, đánh dấu
 * `thought: true`. Ghép nhầm phần đó vào sẽ làm JSON hỏng, nên phải lọc ra —
 * đây là hàm thuần để kiểm thử được, vì lỗi ghép chuỗi kiểu này chỉ lộ ra khi
 * gọi API thật.
 */
export function extractModelText(
  parts: { text?: string; thought?: boolean }[] | undefined,
): string {
  return (parts ?? [])
    .filter((p) => p.thought !== true)
    .map((p) => p.text ?? '')
    .join('')
    .trim()
}

/**
 * Đọc JSON từ câu trả lời của model.
 *
 * Có bật `responseMimeType: application/json` nhưng vẫn phải phòng trường hợp
 * model bọc trong ```json hoặc kèm lời dẫn — một lần hỏng định dạng mà ném lỗi
 * thì giáo viên mất cả bản nháp.
 */
export function parseFeedbackJSON(raw: string): FeedbackDraft | null {
  const text = stripCodeFence(raw)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null

  const record = parsed as Record<string, unknown>
  const draft: FeedbackDraft = { ...EMPTY_DRAFT }
  for (const key of Object.keys(EMPTY_DRAFT) as (keyof FeedbackDraft)[]) {
    const value = record[key]
    draft[key] = typeof value === 'string' ? value.trim() : ''
  }
  return draft
}

function stripCodeFence(raw: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  return (fenced ? fenced[1] : raw).trim()
}

/**
 * Chốt chặn cuối: bỏ trích dẫn và timestamp khi không có nguồn nghe được.
 *
 * Prompt đã dặn, nhưng dặn không phải là bảo đảm. Một câu tiếng Anh bịa ra ở
 * đây sẽ được chấm là ĐẠT tiêu chí "trích nguyên văn" và đi thẳng tới phụ
 * huynh, nên phải chặn bằng mã chứ không bằng lời dặn.
 */
export function enforceNoFabrication(
  draft: FeedbackDraft,
  input: FeedbackInput,
): { draft: FeedbackDraft; dropped: string[] } {
  if (hasQuotableSource(input)) return { draft, dropped: [] }

  const dropped: string[] = []
  const safe = { ...draft }
  if (safe.student_quote !== '') {
    dropped.push('trích nguyên văn lời học viên')
    safe.student_quote = ''
  }
  if (safe.video_timestamp !== '') {
    dropped.push('timestamp đối chiếu')
    safe.video_timestamp = ''
  }
  return { draft: safe, dropped }
}

/**
 * Tên gọi gửi ra dịch vụ ngoài.
 *
 * Chỉ gửi biệt danh, hoặc tên gọi (từ cuối trong họ tên tiếng Việt). Họ tên đầy
 * đủ, số điện thoại và thông tin phụ huynh không rời khỏi hệ thống.
 */
export function studentLabelFor(fullName: string, nickname: string | null): string {
  const nick = (nickname ?? '').trim()
  if (nick !== '') return nick
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : 'học viên'
}
