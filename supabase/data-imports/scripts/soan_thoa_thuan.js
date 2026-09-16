/**
 * Sinh hai thoả thuận V1.2 của Ms.Ngọc Elite English.
 *
 * Chạy: node supabase/data-imports/scripts/soan_thoa_thuan.js <thư-mục-xuất>
 *
 * Thông tin định danh Bên A đọc từ .ben-a.json — tệp đó bị .gitignore bỏ qua vì
 * chứa số CCCD. Không commit số CCCD vào git; xem .ben-a.example.json làm mẫu.
 *
 * Các quyết định Founder chốt ngày 16/09/2026, thay cho V1.1 (07/08/2026):
 *   - Buổi 1 trải nghiệm miễn phí; buổi 2 và 3 trả học phí LẺ; từ buổi 4 đóng
 *     gói 10 buổi. (V1.1 không nói buổi 2-3 có thu tiền hay không.)
 *   - Báo huỷ trước 5 giờ (V1.1 ghi 12 giờ).
 *   - Sĩ số nhóm tối đa 6 (V1.1 ghi 4, nhưng bảng giá có tới 1:6).
 *   - Lớp 1:5 và 1:6 bắt buộc 75 phút.
 *   - Trả thù lao giáo viên ngày 03 hằng tháng.
 *   - Bên A là cá nhân, không phải "trung tâm có người đại diện".
 *   - Thêm Điều 6.3 sở hữu dữ liệu buổi học vào thoả thuận giáo viên.
 *   - Xoá hai ghi chú soạn thảo còn sót trong Điều 4 của cả hai bản.
 */

const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx')

const A = JSON.parse(fs.readFileSync(path.join(__dirname, '.ben-a.json'), 'utf8'))
const RA_DIR = process.argv[2] || '.'
const NGAY = '16/09/2026'
const PHIEN_BAN = 'V1.2'

const NAVY = '1B2A4A'
const GOLD = 'A8863B'

// ---------------------------------------------------------------- tiện ích

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, line: 300 },
    alignment: o.align,
    indent: o.indent,
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 22,
                             color: o.color, font: 'Calibri' })],
  })

const dieu = (so, ten) =>
  new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text: `Điều ${so}. ${ten}`, bold: true, size: 24, color: NAVY, font: 'Calibri' })],
  })

const gach = (text) =>
  new Paragraph({
    spacing: { after: 100, line: 300 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
  })

const oDien = (nhan) =>
  new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${nhan}: `, size: 22, font: 'Calibri' }),
      new TextRun({ text: '.'.repeat(60), size: 22, color: '999999', font: 'Calibri' }),
    ],
  })

const oDaDien = (nhan, gia_tri) =>
  new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${nhan}: `, size: 22, font: 'Calibri' }),
      new TextRun({ text: gia_tri, size: 22, bold: true, font: 'Calibri' }),
    ],
  })

function bang(tieu_de, cac_dong, cot_rong) {
  const tong = cot_rong.reduce((a, b) => a + b, 0)
  const o = (t, { dam = false, nen = null, canh = AlignmentType.LEFT } = {}, i) =>
    new TableCell({
      width: { size: cot_rong[i], type: WidthType.DXA },
      shading: nen ? { type: ShadingType.CLEAR, fill: nen } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: canh,
        children: [new TextRun({ text: t, bold: dam, size: 20,
          color: nen ? 'FFFFFF' : undefined, font: 'Calibri' })] })],
    })
  return new Table({
    width: { size: tong, type: WidthType.DXA },
    columnWidths: cot_rong,
    rows: [
      new TableRow({ tableHeader: true,
        children: tieu_de.map((t, i) => o(t, { dam: true, nen: NAVY }, i)) }),
      ...cac_dong.map((d) => new TableRow({
        children: d.map((t, i) => o(t, { canh: i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT }, i)) })),
    ],
  })
}

