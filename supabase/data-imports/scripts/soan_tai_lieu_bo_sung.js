/**
 * Sinh ba tài liệu còn thiếu trong kho hồ sơ MNEE.
 *
 * Chạy: node soan_tai_lieu_bo_sung.js <thư-mục-xuất>
 *
 *   1. Chính sách học tập (gửi phụ huynh & học viên)
 *   2. Welcome Pack — bắt đầu học (gửi khi học viên vào lớp)
 *   3. Filipino Teacher Recruitment V1.1 (sửa khoảng lương sai ở V1.0)
 *
 * NGUYÊN TẮC: mọi điều khoản trong hai tài liệu đầu đều LẤY NGUYÊN từ Thoả
 * thuận đăng ký chương trình học V1.2 và Thoả thuận cộng tác giảng dạy V1.2 mà
 * Founder đã chốt ngày 16/09/2026. Không thêm quy định mới. Nếu hai bên đọc
 * thấy khác nhau thì là lỗi, không phải "bản rút gọn linh hoạt".
 *
 * KHÔNG sinh "Lộ trình học" và "Quy trình Placement Test": hai tài liệu đó cần
 * nội dung thật từ giáo trình Kid's Box / Speak Now và bài kiểm tra đầu vào do
 * Founder thiết kế. Bảng levels trong hệ thống chỉ có thang CEFR chung (Pre-A1
 * đến C2), không gắn với chương trình nào và không có chuẩn đầu ra. Bịa ra mức
 * CEFR hay nội dung giáo trình là rủi ro thương hiệu.
 */

const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx')

const RA_DIR = process.argv[2] || '.'
const NGAY = '17/09/2026'
const NAVY = '1B2A4A'
const GOLD = 'A8863B'
const DO = '7B2D3B'

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, line: 300 },
    alignment: o.align,
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 22,
                             color: o.color, font: 'Calibri' })],
  })

const muc = (text) =>
  new Paragraph({
    spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY, font: 'Calibri' })],
  })

const gach = (text, dam) =>
  new Paragraph({
    spacing: { after: 100, line: 300 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22, bold: dam, font: 'Calibri' })],
  })

const oDien = (nhan) =>
  new Paragraph({
    spacing: { after: 110 },
    children: [
      new TextRun({ text: `${nhan}: `, size: 22, font: 'Calibri' }),
      new TextRun({ text: '.'.repeat(52), size: 22, color: '999999', font: 'Calibri' }),
    ],
  })

function bang(tieu_de, dong, rong) {
  const o = (t, dam, nen, canh, i) =>
    new TableCell({
      width: { size: rong[i], type: WidthType.DXA },
      shading: nen ? { type: ShadingType.CLEAR, fill: nen } : undefined,
      margins: { top: 90, bottom: 90, left: 130, right: 130 },
      children: [new Paragraph({ alignment: canh,
        children: [new TextRun({ text: t, bold: dam, size: 20,
          color: nen ? 'FFFFFF' : undefined, font: 'Calibri' })] })],
    })
  return new Table({
    width: { size: rong.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: rong,
    rows: [
      new TableRow({ tableHeader: true,
        children: tieu_de.map((t, i) => o(t, true, NAVY, AlignmentType.LEFT, i)) }),
      ...dong.map((d) => new TableRow({
        children: d.map((t, i) => o(t, false, null,
          i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT, i)) })),
    ],
  })
}

const bia = (ten, phu, pb, ngay) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 80 },
    children: [new TextRun({ text: 'MS.NGỌC ELITE ENGLISH', bold: true, size: 32, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: 'TÀI LIỆU CHÍNH THỨC', size: 20, color: GOLD, characterSpacing: 60, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 },
    children: [new TextRun({ text: ten, bold: true, size: 40, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: phu, italics: true, size: 22, color: '555555', font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: `Phiên bản: ${pb}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: `Ngày ban hành: ${ngay}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: '“Thấu hiểu để dẫn lối.”', italics: true, size: 22, color: GOLD, font: 'Calibri' })] }),
  new Paragraph({ pageBreakBefore: true, spacing: { after: 0 }, children: [new TextRun({ text: '', size: 2 })] }),
]

const taiLieu = (children) => new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }],
})

const nguon = (text) => new Paragraph({
  spacing: { before: 60, after: 160 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 } },
  children: [new TextRun({ text, italics: true, size: 18, color: '666666', font: 'Calibri' })],
})

