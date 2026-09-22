import 'server-only'
import {
  buildXacMinhPrompt,
  locKetQuaVoLy,
  parseXacMinhJSON,
  type KetQuaXacMinh,
  type XacMinhInput,
} from './xac-minh'
import {
  buildFeedbackPrompt,
  enforceNoFabrication,
  extractModelText,
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

/**
 * Đã kiểm bằng lần gọi thật ngày 10/09/2026. KHÔNG dùng `gemini-2.0-flash` —
 * Google đã khai tử, gọi vào trả 404. Cũng không dùng bí danh
 * `gemini-flash-latest`: nó trả 503 "high demand" trong lúc kiểm, và bí danh có
 * thể đổi model bên dưới mà ta không biết. Founder muốn đổi thì đặt
 * GOOGLE_AI_MODEL.
 */
const DEFAULT_MODEL = 'gemini-3.6-flash'

/**
 * Gemini 3.x "suy nghĩ" trước khi trả lời, và **thinking token tính vào
 * maxOutputTokens**. Đo thật: 620 token prompt sinh ra ~1.550 thinking token chỉ
 * để viết ~330 token nội dung. Đặt 2048 là sát mép — có lần JSON bị cắt giữa
 * dòng, `finishReason = MAX_TOKENS`, giáo viên mất cả bản nháp. 8192 để dư chỗ.
 */
const MAX_OUTPUT_TOKENS = 8192
const TIMEOUT_MS = 60_000
const RETRY_DELAY_MS = 2_000

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

  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  })

  // Thử lại MỘT lần khi model quá tải (429/503). Đã gặp 503 "high demand" thật
  // trong lúc kiểm; bắt giáo viên tự bấm lại là bắt họ gõ lại từ đầu.
  let last: Attempt = {
    result: { ok: false, error: 'Không gọi được dịch vụ AI.' },
    retryable: false,
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS)
    last = await callOnce(model, key, requestBody, input)
    if (last.result.ok || !last.retryable) break
  }
  return last.result
}

/** `retryable` = lỗi tạm thời (quá tải, bị cắt, hỏng định dạng), đáng thử lại một lần. */
type Attempt = { result: AIResult; retryable: boolean }

