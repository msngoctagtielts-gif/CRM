/**
 * Lộ trình học tập V1.1 — TÁCH LÀM HAI BẢN.
 *
 * Chạy: node soan_lo_trinh.js <thư-mục-xuất>
 *
 * Nguồn: EDU_LoTrinhHocTap_CurriculumMap_V1.0_2026-09-16.pdf do Founder cung cấp.
 * Toàn bộ nội dung chuyên môn lấy từ bản đó. KHÔNG thêm mức CEFR mới, không
 * thêm số giờ học, không thêm chuẩn đầu ra nào không có trong bản gốc.
 *
 * VÌ SAO TÁCH HAI BẢN
 *   Founder nói tài liệu để "gửi phụ huynh và giáo viên có thể nắm được". Hai
 *   nhóm này cần hai thứ khác nhau. Phụ huynh hỏi "con tôi sẽ làm được gì và
 *   làm sao biết con tiến bộ". Giáo viên hỏi "dạy gì, khi nào cho lên cấp, xếp
 *   lớp thế nào". Một tài liệu gộp làm cả hai bên đều phải đọc phần không dành
 *   cho mình.
 *
 * BỐN CHỖ SỬA SO VỚI V1.0 (đều là giọng nội bộ lọt vào bản gửi ra ngoài)
 *   1. Phần 3 mở đầu bằng "Đề xuất của tôi (dựa trên kinh nghiệm vận hành...)"
 *      — người soạn nói với Founder, nằm trong bản phụ huynh đọc.
 *   2. Phần 4 ghi "MNEE khuyến nghị đối chiếu... trước khi in ấn tài liệu quảng
 *      bá chính thức" — câu dặn Founder, không phải thông tin cho người đọc.
 *   3. Phần 3 ghi "quyết định cuối do giáo viên và founder xác nhận" — chữ
 *      "founder" là ngôn ngữ nội bộ.
 *   4. Phần 7 Bước 4 ghi "vào DB01 (Students) và DB06 (Assessments) trong
 *      Master Database" — tên bảng dữ liệu, và đã lỗi thời vì học viên nay nằm
 *      trong hệ thống quản lý MNEE.
 *
 * MỘT CHỖ ĐỔI TRỌNG SỐ
 *   V1.0 dành hẳn Phần 5 và một dòng trong bảng chương trình cho IELTS, trong
 *   khi chính nó viết IELTS "chưa phải năng lực trọng tâm được quảng bá".
 *   Founder xác nhận chuyên về giao tiếp. Bản phụ huynh vì vậy đưa IELTS xuống
 *   một đoạn ngắn ở cuối; bản giáo viên giữ đủ điều kiện đầu vào để tư vấn.
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

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 300 }, alignment: o.align,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.italics,
    size: o.size ?? 22, color: o.color, font: 'Calibri' })] })

const muc = (t) => new Paragraph({ spacing: { before: 320, after: 150 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: NAVY, font: 'Calibri' })] })

const muc2 = (t) => new Paragraph({ spacing: { before: 200, after: 100 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: NAVY, font: 'Calibri' })] })

const gach = (t, dam) => new Paragraph({ spacing: { after: 100, line: 300 },
  bullet: { level: 0 },
  children: [new TextRun({ text: t, size: 22, bold: dam, font: 'Calibri' })] })

const nguon = (t) => new Paragraph({ spacing: { before: 60, after: 180 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 } },
  children: [new TextRun({ text: t, italics: true, size: 18, color: '666666', font: 'Calibri' })] })

function bang(td, dong, rong, canhPhai = false) {
  const o = (t, dam, nen, i) => new TableCell({
    width: { size: rong[i], type: WidthType.DXA },
    shading: nen ? { type: ShadingType.CLEAR, fill: nen } : undefined,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    children: [new Paragraph({
      alignment: canhPhai && i > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: t, bold: dam, size: 19,
        color: nen ? 'FFFFFF' : undefined, font: 'Calibri' })] })] })
  return new Table({ width: { size: rong.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: rong,
    rows: [new TableRow({ tableHeader: true, children: td.map((t, i) => o(t, true, NAVY, i)) }),
      ...dong.map((d) => new TableRow({ children: d.map((t, i) => o(t, false, null, i)) }))] })
}

const bia = (ten, phu, ai) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1700, after: 80 },
    children: [new TextRun({ text: 'MS.NGỌC ELITE ENGLISH', bold: true, size: 32, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: 'TÀI LIỆU CHÍNH THỨC', size: 20, color: GOLD, characterSpacing: 60, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: ten, bold: true, size: 38, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 },
    children: [new TextRun({ text: phu, italics: true, size: 22, color: '555555', font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: ai, bold: true, size: 22, color: GOLD, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'Phiên bản: V1.1', size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    children: [new TextRun({ text: `Ngày ban hành: ${NGAY}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: '“Thấu hiểu để dẫn lối.”', italics: true, size: 22, color: GOLD, font: 'Calibri' })] }),
  new Paragraph({ pageBreakBefore: true, spacing: { after: 0 }, children: [new TextRun({ text: '', size: 2 })] }),
]

const taiLieu = (ch) => new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: ch }] })

// Bảng CEFR dùng chung cho cả hai bản — nguồn Council of Europe / Europass.
const CEFR = [
  ['A1', 'Hiểu từ và cụm từ quen thuộc về bản thân, gia đình.', 'Giao tiếp đơn giản nếu người đối diện nói chậm và sẵn sàng nhắc lại.', 'Dùng câu đơn giản mô tả nơi ở, người quen.'],
  ['A2', 'Hiểu từ vựng tần suất cao liên quan trực tiếp tới bản thân.', 'Trao đổi thông tin đơn giản, quen thuộc trong sinh hoạt hằng ngày.', 'Dùng chuỗi câu đơn mô tả gia đình, điều kiện sống, công việc.'],
  ['B1', 'Hiểu ý chính của lời nói rõ ràng về chủ đề quen thuộc.', 'Xử lý được hầu hết tình huống giao tiếp khi đi du lịch hoặc sinh hoạt nơi nói tiếng Anh.', 'Kết nối câu để mô tả trải nghiệm, mong muốn, lý do.'],
  ['B2', 'Hiểu bài nói dài, theo dõi được lập luận khá phức tạp.', 'Tương tác trôi chảy, tự nhiên với người bản xứ ở mức khá thoải mái.', 'Trình bày rõ ràng, chi tiết về nhiều chủ đề quan tâm.'],
]

// ============================================ BẢN 1 — PHỤ HUYNH & HỌC VIÊN

const phuHuynh = taiLieu([
  ...bia('LỘ TRÌNH HỌC TẬP', 'Tiếng Anh giao tiếp cho trẻ em và người lớn',
         'Bản dành cho Phụ huynh và Học viên'),

  p('LỘ TRÌNH HỌC TẬP', { bold: true, size: 30, color: NAVY, align: AlignmentType.CENTER, after: 60 }),
  p('Bản dành cho Phụ huynh và Học viên', { italics: true, size: 20, color: '555555',
    align: AlignmentType.CENTER, after: 240 }),

  p('Ms.Ngọc Elite English chuyên về tiếng Anh giao tiếp. Mục tiêu của chúng tôi không phải là học hết một cuốn sách, mà là để học viên NÓI ĐƯỢC trong những tình huống thật. Tài liệu này cho Quý Phụ huynh và Học viên thấy rõ: đi qua từng chặng sẽ làm được gì, và làm sao biết mình đang tiến bộ.', { after: 220 }),

  muc('Hai chương trình chính'),
  bang(['Chương trình', 'Dành cho ai', 'Giáo trình nền', 'Đích đến'],
    [['Kids Communication', 'Trẻ từ 6 tuổi đến khoảng 9–10 tuổi', "Kid's Box (Cambridge), Starter → Level 4", 'Pre-A1 → A1'],
     ['Adult Communication', 'Học viên từ khoảng 9 tuổi, người lớn, người đi làm', 'Speak Now (Oxford) 1–4, kèm phim và video theo chủ đề', 'A1 → B2']],
    [2100, 2400, 2700, 1800]),
  p('', { after: 140 }),
  p('Trẻ học xong Kids Communication sẽ chuyển sang Adult Communication để tiếp tục đi lên — đây là một lộ trình liền mạch, không phải hai khoá tách rời.', { after: 160 }),

  muc('Chặng 1 — Kids Communication: xây nền phản xạ'),
  p('Giai đoạn này tập trung vào nghe và nói. Trẻ làm quen với âm, với nhịp câu, và quan trọng nhất là dám mở miệng.', { after: 150 }),
  bang(['Cấp độ', 'Tuổi khuyến nghị', 'Kết thúc cấp độ, con LÀM ĐƯỢC'],
    [['Starter', '6–7 tuổi', 'Nghe hiểu và nhắc lại được 100–150 từ chủ đề gần gũi (màu sắc, số đếm, đồ vật, con vật); chào hỏi, giới thiệu tên tuổi rất đơn giản với hỗ trợ của giáo viên.'],
     ['Level 1–2', '7–8 tuổi', 'Nghe hiểu chỉ dẫn ngắn trong lớp; nói câu đơn về bản thân, gia đình, sở thích; đọc hiểu từ và câu ngắn có tranh; viết chép và điền được từ đơn giản.'],
     ['Level 3–4', '8–10 tuổi', 'Nghe hiểu hội thoại ngắn quen thuộc; nói được đoạn 3–5 câu mô tả người, vật, hoạt động; đọc hiểu đoạn văn ngắn hợp lứa tuổi; viết đoạn 2–4 câu có hướng dẫn.']],
    [1500, 1700, 5800]),
  p('', { after: 140 }),
  p('Kid’s Box của Cambridge bám sát hệ thống kỳ thi Cambridge Young Learners English (Starters – Movers – Flyers), nên nếu về sau con thi lấy chứng chỉ thì nền đã sẵn.', { size: 20, color: '555555', after: 160 }),

  muc('Chặng 2 — Adult Communication: nói được việc thật'),
  p('Từ chặng này, mỗi cấp độ gắn với một nhóm tình huống giao tiếp thật. Sau mỗi bốn bài học, giáo trình có video thực tế để học viên quan sát ngữ điệu, ngôn ngữ cơ thể và cách người bản xứ thực sự nói.', { after: 150 }),
  bang(['Cấp độ', 'Nói được gì', 'Trình độ'],
    [['Speak Now 1', 'Giới thiệu bản thân, kể thói quen, nói về gia đình, mua sắm, hỏi đường.', 'A1 → A2'],
     ['Speak Now 2', 'Kể chuyện đã xảy ra, lên kế hoạch, nói sở thích và ý kiến đơn giản.', 'A2 → B1'],
     ['Speak Now 3', 'Thảo luận vấn đề quen thuộc, so sánh, đưa ra lý do — hội thoại tự nhiên hơn.', 'B1 → B1+'],
     ['Speak Now 4', 'Trình bày quan điểm, tranh luận, giao tiếp công việc cơ bản.', 'B1+ → B2']],
    [1700, 5300, 2000]),
  p('', { after: 140 }),
  nguon('Mức CEFR của từng cấp độ Speak Now là phân bổ của MNEE trong phổ chung A1–B2 mà Oxford University Press công bố cho trọn bộ bốn cấp; đây là mốc tham chiếu để tư vấn lộ trình, không phải mức do nhà xuất bản công bố cho từng cấp riêng lẻ.'),

  muc2('Phim và video được dùng như thế nào'),
  gach('Trích đoạn dài 2–5 phút, đúng chủ đề bài đang học, được xem lặp lại để luyện nghe.'),
  gach('Giáo viên chuẩn bị trước 3–5 câu hỏi thảo luận cho mỗi trích đoạn — xem xong là phải nói.'),
  gach('Phim là công cụ bổ trợ phản xạ nghe và nói. Nội dung từ vựng và ngữ pháp cốt lõi vẫn theo đúng tiến độ giáo trình.', true),

  muc('Khi nào con chuyển từ Kids sang Adult'),
  p('Trung tâm không dùng một mốc tuổi cứng. Con chuyển sang Speak Now khi đạt đồng thời hai điều kiện:', { after: 130 }),
  gach('Đã hoàn tất Kid’s Box Level 4, tức đạt trình độ A1.', true),
  gach('Từ khoảng 9–10 tuổi trở lên.', true),
  p('Lý do của cách làm này: Kid’s Box được thiết kế cho lứa tiểu học với hình ảnh và trò chơi hợp tâm lý 6–10 tuổi, còn Speak Now hướng tới chủ đề đời sống thực tế. Chuyển quá sớm khi chưa đủ vốn từ khiến con hụt hẫng; giữ quá lâu khiến con lớn hơn thấy nội dung "trẻ con" và mất hứng. Chúng tôi quyết định dựa trên quan sát thực tế từng học viên.', { after: 150 }),
  p('Với học viên mới bắt đầu từ 9 tuổi trở lên, trung tâm không bắt đầu từ Kid’s Box Starter mà làm bài kiểm tra đầu vào để xếp thẳng vào cấp độ phù hợp.', { after: 160 }),

  muc('Làm sao biết đang tiến bộ'),
  bang(['Quý Phụ huynh nhận được', 'Khi nào'],
    [['Báo cáo sau mỗi buổi học — con làm được gì, còn cần cải thiện gì', 'trong vòng 24 giờ'],
     ['Video buổi học', 'kèm báo cáo'],
     ['Đánh giá lại để xác nhận có lên cấp độ hay cần củng cố thêm', 'giữa kỳ và cuối kỳ']],
    [6300, 2700]),
  p('', { after: 140 }),
  p('Quý Phụ huynh cũng có thể tự đối chiếu bằng thang CEFR dưới đây — đọc mô tả "làm được gì" ở mỗi bậc để hình dung con đang ở đâu.', { after: 160 }),

  muc('Thang tham chiếu CEFR — đọc để tự đối chiếu'),
  bang(['Bậc', 'Nghe', 'Nói (tương tác)', 'Nói (trình bày)'], CEFR, [800, 2600, 3000, 2600]),
  p('', { after: 120 }),
  nguon('Nguồn: Bảng tự đánh giá CEFR — Council of Europe / Europass, bảng tham chiếu công khai, MNEE dịch sang tiếng Việt. Đây là khung tham chiếu quốc tế mà hệ thống Cambridge English và IELTS đều đối chiếu tới. Bậc Pre-A1, C1 và C2 không đưa vào bảng này vì nằm ngoài phổ của hai chương trình chính.'),

  muc('Điều trung tâm cam kết và điều không cam kết'),
  gach('Trung tâm cam kết: bố trí giáo viên đạt tiêu chuẩn tuyển chọn, gửi báo cáo cụ thể sau mỗi buổi, điều chỉnh phương pháp theo từng học viên.', true),
  gach('Trung tâm KHÔNG cam kết một mốc thời gian cố định để đạt trình độ hay điểm số. Kết quả phụ thuộc vào tần suất học, mức độ luyện tập ngoài giờ và đặc điểm của từng học viên.', true),
  gach('Trung tâm KHÔNG cấp chứng chỉ do cơ quan nhà nước công nhận. Kết thúc lộ trình, học viên nhận Giấy xác nhận hoàn thành và hồ sơ tiến độ học tập của trung tâm.', true),
  nguon('Xem chi tiết tại Thoả thuận đăng ký chương trình học V1.2, Điều 5 và Điều 8.'),

  muc('Về luyện thi IELTS'),
  p('Ms.Ngọc Elite English hiện tập trung vào tiếng Anh giao tiếp. Luyện thi IELTS là hướng trung tâm phát triển ở giai đoạn sau, dành cho học viên đã đạt tối thiểu B1. Quý Phụ huynh hoặc Học viên có nhu cầu IELTS, vui lòng trao đổi trực tiếp để trung tâm tư vấn theo từng trường hợp.', { after: 200 }),

  p('Kid’s Box thuộc bản quyền Cambridge University Press & Assessment; Speak Now thuộc bản quyền Oxford University Press. MNEE sử dụng các giáo trình này làm nền tảng và xây dựng thêm lộ trình, chuẩn đầu ra và báo cáo tiến bộ riêng theo phương pháp “Thấu hiểu để dẫn lối”.',
    { size: 18, color: '666666', italics: true, after: 160 }),
])

// ==================================================== BẢN 2 — GIÁO VIÊN

const giaoVien = taiLieu([
  ...bia('LỘ TRÌNH HỌC TẬP', 'Curriculum Map · hướng dẫn giảng dạy và xếp lớp',
         'Bản dành cho Giáo viên'),

  p('LỘ TRÌNH HỌC TẬP — HƯỚNG DẪN GIẢNG DẠY', { bold: true, size: 28, color: NAVY, align: AlignmentType.CENTER, after: 60 }),
  p('Bản dành cho Giáo viên', { italics: true, size: 20, color: '555555', align: AlignmentType.CENTER, after: 240 }),

  p('Tài liệu này là khung tham chiếu nội bộ để thiết kế lesson plan, xếp lớp và đánh giá. Bản dành cho phụ huynh là một tài liệu riêng — khi trao đổi với phụ huynh, dùng bản đó.', { after: 220 }),

  muc('1. Phạm vi hai chương trình'),
  bang(['Chương trình', 'Giáo trình nền', 'Đối tượng', 'CEFR mục tiêu'],
    [['Kids Communication', "Kid's Box (Cambridge) Starter → Level 4", 'Trẻ từ 6 tuổi đến khoảng 9–10 tuổi', 'Pre-A1 → A1'],
     ['Adult Communication', 'Speak Now (Oxford) 1–4 + phim/video theo chủ đề', 'Học viên từ ~9 tuổi, người lớn, người đi làm', 'A1 → B2'],
     ['IELTS (giai đoạn sau)', 'Cambridge IELTS Official Practice Tests', 'Học viên đã đạt tối thiểu B1', '~B1 → C1']],
    [2000, 2900, 2400, 1700]),
  p('', { after: 140 }),
  p('Trung tâm định vị là chuyên về giao tiếp. IELTS chưa phải năng lực trọng tâm được quảng bá; chỉ tư vấn khi học viên chủ động hỏi và đã đạt tối thiểu B1.', { bold: true, after: 160 }),

  muc('2. Chuẩn đầu ra Kids Communication'),
  p('Kid’s Box là giáo trình 6 cấp độ của Cambridge cho lứa tiểu học, bám hệ thống kỳ thi YLE (Starters – Movers – Flyers). MNEE triển khai Starter đến Level 4.', { after: 140 }),
  bang(['Cấp độ', 'Tuổi', 'CEFR', 'Kỳ thi YLE', 'Trọng tâm kỹ năng'],
    [['Starter', '6–7', 'Pre-A1', 'Tiền đề cho Starters', 'Bảng chữ cái, số đếm, màu sắc, từ vựng đồ vật quen thuộc, phản xạ nghe – lặp lại'],
     ['Level 1–2', '7–8', 'Pre-A1', 'Cambridge Starters', 'Câu đơn giản, chào hỏi, giới thiệu bản thân, gia đình, con vật, đồ ăn'],
     ['Level 3–4', '8–10', 'A1', 'Cambridge Movers', 'Kể chuyện đơn giản, mô tả hoạt động thường ngày, thì hiện tại/quá khứ cơ bản, hỏi–đáp mở rộng']],
    [1200, 800, 900, 1900, 4200]),
  p('', { after: 140 }),
  muc2('Chuẩn đầu ra từng cấp độ'),
  gach('Starter: nghe hiểu và nhắc lại 100–150 từ vựng chủ đề gần gũi; nói câu chào hỏi, giới thiệu tên tuổi rất đơn giản có hỗ trợ.'),
  gach('Level 1–2: nghe hiểu chỉ dẫn ngắn trong lớp; nói câu đơn về bản thân, gia đình, sở thích; đọc hiểu từ và câu ngắn có tranh; viết chép/điền từ đơn giản.'),
  gach('Level 3–4: nghe hiểu hội thoại ngắn quen thuộc; nói đoạn 3–5 câu mô tả người/vật/hoạt động; đọc hiểu đoạn văn ngắn; viết đoạn 2–4 câu có hướng dẫn.'),
  nguon('Các mốc trên do MNEE xây dựng dựa trên khung mô tả năng lực CEFR (Council of Europe) và cấu trúc phân bổ chủ đề theo YLE của Cambridge. Đây là khung tham chiếu nội bộ, không phải văn bản do Cambridge University Press công bố. Khi triển khai chi tiết đến từng unit, đối chiếu thêm với Teacher’s Book / Scheme of Work chính thức của Kid’s Box.'),

  muc('3. Quy tắc chuyển tiếp Kids → Speak Now'),
  p('Không dùng một mốc tuổi cứng. Áp dụng theo bốn tình huống sau:', { after: 130 }),
  bang(['Tình huống học viên', 'Xử lý'],
    [['Đang học Kid’s Box, đã xong Level 4 (đạt A1), từ 9–10 tuổi trở lên', 'Chuyển sang Speak Now 1.'],
     ['Mới bắt đầu học, từ 9 tuổi trở lên', 'KHÔNG bắt đầu từ Kid’s Box Starter. Làm bài kiểm tra đầu vào rồi xếp thẳng vào Speak Now 1 (nếu mất gốc) hoặc cấp độ Speak Now phù hợp hơn.'],
     ['9–10 tuổi, đang học dở Kid’s Box (Level 2–3)', 'Hoàn tất nốt Level 4 trước khi chuyển, tránh đứt quãng nền ngữ pháp và từ vựng — trừ khi bài kiểm tra giữa kỳ cho thấy đã sẵn sàng vượt cấp.'],
     ['11–12 tuổi mới bắt đầu, gần như mất gốc', 'Học tăng tốc qua nội dung tương đương Kid’s Box 3–4 (không dùng trực tiếp sách Kid’s Box vì hình ảnh không hợp lứa tuổi) trước khi vào Speak Now 1.']],
    [3400, 5600]),
  p('', { after: 140 }),
  p('Mọi trường hợp: quyết định cuối dựa trên kết quả kiểm tra đầu vào và xác nhận của Trung tâm, không áp dụng máy móc theo tuổi.', { bold: true, after: 140 }),
  p('Lý do của quy tắc: Kid’s Box thiết kế cho lứa 6–10 tuổi với hình ảnh, nhân vật, trò chơi hợp tâm lý lứa tuổi đó; Speak Now hướng tới Young Adult/Adult với chủ đề đời sống thực tế. Chuyển quá sớm khi chưa đủ nền A1 khiến học viên hụt hẫng vì thiếu vốn từ; giữ quá lâu khiến học viên lớn hơn thấy nội dung không hợp tuổi và mất động lực.', { after: 160 }),

  muc('4. Chuẩn đầu ra Adult Communication'),
  p('Speak Now (Oxford) là giáo trình 4 cấp độ cho Young Adult/Adult, phổ CEFR A1–B2. Điểm mạnh là video thực tế "English in Action" sau mỗi 4 bài học.', { after: 140 }),
  bang(['Cấp độ', 'CEFR (ước tính)', 'Trọng tâm giao tiếp', 'Ứng dụng phim/video'],
    [['Speak Now 1', 'A1 → A2', 'Giới thiệu bản thân, thói quen, gia đình, mua sắm, hỏi đường — mẫu câu nền tảng', 'Video ngắn tình huống đời sống hằng ngày'],
     ['Speak Now 2', 'A2 → B1', 'Kể chuyện quá khứ, lên kế hoạch, diễn đạt sở thích và ý kiến đơn giản', 'Trích đoạn hoạt hình/sitcom nhẹ, phụ đề tiếng Anh, chủ đề gần gũi'],
     ['Speak Now 3', 'B1 → B1+', 'Thảo luận vấn đề quen thuộc, so sánh, đưa lý do — hội thoại tự nhiên hơn', 'Trích đoạn phim/series thực tế, phân tích ngữ điệu và thành ngữ'],
     ['Speak Now 4', 'B1+ → B2', 'Trình bày quan điểm, tranh luận, giao tiếp công việc cơ bản', 'Phim/talk show chủ đề công việc, xã hội; luyện tranh luận và thuyết trình ngắn']],
    [1500, 1500, 3200, 2800]),
  p('', { after: 140 }),
  nguon('CEFR ước tính theo từng cấp độ được suy ra từ phổ chung A1–B2 mà Oxford University Press công bố cho trọn bộ 4 cấp. Trước khi dùng con số này trong tài liệu gửi ra ngoài, đối chiếu với bảng Scope & Sequence chính thức trong Teacher’s Book Speak Now.'),

  muc2('Nguyên tắc chọn phim và video bổ trợ'),
  gach('Đúng chủ đề unit đang học.'),
  gach('Độ dài 2–5 phút mỗi trích đoạn, có thể lặp lại để luyện nghe.'),
  gach('Ưu tiên nội dung phù hợp văn hoá và độ tuổi học viên.'),
  gach('Chuẩn bị trước 3–5 câu hỏi thảo luận cho mỗi trích đoạn.'),
  gach('KHÔNG thay thế giáo trình bằng phim. Phim bổ trợ kỹ năng nghe và phản xạ; ngữ pháp – từ vựng cốt lõi vẫn theo đúng tiến độ Speak Now để đảm bảo chuẩn đầu ra.', true),

  muc('5. Quy trình kiểm tra đầu vào'),
  bang(['Bước', 'Việc làm'],
    [['1', 'Học viên/phụ huynh đăng ký buổi trải nghiệm 60 phút.'],
     ['2', 'Trong 15–20 phút đầu buổi trải nghiệm, đánh giá nhanh 4 kỹ năng — chủ yếu Nghe và Nói với trẻ em; đủ 4 kỹ năng với người lớn nếu có bài viết mẫu.'],
     ['3', 'Đối chiếu kết quả với thang CEFR (mục 6) và bảng cấp độ giáo trình (mục 2, mục 4) để đề xuất lớp phù hợp.'],
     ['4', 'Ghi kết quả xếp lớp vào hồ sơ học viên trong hệ thống quản lý MNEE, làm căn cứ theo dõi tiến bộ xuyên suốt khoá học.'],
     ['5', 'Đánh giá lại giữa kỳ và cuối kỳ để xác nhận học viên đã sẵn sàng lên cấp độ hay cần củng cố thêm.']],
    [700, 8300]),

  muc('6. Thang tham chiếu CEFR'),
  bang(['Bậc', 'Nghe', 'Nói (tương tác)', 'Nói (trình bày)'], CEFR, [800, 2600, 3000, 2600]),
  p('', { after: 120 }),
  nguon('Nguồn: Bảng tự đánh giá CEFR — Council of Europe / Europass. Mô tả đầy đủ 5 kỹ năng của cả 7 bậc được lưu trong danh mục Cấp độ của hệ thống quản lý MNEE.'),

  muc('7. Ba điều không được làm'),
  gach('Không cam kết với học viên hay phụ huynh một mốc thời gian cố định để đạt trình độ, điểm số hoặc chứng chỉ.', true),
  gach('Không gán mức CEFR cho một học viên nếu chưa có kết quả kiểm tra làm căn cứ.', true),
  gach('Không nói trung tâm cấp chứng chỉ được cơ quan nhà nước công nhận. Trung tâm cấp Giấy xác nhận hoàn thành và hồ sơ tiến độ học tập.', true),

  muc('8. Lịch sử phiên bản'),
  bang(['Phiên bản', 'Ngày', 'Nội dung thay đổi'],
    [['V1.0', '16/09/2026', 'Ban hành lần đầu — lộ trình Kids, Adult, IELTS, thang CEFR và quy tắc chuyển tiếp.'],
     ['V1.1', NGAY, 'Tách thành hai bản riêng cho phụ huynh và giáo viên. Bỏ phần giọng nội bộ lọt vào bản gửi ra ngoài. Đưa IELTS về đúng vị trí chương trình giai đoạn sau, phù hợp định vị chuyên giao tiếp. Thay tham chiếu tên bảng dữ liệu bằng hệ thống quản lý MNEE.']],
    [1300, 1500, 6200]),
])

async function xuat(doc, ten) {
  const buf = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(RA, ten), buf)
  console.log(`${ten}  —  ${(buf.length / 1024).toFixed(1)} KB`)
}

;(async () => {
  await xuat(phuHuynh, 'EDU_LoTrinhHocTap_PhuHuynh_V1.1_2026-09-17.docx')
  await xuat(giaoVien, 'EDU_LoTrinhHocTap_GiaoVien_V1.1_2026-09-17.docx')
})()