// ==================================================== 1. CHÍNH SÁCH HỌC TẬP

const chinhSach = taiLieu([
  ...bia('CHÍNH SÁCH HỌC TẬP', 'Những điều Quý Phụ huynh và Học viên cần biết', 'V1.0', NGAY),

  p('CHÍNH SÁCH HỌC TẬP', { bold: true, size: 30, color: NAVY, align: AlignmentType.CENTER, after: 200 }),
  p('Tài liệu này tóm tắt toàn bộ quy định học tập tại Ms.Ngọc Elite English để Quý Phụ huynh và Học viên nắm rõ trước khi bắt đầu. Mọi điều khoản dưới đây lấy nguyên từ Thoả thuận đăng ký chương trình học V1.2 — nếu có chỗ nào đọc thấy khác nhau, Thoả thuận là bản có giá trị.', { after: 220 }),

  muc('1. Bắt đầu học'),
  gach('Buổi học đầu tiên (60 phút) miễn phí hoàn toàn, để học viên trải nghiệm phương pháp trước khi quyết định. Buổi này không ràng buộc nghĩa vụ đăng ký tiếp theo.'),
  gach('Buổi thứ 2 và thứ 3: thanh toán theo từng buổi.'),
  gach('Từ buổi thứ 4: đóng trọn gói 10 buổi để tiếp tục lộ trình.'),
  nguon('Thoả thuận đăng ký chương trình học V1.2, Điều 2.'),

  muc('2. Lớp học và thời lượng'),
  bang(['Sĩ số lớp', 'Thời lượng mỗi buổi'],
       [['1 kèm 1 đến 1 kèm 4', '60 phút'], ['1 kèm 5 và 1 kèm 6', '75 phút']], [5400, 3600]),
  p('', { after: 120 }),
  gach('Sĩ số lớp nhóm tối đa 6 học viên.'),
  gach('Lớp học trực tuyến qua Zoom hoặc Google Meet.'),
  nguon('Thoả thuận V1.2, Điều 1. Bảng học phí SOP V1.1, Mục 2.'),

  muc('3. Nghỉ học, đổi lịch và học bù'),
  gach('Báo nghỉ hoặc xin đổi lịch trước tối thiểu 05 giờ: buổi học được bảo lưu và xếp lại trong tuần, không mất buổi.', true),
  gach('Báo dưới 05 giờ, hoặc vắng mặt không báo trước: buổi học được tính là đã sử dụng trong gói.'),
  gach('Trường hợp bất khả kháng có minh chứng (ốm đau đột xuất, sự cố y tế, thiên tai) được xem xét riêng.'),
  gach('Với lớp 1 kèm 1, giáo viên chờ học viên tối đa 20 phút kể từ giờ học đã xác nhận.'),
  gach('Nếu giáo viên bận đột xuất, Trung tâm báo trước tối thiểu 24 giờ và xếp lịch bù; buổi đó không bị trừ vào gói của học viên.'),
  nguon('Thoả thuận V1.2, Điều 4. Thoả thuận cộng tác giảng dạy V1.2, Điều 4.'),

  muc('4. Bảo lưu và hoàn học phí'),
  gach('Bảo lưu tối đa 06 tháng, áp dụng 01 lần cho mỗi gói, báo trước tối thiểu 07 ngày. Các buổi chưa học không mất giá trị.', true),
  gach('Lý do được chấp nhận: ốm đau, chuyển nơi ở, sự kiện bất khả kháng có minh chứng.'),
  gach('Hoàn học phí khi việc gián đoạn xuất phát từ lỗi của Trung tâm — không bố trí được giáo viên phù hợp trong thời gian hợp lý, hoặc không thực hiện đúng cam kết và không khắc phục sau khi Quý Phụ huynh phản ánh bằng văn bản.'),
  gach('Cách tính hoàn: (Số buổi còn lại ÷ 10) × Học phí gói đã thanh toán.', true),
  gach('Trung tâm phản hồi và hoàn tất chuyển khoản trong vòng 07 ngày làm việc kể từ ngày nhận yêu cầu.'),
  gach('Không hoàn học phí cho các buổi đã học, hoặc khi học viên tự ý nghỉ không thuộc diện lý do chính đáng.'),
  nguon('Thoả thuận V1.2, Điều 3.'),

  muc('5. Báo cáo và theo dõi tiến bộ'),
  gach('Sau mỗi buổi học, Quý Phụ huynh nhận báo cáo trong vòng 24 giờ, nêu cụ thể học viên làm được gì và còn cần cải thiện gì.', true),
  gach('Buổi học được ghi hình để phục vụ giám sát chất lượng nội bộ và làm minh chứng tiến bộ gửi Quý Phụ huynh. Bản ghi lưu trên hệ thống của Trung tâm, giữ tối thiểu 12 tháng.'),
  gach('Bài tập về nhà (nếu có) bám sát nội dung buổi học; hoàn thành bài tập là điều kiện để giữ đúng tiến độ lộ trình.'),
  nguon('Thoả thuận V1.2, Điều 5 và Điều 7.'),

  muc('6. Hình ảnh và dữ liệu cá nhân'),
  p('Trung tâm tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, đặc biệt với dữ liệu cá nhân của trẻ em.', { after: 120 }),
  gach('Ghi hình buổi học phục vụ mục đích nội bộ và gửi Quý Phụ huynh: nằm trong phạm vi Thoả thuận đã ký.'),
  gach('Dùng hình ảnh, video hoặc giọng nói của học viên cho truyền thông, quảng bá: CHỈ khi có ô đồng ý riêng được tick trong Thoả thuận.', true),
  gach('Quý Phụ huynh có quyền rút lại sự đồng ý bất kỳ lúc nào bằng văn bản; Trung tâm ngừng sử dụng và xoá dữ liệu liên quan.'),
  nguon('Thoả thuận V1.2, Điều 7.'),

  muc('7. Thanh toán'),
  gach('Hình thức: chuyển khoản ngân hàng.'),
  gach('Học phí gói 10 buổi thanh toán đầy đủ trước buổi học thứ 4.'),
  gach('Xác nhận thanh toán bằng biên nhận của Trung tâm kèm sao kê chuyển khoản. Trung tâm hiện không phát hành hoá đơn giá trị gia tăng.', true),
  nguon('Thoả thuận V1.2, Điều 2. SOP Thu học phí V1.1, Mục 1.'),

  muc('8. Kết quả học tập'),
  gach('Chương trình tập trung phát triển năng lực giao tiếp tiếng Anh thực tế theo lộ trình cá nhân hoá.'),
  gach('Trung tâm KHÔNG cam kết một mốc thời gian cố định để đạt trình độ, điểm số hay chứng chỉ cụ thể. Kết quả phụ thuộc vào tần suất học, mức độ luyện tập ngoài giờ và các yếu tố cá nhân của từng học viên.', true),
  gach('Trung tâm KHÔNG cấp chứng chỉ hoặc văn bằng do cơ quan nhà nước công nhận. Kết thúc lộ trình, học viên nhận Giấy xác nhận hoàn thành và hồ sơ tiến độ học tập — đây là ghi nhận quá trình học, không phải chứng chỉ do cơ quan nhà nước hoặc tổ chức khảo thí cấp.', true),
  nguon('Thoả thuận V1.2, Điều 5 và Điều 8.'),

  muc('9. Liên hệ'),
  p('Mọi thắc mắc về lịch học, học phí, báo cáo tiến bộ hoặc chất lượng giảng dạy, Quý Phụ huynh liên hệ trực tiếp Trung tâm qua Zalo hoặc email. Trung tâm phản hồi trong vòng 24 giờ làm việc.', { after: 200 }),
  oDien('Zalo / Điện thoại'),
  oDien('Email'),
])

