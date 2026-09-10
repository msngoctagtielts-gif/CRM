/**
 * Kiểm thử phần logic thuần của việc soạn nhận xét bằng AI.
 *
 *     npm run test:unit
 *
 * Dùng test runner có sẵn của Node nên không thêm phụ thuộc nào. File
 * `feedback.ts` cố ý không import gì để chạy được trực tiếp ở đây.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY_DRAFT,
  buildFeedbackPrompt,
  classifyVideoSource,
  enforceNoFabrication,
  extractModelText,
  hasQuotableSource,
  parseFeedbackJSON,
  studentLabelFor,
  type FeedbackInput,
} from './feedback.ts'

const BASE: FeedbackInput = {
  studentLabel: 'Tân',
  studentAge: 9,
  className: 'Tân - 1:1 pre A1',
  lessonDate: '10/09/2026',
  durationMinutes: 60,
  lessonContent: 'Unit 4 — Daily routines',
  teacherNotes: '',
  transcript: '',
  videoUrl: '',
  videoSource: null,
}

test('phân loại nguồn video', () => {
  assert.equal(classifyVideoSource('https://www.youtube.com/watch?v=abc'), 'youtube')
  assert.equal(classifyVideoSource('https://youtu.be/abc'), 'youtube')
  assert.equal(classifyVideoSource('https://drive.google.com/file/d/abc/view'), 'google_drive')
  assert.equal(classifyVideoSource('https://docs.google.com/file/d/abc'), 'google_drive')
  assert.equal(classifyVideoSource('https://vimeo.com/123'), 'other')
  assert.equal(classifyVideoSource(''), null)
  assert.equal(classifyVideoSource(null), null)
  // Không để tên miền giả mạo lọt thành YouTube.
  assert.equal(classifyVideoSource('https://youtube.com.evil.test/x'), 'other')
  assert.equal(classifyVideoSource('https://notyoutube.com/x'), 'other')
  // Thiếu giao thức thì không coi là link.
  assert.equal(classifyVideoSource('youtube.com/watch?v=abc'), null)
})

test('chỉ có nguồn nghe được khi có transcript hoặc video YouTube', () => {
  assert.equal(hasQuotableSource(BASE), false)
  assert.equal(hasQuotableSource({ ...BASE, videoSource: 'google_drive' }), false)
  assert.equal(hasQuotableSource({ ...BASE, videoSource: 'youtube' }), true)
  assert.equal(hasQuotableSource({ ...BASE, transcript: 'T: How are you?' }), true)
  assert.equal(hasQuotableSource({ ...BASE, transcript: '   ' }), false)
})

test('prompt nói rõ không có nguồn khi recording nằm trên Google Drive', () => {
  const prompt = buildFeedbackPrompt({
    ...BASE,
    videoUrl: 'https://drive.google.com/file/d/abc/view',
    videoSource: 'google_drive',
  })
  assert.match(prompt, /KHÔNG biết học viên đã nói câu gì/)
  assert.match(prompt, /TUYỆT ĐỐI KHÔNG bịa lời học viên/)
  // Không rò họ tên đầy đủ: prompt chỉ nhận studentLabel đã rút gọn.
  assert.match(prompt, /Học viên: Tân/)
})

test('prompt chỉ cho phép trích từ transcript khi có transcript', () => {
  const prompt = buildFeedbackPrompt({ ...BASE, transcript: 'S: I wake up at six.' })
  assert.match(prompt, /nguồn DUY NHẤT được phép trích/)
  assert.match(prompt, /I wake up at six\./)
})

test('đọc được JSON dù model bọc trong code fence', () => {
  const draft = parseFeedbackJSON('```json\n{"strengths":"Phát âm rõ","improvements":"Luyện -s"}\n```')
  assert.ok(draft)
  assert.equal(draft.strengths, 'Phát âm rõ')
  assert.equal(draft.improvements, 'Luyện -s')
  // Khoá thiếu thì thành chuỗi rỗng, không phải undefined.
  assert.equal(draft.student_quote, '')
})

test('đọc được JSON dù có lời dẫn trước sau', () => {
  const draft = parseFeedbackJSON('Đây là bản nháp:\n{"strengths":"Tốt"}\nChúc bạn dạy vui.')
  assert.ok(draft)
  assert.equal(draft.strengths, 'Tốt')
})

test('JSON hỏng thì trả null, không ném lỗi', () => {
  assert.equal(parseFeedbackJSON('xin chào'), null)
  assert.equal(parseFeedbackJSON('{ khong phai json }'), null)
  assert.equal(parseFeedbackJSON(''), null)
})

test('bỏ qua khoá lạ và giá trị không phải chuỗi', () => {
  const draft = parseFeedbackJSON('{"strengths":"ok","qc_score":100,"hack":"x","student_quote":42}')
  assert.ok(draft)
  assert.equal(draft.strengths, 'ok')
  assert.equal(draft.student_quote, '')
  assert.deepEqual(Object.keys(draft).sort(), Object.keys(EMPTY_DRAFT).sort())
})

test('KHÔNG có nguồn ⇒ xoá trích dẫn và timestamp dù AI có bịa', () => {
  const fabricated = {
    ...EMPTY_DRAFT,
    student_quote: 'I go to school by my mother car.',
    video_timestamp: '12:40',
    strengths: 'Phát âm /s/ cuối từ đã rõ.',
  }
  const { draft, dropped } = enforceNoFabrication(fabricated, {
    ...BASE,
    videoSource: 'google_drive',
  })
  assert.equal(draft.student_quote, '', 'trích dẫn bịa phải bị xoá')
  assert.equal(draft.video_timestamp, '', 'timestamp bịa phải bị xoá')
  assert.equal(draft.strengths, 'Phát âm /s/ cuối từ đã rõ.', 'nhận xét thường vẫn giữ')
  assert.deepEqual(dropped, ['trích nguyên văn lời học viên', 'timestamp đối chiếu'])
})

test('CÓ transcript ⇒ giữ nguyên trích dẫn', () => {
  const good = { ...EMPTY_DRAFT, student_quote: 'I wake up at six.', video_timestamp: '03:10' }
  const { draft, dropped } = enforceNoFabrication(good, {
    ...BASE,
    transcript: 'S: I wake up at six.',
  })
  assert.equal(draft.student_quote, 'I wake up at six.')
  assert.equal(draft.video_timestamp, '03:10')
  assert.deepEqual(dropped, [])
})

test('chỉ gửi biệt danh hoặc tên gọi ra dịch vụ ngoài', () => {
  assert.equal(studentLabelFor('Nguyễn Văn Tân', 'Tân'), 'Tân')
  assert.equal(studentLabelFor('Nguyễn Văn Tân', null), 'Tân')
  assert.equal(studentLabelFor('Nguyễn Văn Tân', '  '), 'Tân')
  assert.equal(studentLabelFor('Bé Ngân', 'Ngân'), 'Ngân')
  assert.equal(studentLabelFor('   ', null), 'học viên')
})

test('bỏ phần "suy nghĩ" của model khi gộp câu trả lời', () => {
  // Gemini 3.x trả về cả phần suy nghĩ trong parts. Ghép nhầm vào là JSON hỏng.
  assert.equal(
    extractModelText([
      { text: 'Người dùng muốn JSON. Để tôi nghĩ…', thought: true },
      { text: '{"strengths":"ok"}' },
    ]),
    '{"strengths":"ok"}',
  )
  assert.equal(extractModelText([{ text: ' a ' }, { text: 'b' }]), 'a b')
  assert.equal(extractModelText([{ thought: true, text: 'chỉ có suy nghĩ' }]), '')
  assert.equal(extractModelText([]), '')
  assert.equal(extractModelText(undefined), '')
  assert.equal(extractModelText([{}]), '')
})

test('JSON bị cắt giữa dòng thì trả null thay vì nội dung nửa vời', () => {
  // Đây là lỗi thật gặp khi gọi API: thinking token ăn hết maxOutputTokens nên
  // câu trả lời đứt ngang, finishReason = MAX_TOKENS.
  const truncated = '{"student_quote":"She go to school at seven.","strengths":"Tân trả lời rõ ràn'
  assert.equal(parseFeedbackJSON(truncated), null)
})
