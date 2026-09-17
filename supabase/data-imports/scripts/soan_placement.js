/**
 * Bộ kiểm tra đầu vào (Placement Test) V1.0 — Ms.Ngọc Elite English.
 *
 * Chạy: node soan_placement.js <thư-mục-xuất>
 *
 * BA RÀNG BUỘC THIẾT KẾ, đều lấy từ tài liệu Founder đã ban hành:
 *
 *  1. 15–20 phút, nằm TRONG buổi trải nghiệm 60 phút miễn phí.
 *     (Lộ trình học tập V1.0, Phần 7, Bước 2.)
 *  2. Trẻ em: chủ yếu Nghe – Nói. Người lớn: đủ 4 kỹ năng.
 *     (cùng nguồn.)
 *  3. Chấm kỹ năng nói theo ĐÚNG 6 tiêu chí và thang 1–5 mà trung tâm đã dùng
 *     cho báo cáo từng buổi: Fluency, Vocabulary, Grammar in Use,
 *     Pronunciation, Interaction, Confidence.
 *     (Hồ sơ học tập trên Cổng phụ huynh, mục 2.)
 *     Nhờ vậy điểm đầu vào so sánh thẳng được với mọi báo cáo về sau — nếu đặt
 *     một thang riêng thì buổi đầu và buổi thứ mười không đối chiếu được.
 *
 * MỘT ĐIỀU CHỈNH BẮT BUỘC so với cách chấm hằng buổi:
 *     Quy tắc nhà ghi "chấm theo chuẩn của trình độ hiện tại". Khi kiểm tra đầu
 *     vào thì học viên CHƯA CÓ trình độ hiện tại. Nên trong bộ đề này, sáu tiêu
 *     chí được chấm theo chuẩn của BẬC ĐANG THỬ, và phiếu ghi rõ bậc đó.
 *
 * NGỮ LIỆU: mọi câu hỏi, đoạn nghe và đoạn đọc trong bộ đề này do MNEE tự soạn.
 * KHÔNG trích từ Kid's Box hay Speak Now — vừa tránh vấn đề bản quyền, vừa
 * tránh việc học viên đã học qua chính đoạn đó thì kết quả không còn phản ánh
 * đúng năng lực.
 */

const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx')

const RA = process.argv[2] || '.'
const NGAY = '17/09/2026'
const NAVY = '1B2A4A'
const GOLD = 'A8863B'
const DO = '7B2D3B'

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 300 }, alignment: o.align,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.italics,
    size: o.size ?? 22, color: o.color, font: 'Calibri' })] })

const muc = (t) => new Paragraph({ spacing: { before: 320, after: 150 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: NAVY, font: 'Calibri' })] })

const muc2 = (t) => new Paragraph({ spacing: { before: 220, after: 100 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: NAVY, font: 'Calibri' })] })

const gach = (t, dam) => new Paragraph({ spacing: { after: 100, line: 300 },
  bullet: { level: 0 },
  children: [new TextRun({ text: t, size: 22, bold: dam, font: 'Calibri' })] })

const nguon = (t) => new Paragraph({ spacing: { before: 60, after: 180 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 } },
  children: [new TextRun({ text: t, italics: true, size: 18, color: '666666', font: 'Calibri' })] })

const canhBao = (t) => new Paragraph({ spacing: { before: 100, after: 160 },
  border: { left: { style: BorderStyle.SINGLE, size: 16, color: DO, space: 12 } },
  children: [new TextRun({ text: t, size: 20, color: DO, bold: true, font: 'Calibri' })] })

const oGhi = (nhan, so = 48) => new Paragraph({ spacing: { after: 110 },
  children: [new TextRun({ text: `${nhan}: `, size: 22, font: 'Calibri' }),
             new TextRun({ text: '.'.repeat(so), size: 22, color: '999999', font: 'Calibri' })] })