async function callOnce(
  model: string,
  key: string,
  requestBody: string,
  input: FeedbackInput,
): Promise<Attempt> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: requestBody,
    })

    if (!response.ok) {
      return {
        result: { ok: false, error: describeHttpError(response.status, await safeText(response)) },
        retryable: response.status === 429 || response.status >= 500,
      }
    }

    const body = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] }
        finishReason?: string
      }[]
      promptFeedback?: { blockReason?: string }
    }

    if (body.promptFeedback?.blockReason) {
      return {
        result: { ok: false, error: 'Dịch vụ AI từ chối nội dung này. Hãy tự viết nhận xét.' },
        retryable: false,
      }
    }

    const candidate = body.candidates?.[0]

    const text = extractModelText(candidate?.content?.parts)

    // Cắt giữa dòng thì nói rõ là bị cắt, đừng báo "định dạng không đọc được" —
    // hai nguyên nhân khác nhau cần hai cách xử lý khác nhau.
    if (candidate?.finishReason === 'MAX_TOKENS') {
      return {
        result: {
          ok: false,
          error:
            'AI viết dài quá mức cho phép nên câu trả lời bị cắt. Thử lại, hoặc rút ngắn bản ghi lời thoại.',
        },
        retryable: true,
      }
    }

    if (text === '') {
      return {
        result: { ok: false, error: 'AI không trả về nội dung nào. Thử lại sau.' },
        retryable: true,
      }
    }

    const parsed = parseFeedbackJSON(text)
    if (!parsed) {
      return {
        result: { ok: false, error: 'AI trả về định dạng không đọc được. Thử lại sau.' },
        retryable: true,
      }
    }

    const { draft, dropped } = enforceNoFabrication(parsed, input)
    return { result: { ok: true, draft, dropped, model }, retryable: false }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        result: { ok: false, error: 'AI phản hồi quá lâu. Thử lại, hoặc tự viết nhận xét.' },
        retryable: false,
      }
    }
    return {
      result: { ok: false, error: 'Không gọi được dịch vụ AI. Kiểm tra kết nối mạng của máy chủ.' },
      retryable: true,
    }
  } finally {
    clearTimeout(timer)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  if (status === 503) return 'Model đang quá tải. Thử lại sau một lát.'
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

/* ===========================================================================
 * XÁC MINH BUỔI HỌC TỪ VIDEO
 *
 * Dùng LẠI đúng khoá và đúng model của phần soạn nhận xét ở trên. Trước đây
 * việc này nằm ở một script chạy tay riêng (scripts/phan-tich-video) với biến
 * môi trường khác và model khác — Founder phải cấu hình hai nơi và phải mở máy
 * chạy lệnh. Gộp về một đường ngày 22/09/2026.
 *
 * Điểm mấu chốt khiến cách này chạy được: Gemini TỰ TẢI video từ phía Google.
 * Máy chủ của trung tâm không cần mở được youtube.com.
 * ======================================================================== */

export type XacMinhResult =
  | { ok: true; ketQua: KetQuaXacMinh; daBo: string[]; model: string }
  | { ok: false; error: string }

export async function xacMinhBuoiHocTuVideo(input: XacMinhInput): Promise<XacMinhResult> {
  const key = (process.env.GOOGLE_AI_API_KEY ?? '').trim()
  if (key === '') {
    return {
      ok: false,
      error:
        'Chưa cấu hình khoá AI. Đặt GOOGLE_AI_API_KEY trong biến môi trường (lấy miễn phí ở Google AI Studio).',
    }
  }
  if (input.videoUrls.length === 0) {
    return { ok: false, error: 'Buổi này chưa có link video YouTube nào để xem.' }
  }

  const model = aiModelName()
  const parts: unknown[] = [{ text: buildXacMinhPrompt(input) }]
  for (const url of input.videoUrls) parts.push({ fileData: { fileUri: url } })

  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      // Đo thì không được sáng tạo. Nhiệt độ 0 để hai lần chạy trên cùng một
      // video ra cùng con số — nếu không, Founder không biết tin lần nào.
      temperature: 0,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  })

  let last: XacMinhResult = { ok: false, error: 'Không gọi được dịch vụ AI.' }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS)
    const goi = await goiGemini(model, key, requestBody)
    if (!goi.ok) {
      last = { ok: false, error: goi.error }
      if (!goi.retryable) break
      continue
    }
    const doc = parseXacMinhJSON(goi.text)
    if (!doc) {
      last = { ok: false, error: 'AI trả về định dạng không đọc được. Thử lại sau.' }
      continue
    }
    const { ketQua, daBo } = locKetQuaVoLy(doc)
    return { ok: true, ketQua, daBo, model }
  }
  return last
}

/**
 * Phần chung của mọi lần gọi Gemini: timeout, đọc lỗi, phát hiện bị cắt.
 *
 * Tách ra ngày 22/09/2026 khi thêm chức năng xác minh — trước đó logic này nằm
 * lẫn trong `callOnce` cùng với việc đọc JSON nhận xét, nên không dùng lại được
 * mà không chép.
 */
type GoiKetQua = { ok: true; text: string } | { ok: false; error: string; retryable: boolean }

async function goiGemini(model: string, key: string, requestBody: string): Promise<GoiKetQua> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: requestBody,
    })

    if (!response.ok) {
      return {
        ok: false,
        error: describeHttpError(response.status, await safeText(response)),
        retryable: response.status === 429 || response.status >= 500,
      }
    }

    const body = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] }
        finishReason?: string
      }[]
      promptFeedback?: { blockReason?: string }
    }

    if (body.promptFeedback?.blockReason) {
      return { ok: false, error: 'Dịch vụ AI từ chối nội dung này.', retryable: false }
    }

    const candidate = body.candidates?.[0]
    if (candidate?.finishReason === 'MAX_TOKENS') {
      return {
        ok: false,
        error: 'AI trả lời dài quá mức cho phép nên bị cắt giữa chừng. Thử lại.',
        retryable: true,
      }
    }

    const text = extractModelText(candidate?.content?.parts)
    if (text === '') {
      return { ok: false, error: 'AI không trả về nội dung nào. Thử lại sau.', retryable: true }
    }
    return { ok: true, text }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: 'AI phản hồi quá lâu. Video dài thì thử lại, hoặc chia nhỏ bản ghi.',
        retryable: false,
      }
    }
    return {
      ok: false,
      error: 'Không gọi được dịch vụ AI. Kiểm tra kết nối mạng của máy chủ.',
      retryable: true,
    }
  } finally {
    clearTimeout(timer)
  }
}
