import 'server-only'
import {
  buildFeedbackPrompt,
  enforceNoFabrication,
  parseFeedbackJSON,
  type FeedbackDraft,
  type FeedbackInput,
} from './feedback'

/**
 * Gọi Google Gemini để soạn nháp nhận xét (D6).
 *
 * Chọn Gemini vì Google AI Studio cấp khoá API **miễn phí** không cần thẻ, và
 * gói miễn phí đủ xa so với khối lượng của trung tâm (vài chục buổi/tuần).
 *
 * `import 'server-only'` bảo đảm file này không bao giờ lọt vào bundle trình
 * duyệt — khoá API chỉ tồn tại ở phía máy chủ, đúng yêu cầu mục XVIII.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.0-flash'
const TIMEOUT_MS = 45_000

export type AIResult =
  | { ok: true; draft: FeedbackDraft; dropped: string[]; model: string }
  | { ok: false; error: string }

/** Đã cấu hình khoá chưa — giao diện dùng để ẩn nút thay vì báo lỗi khi bấm. */
export function isAIConfigured(): boolean {
  return (process.env.GOOGLE_AI_API_KEY ?? '').trim() !== ''
}

export function aiModelName(): string {
  return (process.env.GOOGLE_AI_MODEL ?? '').trim() || DEFAULT_MODEL
}

export async function draftLessonFeedback(input: FeedbackInput): Promise<AIResult> {
  const key = (process.env.GOOGLE_AI_API_KEY ?? '').trim()
  if (key === '') {
    return {
      ok: false,
      error:
        'Chưa cấu hình khoá AI. Đặt GOOGLE_AI_API_KEY trong biến môi trường (lấy miễn phí ở Google AI Studio).',
    }
  }

  const model = aiModelName()
  const parts: unknown[] = [{ text: buildFeedbackPrompt(input) }]

  // Gemini đọc được video YouTube qua fileUri; Google Drive thì không (file
  // riêng tư cần đăng nhập) nên chỉ gửi phần chữ.
  if (input.videoSource === 'youtube') {
    parts.push({ fileData: { fileUri: input.videoUrl } })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!response.ok) {
      return { ok: false, error: describeHttpError(response.status, await safeText(response)) }
    }

    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
      promptFeedback?: { blockReason?: string }
    }

    if (body.promptFeedback?.blockReason) {
      return { ok: false, error: 'Dịch vụ AI từ chối nội dung này. Hãy tự viết nhận xét.' }
    }

    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim()

    if (text === '') return { ok: false, error: 'AI không trả về nội dung nào. Thử lại sau.' }

    const parsed = parseFeedbackJSON(text)
    if (!parsed) {
      return { ok: false, error: 'AI trả về định dạng không đọc được. Thử lại sau.' }
    }

    const { draft, dropped } = enforceNoFabrication(parsed, input)
    return { ok: true, draft, dropped, model }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'AI phản hồi quá lâu. Thử lại, hoặc tự viết nhận xét.' }
    }
    return { ok: false, error: 'Không gọi được dịch vụ AI. Kiểm tra kết nối mạng của máy chủ.' }
  } finally {
    clearTimeout(timer)
  }
}

/** Thông báo bằng tiếng Việt, và KHÔNG lặp lại nội dung lỗi gốc vì có thể chứa khoá. */
function describeHttpError(status: number, body: string): string {
  if (status === 400 && /API key not valid/i.test(body)) {
    return 'Khoá AI không hợp lệ. Tạo lại khoá ở Google AI Studio rồi cập nhật GOOGLE_AI_API_KEY.'
  }
  if (status === 401 || status === 403) {
    return 'Khoá AI bị từ chối. Kiểm tra lại GOOGLE_AI_API_KEY.'
  }
  if (status === 404) {
    return `Không tìm thấy model "${aiModelName()}". Kiểm tra lại GOOGLE_AI_MODEL.`
  }
  if (status === 429) {
    return 'Đã hết lượt miễn phí trong phút này. Chờ một lát rồi thử lại.'
  }
  if (status >= 500) return 'Dịch vụ AI đang lỗi. Thử lại sau.'
  return `Dịch vụ AI trả về lỗi ${status}.`
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}