// ======================================================== 2. WELCOME PACK

const welcome = taiLieu([
  ...bia('WELCOME PACK', 'Thông tin bắt đầu học — gửi khi học viên vào lớp chính thức', 'V1.0', NGAY),

  p('CHÀO MỪNG ĐẾN VỚI MS.NGỌC ELITE ENGLISH', { bold: true, size: 28, color: NAVY, align: AlignmentType.CENTER, after: 200 }),
  p('Cảm ơn Quý Phụ huynh và Học viên đã tin tưởng đồng hành. Dưới đây là toàn bộ thông tin cần cho buổi học đầu tiên và những buổi tiếp theo.', { after: 240 }),

  muc('Thông tin lớp học'),
  oDien('Họ và tên học viên'),
  oDien('Chương trình'),
  oDien('Giáo trình nền'),
  oDien('Hình thức lớp'),
  oDien('Giáo viên phụ trách'),
  oDien('Lịch học cố định (thứ / giờ)'),
  oDien('Thời lượng mỗi buổi'),
  oDien('Ngày bắt đầu'),

  muc('Vào lớp bằng cách nào'),
  oDien('Nền tảng (Zoom / Google Meet)'),
  oDien('Link phòng học cố định'),
  oDien('ID phòng / Mật khẩu (nếu có)'),
  p('Học viên vào phòng trước giờ học 5 phút. Nếu gặp sự cố kết nối, nhắn ngay vào Zalo của Trung tâm để được hỗ trợ.', { after: 160 }),

  muc('Chuẩn bị trước buổi học'),
  gach('Đường truyền internet ổn định, tai nghe có micro.'),
  gach('Không gian yên tĩnh, đủ sáng, bật camera trong suốt buổi học.'),
  gach('Sách giáo trình và vở ghi để sẵn trên bàn.'),
  gach('Với học viên nhỏ tuổi: phụ huynh hỗ trợ con vào phòng học đúng giờ trong vài buổi đầu.'),

  muc('Quý Phụ huynh sẽ nhận được gì'),
  bang(['Nội dung', 'Khi nào'],
       [['Báo cáo sau mỗi buổi học', 'trong vòng 24 giờ'],
        ['Video buổi học', 'kèm báo cáo'],
        ['Bài tập về nhà (nếu có)', 'kèm báo cáo'],
        ['Nhắc gia hạn gói học', 'khi còn 2 buổi cuối']], [5400, 3600]),
  p('', { after: 140 }),
  p('Báo cáo nêu cụ thể học viên đã làm được gì và còn cần cải thiện gì — không viết chung chung.', { italics: true, size: 20, color: '555555', after: 160 }),

  muc('Ba điều cần nhớ'),
  gach('Báo nghỉ trước tối thiểu 05 giờ thì buổi học được xếp bù, không mất buổi.', true),
  gach('Học phí gói 10 buổi thanh toán trước buổi thứ 4.', true),
  gach('Mọi thắc mắc nhắn thẳng Zalo của Trung tâm, không qua giáo viên — để Trung tâm nắm và xử lý đúng đầu mối.', true),
  p('Chi tiết đầy đủ xem tài liệu “Chính sách học tập”.', { italics: true, size: 20, color: '555555', after: 160 }),

  muc('Kênh hỗ trợ'),
  oDien('Zalo / Điện thoại Trung tâm'),
  oDien('Email'),
  p('Trung tâm phản hồi trong vòng 24 giờ làm việc.', { after: 200 }),
  p('Chúc học viên một hành trình học tiếng Anh thật vui và thật hiệu quả.', { italics: true, color: GOLD, align: AlignmentType.CENTER, after: 200 }),
])