function bang(td, dong, rong, dam0 = false) {
  const o = (t, dam, nen, i) => new TableCell({
    width: { size: rong[i], type: WidthType.DXA },
    shading: nen ? { type: ShadingType.CLEAR, fill: nen } : undefined,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    children: [new Paragraph({ children: [new TextRun({ text: t,
      bold: dam || (dam0 && i === 0), size: 19,
      color: nen ? 'FFFFFF' : undefined, font: 'Calibri' })] })] })
  return new Table({ width: { size: rong.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: rong,
    rows: [new TableRow({ tableHeader: true, children: td.map((t, i) => o(t, true, NAVY, i)) }),
      ...dong.map((d) => new TableRow({ children: d.map((t, i) => o(t, false, null, i)) }))] })
}

const bia = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1700, after: 80 },
    children: [new TextRun({ text: 'MS.NGỌC ELITE ENGLISH', bold: true, size: 32, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: 'TÀI LIỆU NỘI BỘ', size: 20, color: GOLD, characterSpacing: 60, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: 'BỘ KIỂM TRA ĐẦU VÀO', bold: true, size: 38, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 },
    children: [new TextRun({ text: 'Placement Test · đề, thang chấm và phiếu ghi kết quả', italics: true, size: 22, color: '555555', font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: 'Bản dành cho Giáo viên — không gửi học viên', bold: true, size: 22, color: DO, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'Phiên bản: V1.0', size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: `Ngày ban hành: ${NGAY}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: '“Thấu hiểu để dẫn lối.”', italics: true, size: 22, color: GOLD, font: 'Calibri' })] }),
  new Paragraph({ pageBreakBefore: true, spacing: { after: 0 }, children: [new TextRun({ text: '', size: 2 })] }),
]

const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
  children: [
  ...bia,

  p('BỘ KIỂM TRA ĐẦU VÀO', { bold: true, size: 30, color: NAVY, align: AlignmentType.CENTER, after: 60 }),
  p('Bản dành cho Giáo viên', { italics: true, size: 20, color: '555555', align: AlignmentType.CENTER, after: 240 }),

  muc('1. Bộ đề này dùng khi nào'),
  gach('Trong 15–20 phút ĐẦU của buổi trải nghiệm 60 phút miễn phí. Thời gian còn lại vẫn là một buổi học thật — học viên phải được trải nghiệm cách dạy, không phải ngồi thi suốt buổi.', true),
  gach('Trẻ em 6–10 tuổi: dùng Bộ A, chủ yếu Nghe và Nói.'),
  gach('Học viên từ khoảng 9 tuổi trở lên, người lớn, người đi làm: dùng Bộ B, đủ bốn kỹ năng.'),
  gach('Học viên 9–10 tuổi nằm giữa hai bộ: bắt đầu bằng Bộ B. Nếu sau hai nhiệm vụ đầu thấy quá sức, chuyển sang Bộ A và ghi lý do vào phiếu.'),
  nguon('Quy trình 5 bước: xem Lộ trình học tập — bản Giáo viên V1.1, mục 5.'),

  muc('2. Nguyên tắc chấm: bậc thang, không phải bài thi'),
  p('Bộ đề đi theo bậc thang từ dễ lên khó. Giáo viên bắt đầu ở bậc thấp, đi lên cho tới khi học viên không theo được nữa.', { after: 140 }),
  gach('QUY TẮC DỪNG: hai nhiệm vụ liên tiếp học viên không hoàn thành được thì dừng. Bậc cuối cùng học viên làm được là trần năng lực hiện tại.', true),
  gach('Không ép học viên làm hết mọi nhiệm vụ. Đẩy quá trần chỉ làm học viên mất tự tin ngay buổi đầu — đúng thứ trung tâm đang muốn xây.'),
  gach('Nếu học viên vượt nhiệm vụ cuối của một bộ một cách dễ dàng, ghi rõ vào phiếu để Trung tâm cân nhắc xếp cao hơn.'),
  canhBao('Kết quả 15–20 phút là mức xếp lớp TẠM THỜI. Giáo viên xác nhận hoặc điều chỉnh trong 2–3 buổi đầu, và đánh giá lại giữa kỳ, cuối kỳ. Không nói với phụ huynh rằng buổi kiểm tra đã xác định chính xác trình độ CEFR của học viên.'),

  // ------------------------------------------------------------- BỘ A
  new Paragraph({ pageBreakBefore: true, spacing: { after: 140 },
    children: [new TextRun({ text: 'BỘ A — TRẺ EM 6–10 TUỔI', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),
  p('15 phút · trọng tâm Nghe và Nói. Giữ không khí như một buổi chơi, không như một buổi thi.', { italics: true, color: '555555', after: 180 }),

  bang(['#', 'Bậc', 'Nhiệm vụ', 'Giáo viên nói / làm gì', 'Đạt khi'],
    [['A1', 'Pre-A1', 'Chào hỏi', '“Hello! What’s your name? How old are you?”', 'Nói được tên, tuổi, dù chỉ một từ.'],
     ['A2', 'Pre-A1', 'Nhận diện từ vựng', 'Đưa/nói 8 vật quen thuộc: màu sắc, số đếm, con vật, đồ dùng học tập. Hỏi “What’s this?”', 'Gọi đúng tên ít nhất 5 trên 8.'],
     ['A3', 'Pre-A1 → A1', 'Nghe và làm theo', 'Ba chỉ dẫn: “Point to something red.” / “Show me four fingers.” / “Stand up and clap.”', 'Làm đúng ít nhất 2 trên 3, không cần dịch.'],
     ['A4', 'A1', 'Mô tả tranh', 'Đưa một tranh sinh hoạt quen thuộc. “Tell me about this picture.”', 'Nói được 3 câu trở lên, dù còn sai ngữ pháp.'],
     ['A5', 'A1', 'Hỏi đáp đời sống', '“What do you do after school?” · “Do you like cats? Why?”', 'Trả lời đúng ý và thêm được một chi tiết.'],
     ['A6', 'A1 → A2', 'Kể chuyện ngắn', '“What did you do yesterday?”', 'Kể được 2–3 câu có mốc thời gian quá khứ.']],
    [600, 1000, 1500, 3400, 2500]),
  p('', { after: 140 }),
  muc2('Lưu ý khi làm Bộ A'),
  gach('Trẻ im lặng KHÔNG đồng nghĩa với không biết. Đợi đủ 5 giây trước khi gợi ý — nhiều trẻ cần thời gian xử lý.', true),
  gach('Cho phép trả lời bằng tiếng Việt ở nhiệm vụ A4–A6 rồi ghi nhận riêng: hiểu được câu hỏi là một dữ kiện có giá trị, khác hẳn với không hiểu gì.'),
  gach('Không sửa lỗi trong lúc kiểm tra. Ghi lại lỗi để dùng ở buổi dạy, đừng ngắt mạch nói của trẻ.'),

  // ------------------------------------------------------------- BỘ B
  new Paragraph({ pageBreakBefore: true, spacing: { after: 140 },
    children: [new TextRun({ text: 'BỘ B — TỪ KHOẢNG 9 TUỔI, NGƯỜI LỚN, NGƯỜI ĐI LÀM', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),
  p('20 phút · bốn kỹ năng. Phân bổ: Nói 10 phút · Nghe 4 phút · Đọc 3 phút · Viết 3 phút.', { italics: true, color: '555555', after: 180 }),

  muc2('B1. Kỹ năng nói — bậc thang A1 đến B2 (10 phút)'),
  bang(['#', 'Bậc', 'Câu hỏi của giáo viên', 'Đạt khi'],
    [['S1', 'A1', '“Tell me about yourself. Where are you from? What do you do?”', 'Nói được 3–4 câu về bản thân, dùng câu đơn.'],
     ['S2', 'A2', '“What did you do last weekend?” · “What’s your daily routine?”', 'Kể được chuỗi việc, dùng được thì quá khứ dù chưa chuẩn.'],
     ['S3', 'B1', '“Which do you prefer — working from home or at an office? Why?”', 'Nêu được lựa chọn kèm ít nhất hai lý do, nói liền mạch.'],
     ['S4', 'B1+', '“What are the good and bad points of learning English online?”', 'So sánh được hai mặt, dùng từ nối, giữ được hội thoại.'],
     ['S5', 'B2', '“Some people say children should start English before age six. Do you agree?”', 'Bảo vệ được quan điểm, phản hồi lại khi giáo viên phản biện.']],
    [600, 900, 4200, 3300]),
  p('', { after: 140 }),
  canhBao('Ở S3 đến S5, giáo viên phải PHẢN BIỆN LẠI một lần để xem học viên có giữ được hội thoại hay không. Đây là điểm khác nhau lớn nhất giữa B1 và B2, và cũng là thứ lớp giao tiếp của trung tâm tập trung rèn.'),

  muc2('B2. Kỹ năng nghe (4 phút)'),
  p('Giáo viên đọc đoạn sau HAI LẦN với tốc độ nói tự nhiên, không đọc chậm bất thường. Không cho học viên nhìn chữ.', { after: 130 }),
  p('“Lan works at a small bookshop near the train station. She starts at nine in the morning and finishes at five. On Saturdays the shop is very busy, so she usually asks her brother to help her. Last month she started a free reading club for children every Sunday afternoon. About fifteen children come each week.”',
    { italics: true, size: 21, after: 140 }),
  bang(['#', 'Bậc', 'Câu hỏi', 'Đáp án'],
    [['L1', 'A1', 'Where does Lan work?', 'a bookshop / near the train station'],
     ['L2', 'A2', 'What time does she finish work?', 'five (o’clock)'],
     ['L3', 'A2', 'Who helps her on Saturdays?', 'her brother'],
     ['L4', 'B1', 'What did she start last month, and how often does it happen?', 'a free reading club for children — every Sunday afternoon'],
     ['L5', 'B1', 'Why does she need help on Saturdays?', 'because the shop is very busy']],
    [600, 800, 4300, 3300]),
  p('', { after: 140 }),

  muc2('B3. Kỹ năng đọc (3 phút)'),
  p('Đưa học viên đọc thầm đoạn dưới, sau đó hỏi ba câu. Không giới hạn số lần đọc lại trong 3 phút.', { after: 130 }),
  p('“Minh has lived in the same neighbourhood for twenty years. He knows almost everyone on his street. Recently a new coffee shop opened on the corner, and it has become a popular meeting place. Minh was worried at first that it would be noisy, but now he goes there every morning to read the newspaper. He says the neighbourhood feels more alive than before.”',
    { italics: true, size: 21, after: 140 }),
  bang(['#', 'Bậc', 'Câu hỏi', 'Đáp án'],
    [['R1', 'A2', 'How long has Minh lived there?', 'twenty years'],
     ['R2', 'B1', 'How did Minh feel about the coffee shop at first, and how does he feel now?', 'worried it would be noisy → now goes every morning, likes it'],
     ['R3', 'B1+', 'What does Minh mean by “the neighbourhood feels more alive”?', 'Chấp nhận mọi diễn giải hợp lý: đông người hơn, có chỗ gặp gỡ, không khí vui hơn.']],
    [600, 800, 4300, 3300]),
  p('', { after: 140 }),

  muc2('B4. Kỹ năng viết (3 phút)'),
  p('Đề: “Write 40–60 words about a place you often go to, and why you like it.”', { bold: true, after: 130 }),
  gach('Không chấm chính tả khắt khe. Điều cần nhìn: có viết được câu hoàn chỉnh không, có nối được ý không, có dùng đúng thì không.'),
  gach('Học viên viết dưới 20 từ hoặc không viết được: ghi 1 điểm và ghi rõ vào phiếu, KHÔNG để trống ô điểm.'),

  // --------------------------------------------------------- THANG CHẤM
  new Paragraph({ pageBreakBefore: true, spacing: { after: 140 },
    children: [new TextRun({ text: 'THANG CHẤM', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),

  muc2('Kỹ năng nói — sáu tiêu chí, thang 1–5'),
  p('Đây là ĐÚNG sáu tiêu chí trung tâm dùng để chấm mỗi buổi học. Dùng chung một thang thì điểm buổi đầu và điểm buổi thứ mười mới so sánh được với nhau.', { after: 140 }),
  bang(['Tiêu chí', 'Nhìn vào điều gì'],
    [['Fluency', 'Nói liền mạch, ít ngập ngừng.'],
     ['Vocabulary', 'Dùng đúng và đủ từ vựng của chủ đề.'],
     ['Grammar in Use', 'Dùng đúng cấu trúc KHI NÓI, không phải khi làm bài tập.'],
     ['Pronunciation', 'Phát âm, trọng âm, ngữ điệu.'],
     ['Interaction', 'Phản xạ hỏi – đáp, giữ được hội thoại.'],
     ['Confidence', 'Dám nói, chủ động, không ngại sai.']],
    [2400, 6600], true),
  p('', { after: 140 }),
  bang(['Điểm', 'Nghĩa'],
    [['5', 'Vượt chuẩn của bậc đang thử'], ['4', 'Đạt tốt'], ['3', 'Đạt'],
     ['2', 'Cần luyện thêm'], ['1', 'Cần hỗ trợ riêng']],
    [1200, 7800], true),
  p('', { after: 140 }),
  canhBao('KHÁC với cách chấm hằng buổi. Quy tắc nhà ghi “chấm theo chuẩn của trình độ hiện tại”, nhưng khi kiểm tra đầu vào học viên CHƯA CÓ trình độ hiện tại. Vì vậy ở đây sáu tiêu chí được chấm theo chuẩn của BẬC ĐANG THỬ, và phiếu bắt buộc ghi rõ bậc đó. Không ghi bậc thì điểm 4 không có nghĩa gì.'),

  muc2('Nghe, Đọc, Viết — thang 1–5'),
  bang(['Điểm', 'Nghe và Đọc', 'Viết'],
    [['5', 'Đúng toàn bộ, kể cả câu bậc cao nhất', 'Viết đủ độ dài, mạch lạc, ít lỗi'],
     ['4', 'Đúng tất cả trừ câu bậc cao nhất', 'Viết đủ độ dài, ý rõ, còn lỗi nhỏ'],
     ['3', 'Đúng các câu bậc A1–A2', 'Viết được câu hoàn chỉnh, ý rời rạc'],
     ['2', 'Chỉ đúng câu dễ nhất', 'Viết được vài cụm từ, chưa thành câu'],
     ['1', 'Không trả lời được câu nào', 'Không viết được hoặc dưới 20 từ']],
    [900, 4200, 3900], true),
  p('', { after: 140 }),
  p('Điểm tổng = trung bình cộng các kỹ năng đã chấm, làm tròn một chữ số thập phân. Bộ A chỉ có Nghe và Nói, không tính Đọc và Viết — để trống hai ô đó, KHÔNG ghi 0.', { bold: true, after: 160 }),

  // --------------------------------------------------- QUYẾT ĐỊNH XẾP LỚP
  new Paragraph({ pageBreakBefore: true, spacing: { after: 140 },
    children: [new TextRun({ text: 'QUYẾT ĐỊNH XẾP LỚP', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),
  p('Đọc bảng theo thứ tự từ trên xuống, dừng ở dòng đầu tiên khớp với học viên.', { after: 150 }),
  bang(['Tuổi', 'Kết quả kiểm tra', 'Xếp vào'],
    [['6–7', 'Chưa đạt Pre-A1, gần như chưa biết gì', "Kid's Box Starter"],
     ['7–8', 'Đạt Pre-A1 (làm được A1–A3 của Bộ A)', "Kid's Box Level 1–2"],
     ['8–10', 'Đạt A1 mới chớm (làm được A4–A5)', "Kid's Box Level 3–4"],
     ['≥ 9–10', "Đạt A1 vững, ĐÃ hoàn tất Kid's Box Level 4", 'Speak Now 1'],
     ['≥ 9', 'Học viên MỚI, chưa từng học, gần như mất gốc', "Speak Now 1 — KHÔNG xếp vào Kid's Box Starter"],
     ['9–10', "Đang học dở Kid's Box Level 2–3", "Học hết Level 4 rồi mới chuyển, trừ khi bài kiểm tra cho thấy đã sẵn sàng vượt cấp"],
     ['11–12', 'Mới bắt đầu, gần như mất gốc', "Nội dung tăng tốc tương đương Kid's Box 3–4, KHÔNG dùng trực tiếp sách, sau đó vào Speak Now 1"],
     ['bất kỳ', 'Đạt A2 (làm được S2 tốt, S3 chưa vững)', 'Speak Now 2'],
     ['bất kỳ', 'Đạt B1 (làm được S3)', 'Speak Now 3'],
     ['bất kỳ', 'Đạt B1+ trở lên (làm được S4–S5)', 'Speak Now 4'],
     ['bất kỳ', 'Đạt B1 trở lên VÀ chủ động hỏi về IELTS', 'Tư vấn riêng — IELTS là chương trình giai đoạn sau']],
    [1100, 4200, 3700]),
  p('', { after: 140 }),
  nguon('Bảng này áp dụng đúng quy tắc chuyển tiếp trong Lộ trình học tập — bản Giáo viên V1.1, mục 3. Mọi trường hợp: quyết định cuối dựa trên kết quả kiểm tra và xác nhận của Trung tâm, không áp dụng máy móc theo tuổi.'),

  // ----------------------------------------------------------- PHIẾU GHI
  new Paragraph({ pageBreakBefore: true, spacing: { after: 140 },
    children: [new TextRun({ text: 'PHIẾU GHI KẾT QUẢ', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),
  p('Các ô dưới đây khớp đúng với ô nhập trong hệ thống quản lý MNEE. Nhập xong là xong, không phải chép lại lần hai.', { italics: true, color: '555555', after: 180 }),

  oGhi('Họ và tên học viên'),
  oGhi('Ngày sinh / Tuổi'),
  oGhi('Ngày kiểm tra'),
  oGhi('Giáo viên thực hiện'),
  oGhi('Bộ đề sử dụng (A — trẻ em / B — teen & người lớn)'),
  oGhi('Bậc cao nhất học viên làm được'),

  muc2('Điểm sáu tiêu chí nói (1–5)'),
  bang(['Tiêu chí', 'Điểm', 'Dẫn chứng — ghi lại CÂU HỌC VIÊN ĐÃ NÓI'],
    [['Fluency', '', ''], ['Vocabulary', '', ''], ['Grammar in Use', '', ''],
     ['Pronunciation', '', ''], ['Interaction', '', ''], ['Confidence', '', '']],
    [2000, 900, 6100], true),
  p('', { after: 120 }),
  canhBao('Cột dẫn chứng KHÔNG được để trống. Một con số không có câu nói kèm theo thì không kiểm chứng được, và ba tháng sau không ai nhớ vì sao chấm như vậy.'),

  muc2('Điểm các kỹ năng (nhập vào hệ thống)'),
  bang(['Ô trong hệ thống', 'Điểm (1–5)'],
    [['Nghe — listening_score', ''], ['Nói — speaking_score', ''],
     ['Đọc — reading_score (Bộ A: để trống)', ''], ['Viết — writing_score (Bộ A: để trống)', ''],
     ['Tổng — overall_score', '']],
    [6400, 2600], true),
  p('', { after: 140 }),

  oGhi('Bậc tham chiếu đề xuất (Pre-A1 / A1 / A2 / B1 / B2)'),
  oGhi('Lớp đề xuất xếp vào'),
  p('Đề xuất gửi Trung tâm (recommendation) — viết 2–3 câu: học viên mạnh ở đâu, cần ưu tiên gì, có lưu ý gì về tâm lý hoặc động lực:', { after: 100 }),
  ...[1, 2, 3].map(() => new Paragraph({ spacing: { after: 130 },
    children: [new TextRun({ text: '.'.repeat(96), size: 22, color: '999999', font: 'Calibri' })] })),
  p('Ghi chú khác (notes):', { after: 100 }),
  ...[1, 2].map(() => new Paragraph({ spacing: { after: 130 },
    children: [new TextRun({ text: '.'.repeat(96), size: 22, color: '999999', font: 'Calibri' })] })),

  // ----------------------------------------------------- KHÔNG ĐƯỢC LÀM
  muc('Năm điều không được làm'),
  gach('Không nói với phụ huynh rằng buổi kiểm tra đã xác định chính xác trình độ CEFR. Đây là mức xếp lớp tạm thời, xác nhận lại trong 2–3 buổi đầu.', true),
  gach('Không để trống cột dẫn chứng khi đã chấm điểm.', true),
  gach('Không ghi 0 vào ô kỹ năng không kiểm tra. Để trống — 0 nghĩa là làm mà không được, trống nghĩa là không kiểm tra.', true),
  gach('Không sửa lỗi học viên trong lúc kiểm tra. Ghi lại để dùng ở buổi dạy.', true),
  gach('Không dùng ngữ liệu trong Kid’s Box hay Speak Now làm đề kiểm tra. Học viên đã học qua đoạn đó thì kết quả không còn phản ánh đúng năng lực.', true),

  muc('Về ngữ liệu trong bộ đề này'),
  p('Toàn bộ câu hỏi, đoạn nghe và đoạn đọc trong tài liệu này do Ms.Ngọc Elite English tự soạn, không trích từ Kid’s Box (Cambridge) hay Speak Now (Oxford). Bậc tham chiếu gắn cho từng nhiệm vụ dựa trên mô tả năng lực của Khung tham chiếu CEFR (Council of Europe), dùng để xếp lớp nội bộ — không phải kết quả của một kỳ thi chuẩn hoá.',
    { size: 20, color: '666666', italics: true, after: 160 }),
]}]})

;(async () => {
  const buf = await Packer.toBuffer(doc)
  const ten = 'EDU_BoKiemTraDauVao_PlacementTest_V1.0_2026-09-17.docx'
  fs.writeFileSync(path.join(RA, ten), buf)
  console.log(`${ten}  —  ${(buf.length / 1024).toFixed(1)} KB`)
})()