const bia = (ten, phu_de) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 80 },
    children: [new TextRun({ text: 'MS.NGỌC ELITE ENGLISH', bold: true, size: 32, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: 'TÀI LIỆU KÝ KẾT', size: 20, color: GOLD,
      characterSpacing: 60, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 },
    children: [new TextRun({ text: ten, bold: true, size: 40, color: NAVY, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: phu_de, italics: true, size: 22, color: '555555', font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: `Phiên bản: ${PHIEN_BAN}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: `Ngày ban hành: ${NGAY}`, size: 20, font: 'Calibri' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: '“Thấu hiểu để dẫn lối.”', italics: true, size: 22, color: GOLD, font: 'Calibri' })] }),
  new Paragraph({ pageBreakBefore: true, spacing: { after: 0 },
    children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 22, font: 'Calibri' })],
    alignment: AlignmentType.CENTER }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
    children: [new TextRun({ text: 'Độc lập – Tự do – Hạnh phúc', bold: true, size: 22, font: 'Calibri' })] }),
]

// Khối định danh Bên A dùng chung cho cả hai bản. Đây là chỗ sửa lớn nhất so
// với V1.1: bỏ "TRUNG TÂM" và "Người đại diện", vì chưa đăng ký pháp danh thì
// không có pháp nhân nào để đại diện.
const khoiBenA = () => [
  p('BÊN A — BÊN CUNG CẤP DỊCH VỤ', { bold: true, color: NAVY }),
  oDaDien('Họ và tên', A.ho_ten),
  oDaDien('CCCD số', A.cccd),
  oDaDien('Ngày cấp / Nơi cấp', `${A.ngay_cap} — ${A.noi_cap}`),
  oDaDien('Địa chỉ liên hệ', A.dia_chi),
  oDaDien('Điện thoại / Zalo', A.dien_thoai),
  oDaDien('Email', A.email),
  p('(Hoạt động dưới thương hiệu Ms.Ngọc Elite English — chương trình dạy tiếng Anh giao tiếp trực tuyến. Trong Thoả thuận này, Bên A còn được gọi tắt là “Trung tâm”.)',
    { italics: true, size: 20, color: '555555', after: 200 }),
]

const kyTen = (nhan_b, nhan_c) => {
  const cot = nhan_c ? [3000, 3000, 3000] : [4500, 4500]
  const o = (t) => new TableCell({
    width: { size: cot[0], type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
               left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
        children: [new TextRun({ text: t, bold: true, size: 20, font: 'Calibri' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
        children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, size: 18, font: 'Calibri' })] }),
    ],
  })
  return new Table({ width: { size: cot.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: cot,
    rows: [new TableRow({ children: [o('BÊN A'), o(nhan_b), ...(nhan_c ? [o(nhan_c)] : [])] })] })
}

function taiLieu(children) {
  return new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children }],
  })
}

// ==================================================== 1. THOẢ THUẬN HỌC VIÊN

const hocVien = taiLieu([
  ...bia('THOẢ THUẬN ĐĂNG KÝ CHƯƠNG TRÌNH HỌC',
         'Thoả thuận cung cấp dịch vụ dạy học tiếng Anh trực tuyến'),

  p('THOẢ THUẬN ĐĂNG KÝ CHƯƠNG TRÌNH HỌC', { bold: true, size: 28, color: NAVY,
    align: AlignmentType.CENTER, after: 240 }),
  p('Cảm ơn Quý Phụ huynh/Học viên đã tin tưởng lựa chọn đồng hành cùng Ms.Ngọc Elite English. Thoả thuận dưới đây được lập trên tinh thần tự nguyện, thiện chí, với nội dung như sau:', { after: 220 }),

  ...khoiBenA(),

  p('BÊN B — HỌC VIÊN / PHỤ HUYNH HỌC VIÊN', { bold: true, color: NAVY }),
  oDien('Họ và tên học viên'),
  oDien('Ngày sinh học viên'),
  oDien('Họ và tên Phụ huynh/người giám hộ (bắt buộc nếu học viên dưới 18 tuổi)'),
  oDien('CCCD số (của Phụ huynh/người giám hộ hoặc học viên từ 18 tuổi)'),
  oDien('Số điện thoại liên hệ'),
  oDien('Email liên hệ'),
  oDien('Địa chỉ'),

  dieu(1, 'Chương trình học đăng ký'),
  oDien('Chương trình (Kids Communication / Adult Communication / IELTS)'),
  oDien('Giáo trình nền (Kid’s Box level … / Speak Now level …)'),
  oDien('Hình thức lớp (1 kèm 1 / nhóm nhỏ tối đa 6 học viên)'),
  oDien('Lịch học dự kiến (thứ/giờ, số buổi/tuần)'),
  gach('Lớp từ 1 đến 4 học viên: 60 phút mỗi buổi. Lớp 5 hoặc 6 học viên: 75 phút mỗi buổi.'),
  gach('Nội dung và tiến độ giảng dạy thực hiện theo Curriculum Map và chuẩn đầu ra từng level của MNEE.'),

  dieu(2, 'Chính sách học phí và thanh toán'),
  gach('Buổi học đầu tiên (60 phút) được Bên A tài trợ miễn phí 100%, để Học viên/Phụ huynh trải nghiệm trực tiếp phương pháp giảng dạy trước khi quyết định. Buổi này không phát sinh chi phí và không ràng buộc nghĩa vụ đăng ký tiếp theo.'),
  gach('Buổi học thứ 2 và thứ 3: Học viên thanh toán theo từng buổi (học phí lẻ), theo đơn giá tương ứng với sĩ số lớp và loại giáo viên tại bảng học phí hiện hành.'),
  gach('Từ buổi học thứ 4 trở đi: Học viên/Phụ huynh thanh toán trọn gói 10 buổi để tiếp tục lộ trình.'),
  oDien('Đơn giá buổi lẻ (áp dụng cho buổi 2 và buổi 3)'),
  oDien('Học phí trọn gói 10 buổi'),
  oDien('Thời hạn sử dụng gói học (kể từ ngày thanh toán)'),
  gach('Hình thức thanh toán: chuyển khoản ngân hàng. Học phí gói 10 buổi cần được thanh toán đầy đủ trước khi bắt đầu buổi học thứ 4; Bên A có quyền tạm dừng xếp lịch nếu quá thời hạn mà chưa nhận được thanh toán.'),
  gach('Xác nhận thanh toán được thực hiện bằng biên nhận của Bên A kèm sao kê chuyển khoản. Bên A hiện không phát hành hoá đơn giá trị gia tăng.'),

  dieu(3, 'Chính sách bảo lưu và hoàn học phí'),
  gach('Học viên được bảo lưu khoá học khi có lý do chính đáng (ốm đau, chuyển nơi ở, sự kiện bất khả kháng có minh chứng), thời hạn bảo lưu tối đa 06 tháng, áp dụng 01 lần cho mỗi gói, báo trước tối thiểu 07 ngày. Các buổi chưa sử dụng không mất giá trị.'),
  gach('Nếu việc gián đoạn học tập xuất phát từ lỗi thuộc về Bên A — không bố trí được giáo viên phù hợp trong thời gian hợp lý sau khi đã được thông báo, hoặc không thực hiện đúng cam kết tại Điều 5 và không khắc phục sau khi Học viên/Phụ huynh phản ánh bằng văn bản — Bên A hoàn lại giá trị các buổi chưa sử dụng theo công thức: (Số buổi còn lại ÷ 10) × Học phí gói đã thanh toán.'),
  gach('Bên A không hoàn học phí đối với các buổi đã học, hoặc trường hợp Học viên tự ý nghỉ học không thuộc diện lý do chính đáng nêu trên.'),
  gach('Yêu cầu bảo lưu/hoàn học phí gửi bằng văn bản (email/Zalo). Bên A phản hồi và hoàn tất chuyển khoản hoàn trong vòng 07 ngày làm việc kể từ ngày nhận yêu cầu.'),

  dieu(4, 'Chính sách đổi lịch và huỷ buổi học'),
  gach('Học viên/Phụ huynh báo huỷ hoặc đề nghị đổi lịch tối thiểu 05 giờ trước giờ học đã xác nhận để buổi học được bảo lưu và xếp lại trong tuần.'),
  gach('Trường hợp báo huỷ dưới 05 giờ hoặc vắng mặt không báo trước (không thuộc trường hợp bất khả kháng có minh chứng), buổi học được tính là đã sử dụng trong gói đã thanh toán.'),
  gach('Với lớp 1 kèm 1, giáo viên chờ học viên tối đa 20 phút kể từ giờ học đã xác nhận.'),

  dieu(5, 'Cam kết của Bên A'),
  gach('Bố trí giáo viên đáp ứng tiêu chuẩn tuyển chọn của MNEE (trình độ tiếng Anh, bằng cấp/chứng chỉ giảng dạy, đã qua phỏng vấn và dạy thử theo quy trình tuyển dụng nội bộ).'),
  gach('Gửi báo cáo tiến độ học tập sau mỗi buổi học trong vòng 24 giờ, nêu cụ thể những gì học viên đã làm được và còn cần cải thiện.'),
  gach('Quan sát và điều chỉnh phương pháp giảng dạy phù hợp với từng học viên theo triết lý “Thấu hiểu để dẫn lối”.'),
  gach('Không cam kết một mốc thời gian cố định để đạt trình độ, điểm số hoặc chứng chỉ cụ thể, vì kết quả học tập phụ thuộc vào tần suất học thực tế, mức độ luyện tập ngoài giờ của học viên, và các yếu tố cá nhân khác ngoài phạm vi kiểm soát của Bên A.'),

  dieu(6, 'Cam kết của Học viên / Phụ huynh'),
  gach('Tham gia đầy đủ, đúng giờ theo lịch học đã xác nhận.'),
  gach('Hoàn thành bài tập về nhà (nếu có) để bảo đảm tiến độ theo lộ trình.'),
  gach('Thanh toán học phí đầy đủ, đúng hạn theo Điều 2.'),
  gach('Cung cấp thông tin chính xác về học viên (độ tuổi, trình độ tiếng Anh hiện tại, mục tiêu học) để Bên A bố trí giáo viên và lộ trình phù hợp.'),
  gach('Phối hợp với giáo viên trong việc theo dõi, hỗ trợ học viên luyện tập ngoài giờ học, đặc biệt với học viên là trẻ em.'),

  dieu(7, 'Đồng ý xử lý dữ liệu và sử dụng hình ảnh học viên'),
  p('Điều khoản này được xây dựng tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, đặc biệt là các quy định riêng đối với dữ liệu cá nhân của trẻ em.', { after: 140 }),
  gach('Bên A có thể ghi hình một phần hoặc toàn bộ buổi học nhằm mục đích giám sát, đánh giá chất lượng giảng dạy nội bộ và làm minh chứng tiến bộ học tập gửi Phụ huynh/Học viên. Bản ghi được lưu trên hệ thống do Bên A quản lý và giữ tối thiểu 12 tháng kể từ ngày buổi học diễn ra.'),
  gach('Việc sử dụng hình ảnh, video, giọng nói của học viên cho mục đích truyền thông, quảng bá thương hiệu (ngoài phạm vi nội bộ nêu trên) CHỈ được thực hiện khi có sự đồng ý riêng, rõ ràng, bằng văn bản của Phụ huynh/người giám hộ (với học viên dưới 18 tuổi) hoặc của chính học viên (từ 18 tuổi trở lên).'),
  gach('Phụ huynh/Học viên có quyền từ chối hoặc rút lại sự đồng ý bất kỳ lúc nào bằng văn bản; Bên A ngừng sử dụng và xoá dữ liệu/hình ảnh liên quan trong thời gian hợp lý sau khi nhận được yêu cầu.'),
  p('☐ Đồng ý          ☐ Không đồng ý', { bold: true, after: 60 }),
  p('cho phép Bên A sử dụng hình ảnh/video của học viên cho mục đích truyền thông, quảng bá thương hiệu (ngoài phạm vi giám sát chất lượng nội bộ).', { size: 20, after: 160 }),

  dieu(8, 'Phạm vi chương trình'),
  gach('Chương trình tại Ms.Ngọc Elite English tập trung phát triển năng lực giao tiếp tiếng Anh thực tế theo lộ trình cá nhân hoá, không phải chương trình luyện thi lấy chứng chỉ hay văn bằng chính quy.'),
  gach('Bên A không cấp chứng chỉ hoặc văn bằng do cơ quan nhà nước công nhận. Kết thúc lộ trình, học viên nhận Giấy xác nhận hoàn thành và hồ sơ tiến độ học tập của Bên A — đây là ghi nhận quá trình học, không phải chứng chỉ do cơ quan nhà nước hoặc tổ chức khảo thí cấp.'),

  dieu(9, 'Giải quyết tranh chấp'),
  p('Hai bên ưu tiên trao đổi, thương lượng trên tinh thần thiện chí. Trường hợp không đạt được thoả thuận, tranh chấp được giải quyết theo quy định của Bộ luật Dân sự 2015 và pháp luật Việt Nam hiện hành.', { after: 140 }),

  dieu(10, 'Điều khoản chung'),
  gach('Thoả thuận có hiệu lực kể từ ngày ký, hoặc kể từ ngày xác nhận qua email/Zalo nếu hai bên đồng ý hình thức này; lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản.'),
  gach('Mọi sửa đổi, bổ sung phải được lập thành văn bản và có xác nhận của cả hai bên.'),
  gach('Hai bên đã đọc, hiểu rõ nội dung và tự nguyện ký kết Thoả thuận này.'),

  p('', { after: 200 }),
  oDien('Ngày ký'),
  p('', { after: 200 }),
  kyTen('HỌC VIÊN (nếu từ 18 tuổi)', 'PHỤ HUYNH / NGƯỜI GIÁM HỘ'),
])

// =================================================== 2. THOẢ THUẬN GIÁO VIÊN

const BANG_GIAO_TIEP = [
  ['1 kèm 1', '60 phút', '120.000 đ'],
  ['1 kèm 2', '60 phút', '140.000 đ'],
  ['1 kèm 3', '60 phút', '160.000 đ'],
  ['1 kèm 4', '60 phút', '180.000 đ'],
  ['1 kèm 5', '75 phút', '200.000 đ'],
  ['1 kèm 6', '75 phút', '220.000 đ'],
]
const BANG_IELTS = [
  ['1 kèm 1', '60 phút', '150.000 đ'],
  ['1 kèm 2', '60 phút', '170.000 đ'],
  ['1 kèm 3', '60 phút', '190.000 đ'],
  ['1 kèm 4', '60 phút', '210.000 đ'],
  ['1 kèm 5', '75 phút', '230.000 đ'],
  ['1 kèm 6', '75 phút', '250.000 đ'],
]

const giaoVien = taiLieu([
  ...bia('THOẢ THUẬN CỘNG TÁC GIẢNG DẠY',
         'Thoả thuận cung cấp dịch vụ giảng dạy tiếng Anh trực tuyến'),

  p('THOẢ THUẬN CỘNG TÁC GIẢNG DẠY', { bold: true, size: 28, color: NAVY,
    align: AlignmentType.CENTER, after: 240 }),
  p('Căn cứ Bộ luật Dân sự số 91/2015/QH13; căn cứ nhu cầu hợp tác giảng dạy thực tế và sự thoả thuận tự nguyện của hai bên. Cảm ơn Thầy/Cô đã tin tưởng đồng hành cùng Ms.Ngọc Elite English — hai bên gồm:', { after: 220 }),

  ...khoiBenA(),

  p('BÊN B — CỘNG TÁC VIÊN GIẢNG DẠY (“CTV”)', { bold: true, color: NAVY }),
  oDien('Họ và tên'),
  oDien('Ngày sinh'),
  oDien('CCCD/Hộ chiếu số'),
  oDien('Địa chỉ thường trú'),
  oDien('Số điện thoại'),
  oDien('Email'),
  oDien('Mã số thuế cá nhân (nếu có)'),
  oDien('Số tài khoản ngân hàng nhận thù lao'),

  dieu(1, 'Nội dung hợp tác'),
  gach('Bên B nhận giảng dạy tiếng Anh trực tuyến cho học viên của MNEE theo lớp được Bên A phân công, thuộc chương trình Kids Communication (nền Kid’s Box), Adult Communication (nền Speak Now) và/hoặc IELTS.'),
  gach('Bên B điều chỉnh giáo án theo Curriculum Map và mẫu lesson plan chuẩn của MNEE, không tự ý thay đổi nội dung giáo trình gốc.'),
  gach('Bên B viết báo cáo sau mỗi buổi học và gửi trong vòng 24 giờ kể từ khi kết thúc buổi dạy, nêu cụ thể học viên làm được gì và còn yếu ở đâu; không viết chung chung.'),
  gach('Bên B tham gia đầy đủ các buổi họp chuyên môn và coaching định kỳ do Bên A tổ chức.'),
  oDien('Chương trình / lớp cụ thể được phân công'),
  oDien('Số buổi dạy dự kiến mỗi tuần'),

  dieu(2, 'Thời hạn thoả thuận'),
  p('Thoả thuận có hiệu lực kể từ ngày ký, theo hình thức không xác định thời hạn, duy trì liên tục theo từng lớp được phân công cho đến khi một trong hai bên chấm dứt theo Điều 8. Khi có thay đổi về lớp, thù lao hoặc phạm vi công việc, hai bên xác nhận bằng Phụ lục có chữ ký của cả hai bên.', { after: 140 }),

  dieu(3, 'Thù lao và phương thức thanh toán'),
  p('Thù lao tính theo buổi dạy thực tế đã hoàn thành, theo bảng dưới đây. Mức áp dụng như nhau với giáo viên Việt Nam và giáo viên Philippines.', { after: 160 }),
  p('Lớp giao tiếp (trẻ em và người lớn)', { bold: true, size: 22, after: 100 }),
  bang(['Sĩ số lớp', 'Thời lượng', 'Thù lao / buổi'], BANG_GIAO_TIEP, [3000, 3000, 3000]),
  p('', { after: 140 }),
  p('Lớp IELTS', { bold: true, size: 22, after: 100 }),
  bang(['Sĩ số lớp', 'Thời lượng', 'Thù lao / buổi'], BANG_IELTS, [3000, 3000, 3000]),
  p('', { after: 140 }),
  gach('Quy tắc chung: lớp 1 kèm 1 hưởng mức nền; mỗi học viên tăng thêm cộng 20.000 đồng vào thù lao buổi dạy.'),
  gach('Lớp từ 5 đến 6 học viên bắt buộc dạy 75 phút; thù lao đã tính theo thời lượng này.'),
  gach('Thù lao của các buổi đã hoàn thành trong tháng được thanh toán vào ngày 03 của tháng liền kề, qua chuyển khoản đến tài khoản Bên B đã đăng ký.'),
  gach('Bên A khấu trừ 10% thuế thu nhập cá nhân tại nguồn trước khi chi trả nếu một lần chi trả từ 2.000.000 đồng trở lên, trừ khi Bên B có văn bản cam kết đủ điều kiện miễn khấu trừ theo quy định pháp luật hiện hành và tự chịu trách nhiệm về tính chính xác của cam kết đó.'),
  gach('Bên B tự kê khai, quyết toán thuế thu nhập cá nhân theo quy định của pháp luật hiện hành.'),
  p('Trường hợp lớp có mức thù lao riêng khác bảng trên, mức đó được ghi rõ trong Phụ lục Thù lao và có chữ ký xác nhận của cả hai bên.', { italics: true, size: 20, color: '555555', after: 140 }),

  dieu(4, 'Chính sách huỷ buổi dạy'),
  gach('Bên B thông báo cho Bên A và học viên/phụ huynh tối thiểu 24 giờ trước giờ dạy nếu không thể dạy theo lịch đã xác nhận.'),
  gach('Nếu thông báo huỷ dưới 24 giờ mà không thuộc trường hợp bất khả kháng (ốm đau đột xuất có minh chứng, tai nạn, sự cố y tế khẩn cấp, thiên tai), Bên A trừ 50% thù lao của buổi dạy đó và ghi nhận vào hồ sơ đánh giá cộng tác viên.'),
  gach('Vi phạm việc báo huỷ đột xuất từ 03 lần trở lên trong 02 tháng liên tục, Bên A có quyền tạm ngưng phân lớp hoặc chấm dứt Thoả thuận theo Điều 8.'),

  dieu(5, 'Bảo mật thông tin'),
  gach('Bên B bảo mật tuyệt đối thông tin cá nhân của học viên, phụ huynh, nội dung giáo án và dữ liệu vận hành nội bộ (Curriculum Map, hồ sơ học viên, báo cáo, thông tin học phí) mà Bên B được tiếp cận trong quá trình hợp tác.'),
  gach('Bên B không sao chép, chia sẻ hoặc sử dụng các thông tin nêu trên cho bất kỳ mục đích nào ngoài phạm vi công việc được giao, kể cả sau khi Thoả thuận chấm dứt.'),
  gach('Đối với học viên dưới 18 tuổi: Bên B tuân thủ quy định về bảo vệ dữ liệu cá nhân trẻ em theo Nghị định 13/2023/NĐ-CP; không tự ý ghi hình, chụp ảnh, quay video hoặc chia sẻ hình ảnh, thông tin của học viên trẻ em lên mạng xã hội cá nhân hoặc bất kỳ nền tảng nào khi chưa có sự đồng ý bằng văn bản của Bên A và phụ huynh/người giám hộ.'),

  dieu(6, 'Quyền sở hữu tài liệu và dữ liệu buổi học'),
  p('6.1. Tài liệu giảng dạy.', { bold: true, size: 22, after: 60 }),
  gach('Mọi giáo án, slide, bài tập, tài liệu do Bên B soạn thảo hoặc điều chỉnh trong quá trình hợp tác, dựa trên Curriculum Map và mẫu chuẩn của MNEE, thuộc quyền sử dụng của Bên A để phục vụ vận hành chung.'),
  gach('Bên B được sử dụng các tài liệu này để giảng dạy trong thời gian hợp tác với Bên A; không sử dụng cho mục đích thương mại riêng hoặc mang sang giảng dạy tại đơn vị/cá nhân khác.'),
  p('6.2. Dữ liệu buổi học.', { bold: true, size: 22, after: 60 }),
  gach('Báo cáo buổi học, nhận xét học viên, bảng theo dõi tiến độ, bản ghi hình lớp học và mọi hồ sơ học tập phát sinh trong quá trình hợp tác THUỘC SỞ HỮU CỦA BÊN A.'),
  gach('Bên B tạo và lưu các tài liệu này trong hệ thống hoặc thư mục do Bên A chỉ định và sở hữu. Bên B không lưu bản duy nhất trên tài khoản cá nhân của mình.'),
  gach('Bên B không xoá, không di chuyển, không chuyển quyền sở hữu và không thu hồi quyền truy cập của Bên A đối với các dữ liệu nêu trên, trong mọi trường hợp, kể cả sau khi Thoả thuận chấm dứt.'),
  gach('Bản ghi hình lớp học chỉ được xoá khi có xác nhận bằng văn bản của Bên A, và không sớm hơn 12 tháng kể từ ngày buổi học diễn ra.'),
  p('6.3. Bàn giao khi chấm dứt.', { bold: true, size: 22, after: 60 }),
  gach('Trong vòng 07 ngày làm việc kể từ ngày chấm dứt Thoả thuận, Bên B bàn giao đầy đủ cho Bên A toàn bộ dữ liệu buổi học còn đang lưu giữ và chuyển quyền sở hữu các tệp, thư mục liên quan sang tài khoản do Bên A chỉ định.'),

  dieu(7, 'Cam kết không lôi kéo học viên'),
  p('Trong thời gian hợp tác và trong vòng 06 tháng kể từ ngày Thoả thuận chấm dứt, Bên B cam kết không trực tiếp hoặc gián tiếp nhận dạy kèm, dạy riêng, hoặc giới thiệu học viên đã/đang học tại MNEE mà Bên B biết được thông qua quá trình hợp tác sang bất kỳ hình thức giảng dạy nào khác ngoài hệ thống MNEE, trừ khi có thoả thuận bằng văn bản với Bên A. Nếu vi phạm, Bên B có trách nhiệm bồi thường thiệt hại thực tế phát sinh cho Bên A theo thoả thuận giữa hai bên hoặc theo quy định của pháp luật dân sự hiện hành.', { after: 140 }),

  dieu(8, 'Chấm dứt thoả thuận'),
  gach('Mỗi bên có quyền đơn phương chấm dứt Thoả thuận bằng thông báo bằng văn bản (email/tin nhắn có xác nhận) trước tối thiểu 15 ngày làm việc.'),
  gach('Bên A có quyền chấm dứt ngay lập tức, không cần báo trước, nếu Bên B vi phạm nghiêm trọng một trong các trường hợp: vi phạm bảo mật thông tin học viên (Điều 5), vi phạm quyền sở hữu dữ liệu buổi học (Điều 6.2), vi phạm cam kết không lôi kéo học viên (Điều 7), có hành vi ảnh hưởng đến an toàn hoặc tâm lý học viên, hoặc vi phạm chính sách huỷ buổi dạy từ 03 lần trở lên trong 02 tháng (Điều 4).'),
  gach('Khi chấm dứt, Bên A thanh toán đầy đủ thù lao cho các buổi dạy đã hoàn thành trong vòng 15 ngày làm việc kể từ ngày chấm dứt.'),

  dieu(9, 'Giải quyết tranh chấp'),
  p('Hai bên ưu tiên thương lượng, hoà giải trên tinh thần thiện chí. Trường hợp không đạt được thoả thuận, tranh chấp được giải quyết theo quy định của Bộ luật Dân sự 2015 và pháp luật Việt Nam hiện hành, tại cơ quan có thẩm quyền nơi Bên A cư trú.', { after: 140 }),

  dieu(10, 'Điều khoản chung'),
  gach('Thoả thuận có hiệu lực kể từ ngày ký, lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản; hoặc được xác nhận qua email/Zalo có lưu vết nếu hai bên đồng ý thay thế bản giấy.'),
  gach('Mọi sửa đổi, bổ sung phải được lập thành văn bản (Phụ lục) và có xác nhận của cả hai bên.'),
  gach('Hai bên đã đọc, hiểu rõ và tự nguyện ký kết Thoả thuận này.'),

  p('', { after: 200 }),
  oDien('Ngày ký'),
  p('', { after: 200 }),
  kyTen('CỘNG TÁC VIÊN (BÊN B)'),

  new Paragraph({ pageBreakBefore: true, spacing: { after: 160 },
    children: [new TextRun({ text: 'Phụ lục — Thù lao áp dụng cho Bên B', bold: true, size: 26, color: NAVY, font: 'Calibri' })] }),
  oDien('Chương trình giảng dạy'),
  oDien('Sĩ số lớp được phân công'),
  oDien('Thời lượng mỗi buổi'),
  oDien('Mức thù lao mỗi buổi'),
  oDien('Ngày bắt đầu áp dụng'),
  p('Phụ lục này được cập nhật mỗi khi có thay đổi về lớp hoặc mức thù lao, có chữ ký xác nhận của cả hai bên và đính kèm Thoả thuận gốc.', { italics: true, size: 20, color: '555555', after: 200 }),
  p('', { after: 300 }),
  kyTen('CỘNG TÁC VIÊN (BÊN B)'),
])

// ------------------------------------------------------------------- xuất

async function xuat(doc, ten) {
  const buf = await Packer.toBuffer(doc)
  const duong_dan = path.join(RA_DIR, ten)
  fs.writeFileSync(duong_dan, buf)
  console.log(`${ten}  —  ${(buf.length / 1024).toFixed(1)} KB`)
}

;(async () => {
  await xuat(hocVien,  'OPS_ThoaThuanDangKyChuongTrinhHoc_V1.2_2026-09-16.docx')
  await xuat(giaoVien, 'OPS_ThoaThuanCongTacVienGiangDay_V1.2_2026-09-16.docx')
})()