// ============================================ 3. RECRUITMENT PH — V1.1 SỬA

const TY_GIA = 26090  // Vietcombank, ngày 10/09/2026
const usd = (v) => `≈ USD ${(v / TY_GIA).toFixed(2)}`

const tuyenDung = taiLieu([
  ...bia('ONLINE ENGLISH TEACHER RECRUITMENT',
         'Kids Communication · Adult Communication · IELTS', 'V1.1', NGAY),

  p('ONLINE ENGLISH TEACHER RECRUITMENT', { bold: true, size: 28, color: NAVY, align: AlignmentType.CENTER, after: 200 }),

  muc('About Ms.Ngọc Elite English'),
  p('Ms.Ngọc Elite English (MNEE) is a Vietnam-based online English communication programme offering 1-on-1 and small-group classes for children (from age 6), adults, and working professionals. We focus on real-life communication skills and speaking confidence, with close, personalised attention to every learner.', { after: 160 }),

  muc('Why teach with MNEE'),
  gach('Small classes — 1-on-1 or up to 6 students. You get to know your students and genuinely track their progress.'),
  gach('Established core curricula (Kid’s Box by Cambridge; Speak Now by Oxford University Press) with a Curriculum Map and standard lesson-plan templates already prepared.'),
  gach('Flexible scheduling around your confirmed teaching slots, fully online via Zoom or Google Meet.'),
  gach('Ongoing coaching on communicative teaching methods, under our guiding philosophy “Thấu hiểu để dẫn lối” (“Understanding leads the way”).'),
  gach('Payment on a fixed date every month, with a transparent session count you can check.'),

  muc('Responsibilities'),
  gach('Teach assigned 1-on-1 or small-group online classes in the Kids Communication, Adult Communication and/or IELTS programmes.'),
  gach('Prepare and adapt lesson plans following MNEE’s Curriculum Map and standard template.'),
  gach('Submit a short, specific student progress report within 24 hours of every session, based on real observation — not generic comments.'),
  gach('Take part in periodic team meetings and coaching sessions.'),

  muc('Candidate requirements'),
  gach('Near-native or native-level English proficiency; a Bachelor’s degree is required (Education, English or a related field preferred).'),
  gach('TESOL / TEFL / CELTA certification preferred, or willingness to obtain one.'),
  gach('Prior experience teaching children and/or adult ESL learners online is a strong plus.'),
  gach('Reliable high-speed internet, a working webcam and headset, and a quiet, professional-looking space for video lessons.'),
  gach('Patient, observant, and comfortable adapting your teaching style to each learner’s personality and pace.'),

  muc('Pay rates'),
  p('Rates are per completed session and are the same for Vietnamese and Philippines-based teachers. Payment is made in Vietnamese dong (VND); the USD figures below are indicative only and move with the exchange rate.', { after: 160 }),
  p('Communication classes (children and adults)', { bold: true, size: 22, after: 100 }),
  bang(['Class size', 'Duration', 'Per session (VND)', 'Indicative USD'],
       [['1-on-1', '60 min', '120,000', usd(120000)],
        ['1-on-2', '60 min', '140,000', usd(140000)],
        ['1-on-3', '60 min', '160,000', usd(160000)],
        ['1-on-4', '60 min', '180,000', usd(180000)],
        ['1-on-5', '75 min', '200,000', usd(200000)],
        ['1-on-6', '75 min', '220,000', usd(220000)]], [2400, 1800, 2400, 2400]),
  p('', { after: 140 }),
  p('IELTS classes', { bold: true, size: 22, after: 100 }),
  bang(['Class size', 'Duration', 'Per session (VND)', 'Indicative USD'],
       [['1-on-1', '60 min', '150,000', usd(150000)],
        ['1-on-2', '60 min', '170,000', usd(170000)],
        ['1-on-3', '60 min', '190,000', usd(190000)],
        ['1-on-4', '60 min', '210,000', usd(210000)],
        ['1-on-5', '75 min', '230,000', usd(230000)],
        ['1-on-6', '75 min', '250,000', usd(250000)]], [2400, 1800, 2400, 2400]),
  p('', { after: 140 }),
  p(`USD figures converted at ${TY_GIA.toLocaleString('en-US')} VND/USD (Vietcombank selling rate, 10 September 2026). Your actual amount in USD or PHP depends on the rate and any transfer fees on the day of payment.`,
    { italics: true, size: 18, color: '666666', after: 160 }),

  muc('Engagement and payment'),
  bang(['Item', 'Detail'],
       [['Engagement type', 'Independent contractor, per session, remote'],
        ['Payment date', 'The 3rd of the following month'],
        ['Payment method', 'Bank transfer / Wise / PayPal — confirmed before the first payment'],
        ['Schedule', 'Flexible, based on confirmed class slots'],
        ['Onboarding', 'Curriculum Map, lesson-plan templates, periodic coaching']], [3000, 6000]),
  p('', { after: 140 }),
  p('Cross-border payment method and any applicable tax or withholding matters are confirmed in writing with each successful candidate before the first payment.', { size: 20, color: '555555', after: 160 }),

  muc('Application process'),
  gach('Step 1 — Submit your CV and relevant certificates by email or the contact channel below.'),
  gach('Step 2 — Initial screening and a short introductory call.'),
  gach('Step 3 — Video interview covering teaching approach and experience.'),
  gach('Step 4 — Demo lesson (15–20 minutes) on an assigned topic.'),
  gach('Step 5 — Offer confirmation and signing of the Teaching Collaborator Agreement.'),
  gach('Step 6 — Onboarding: receive teaching materials, complete a short orientation, and begin receiving classes.'),

  muc('Contact for applications'),
  oDien('Application email'),
  oDien('WhatsApp / Zalo / phone'),
  oDien('Facebook page / Website'),
])

async function xuat(doc, ten) {
  const buf = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(RA_DIR, ten), buf)
  console.log(`${ten}  —  ${(buf.length / 1024).toFixed(1)} KB`)
}

;(async () => {
  await xuat(chinhSach, 'OPS_ChinhSachHocTap_V1.0_2026-09-17.docx')
  await xuat(welcome,   'OPS_WelcomePack_V1.0_2026-09-17.docx')
  await xuat(tuyenDung, 'RECRUIT_FilipinoTeacher_V1.1_2026-09-17.docx')
})()
