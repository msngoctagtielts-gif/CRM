import { test } from 'node:test'
import assert from 'node:assert/strict'
import { locGhiChuNoiBo, laDongNoiBo, boMocThoiGian as locBo } from './bao-cao-in.ts'

test('không có gì để lọc thì giữ nguyên', () => {
  const t = '1. Luyện âm cuối /t/.\n2. Học 5 từ quần áo.'
  assert.equal(locGhiChuNoiBo(t), t)
})

test('rỗng và null trả về chuỗi rỗng', () => {
  assert.equal(locGhiChuNoiBo(''), '')
  assert.equal(locGhiChuNoiBo(null), '')
  assert.equal(locGhiChuNoiBo(undefined), '')
  assert.equal(locGhiChuNoiBo('   \n  '), '')
})

test('cắt mục GHI CHU CHO FOUNDER nhưng giữ mục sau nó', () => {
  const t = [
    '1. Luyện âm cuối /t/.',
    '2. Học 5 từ quần áo.',
    '3. GHI CHU CHO FOUNDER — buoi nay chay 56/75 phut,',
    '   can kiem lai thoi luong chuan trong he thong.',
    '4. Giữ nguyên cách cho chuẩn bị rồi nói lại.',
  ].join('\n')
  const kq = locGhiChuNoiBo(t)
  assert.ok(kq.includes('Luyện âm cuối'))
  assert.ok(kq.includes('Giữ nguyên cách cho chuẩn bị'))
  assert.ok(!kq.includes('FOUNDER'))
  assert.ok(!kq.includes('56/75'), 'dòng tiếp nối của mục nội bộ cũng phải bị cắt')
})

test('cắt mục CAN FOUNDER XU LY TRUOC ở đầu danh sách', () => {
  const t = [
    '1. CAN FOUNDER XU LY TRUOC: hai viec ve nguoi day.',
    '2. Về chuyên môn, luyện phát âm cụm phụ âm đầu.',
  ].join('\n')
  const kq = locGhiChuNoiBo(t)
  assert.equal(kq, '2. Về chuyên môn, luyện phát âm cụm phụ âm đầu.')
})

test('cắt đoạn NHAY CAM tách bằng dòng trống', () => {
  const t = [
    'Điểm mạnh của em rất rõ.',
    '',
    'NHAY CAM — CAN CHAM SOC: hoc vien dang gap bien co gia dinh.',
    'De nghi Founder theo doi.',
    '',
    'Buổi sau nên giữ nguyên cách dạy này.',
  ].join('\n')
  const kq = locGhiChuNoiBo(t)
  assert.ok(kq.includes('Điểm mạnh của em rất rõ.'))
  assert.ok(kq.includes('Buổi sau nên giữ nguyên'))
  assert.ok(!kq.includes('bien co gia dinh'))
  assert.ok(!kq.includes('De nghi Founder'))
})

test('cắt GHI CHU KY THUAT về chất lượng transcript', () => {
  const t = [
    'LUU Y KY THUAT: transcript buoi nay bi lan nhan nguoi noi.',
    '',
    'Nội dung buổi học: Lesson 3 — personality.',
  ].join('\n')
  assert.equal(locGhiChuNoiBo(t), 'Nội dung buổi học: Lesson 3 — personality.')
})

test('nhận dạng không phụ thuộc dấu và hoa thường', () => {
  assert.ok(laDongNoiBo('GHI CHÚ CHO FOUNDER — lương tháng 9'))
  assert.ok(laDongNoiBo('ghi chu cho founder'))
  assert.ok(laDongNoiBo('4. Cần Founder xác nhận giáo viên'))
  assert.ok(laDongNoiBo('  6. GHI CHU FOUNDER: si so khong khop'))
})

test('không cắt nhầm câu chỉ nhắc tên Founder ở giữa dòng', () => {
  const t = 'Em đề nghị cô báo phụ huynh, vì đây là lần thứ ba Founder phải nhắc.'
  assert.equal(locGhiChuNoiBo(t), t)
})

test('không cắt nhầm mục nói về giáo viên mà không phải ghi chú nội bộ', () => {
  const t = '3. Giáo viên nên rút ngắn small talk xuống 5 phút.'
  assert.equal(locGhiChuNoiBo(t), t)
})

test('cắt liên tiếp nhiều mục nội bộ', () => {
  const t = [
    '1. Việc chuyên môn A.',
    '2. CAN FOUNDER XAC NHAN giao vien.',
    '3. GHI CHU CHO FOUNDER — thoi luong chuan.',
    '4. Việc chuyên môn B.',
  ].join('\n')
  assert.equal(locGhiChuNoiBo(t), '1. Việc chuyên môn A.\n4. Việc chuyên môn B.')
})

test('toàn bộ là ghi chú nội bộ thì trả về rỗng', () => {
  assert.equal(locGhiChuNoiBo('GHI CHU CHO FOUNDER — chi tiet luong.'), '')
})

/* ---------- bỏ mốc thời gian trước khi gửi phụ huynh ---------- */

test('bỏ mốc trong ngoặc', () => {
  assert.equal(
    locBo('"My mom doesn\'t like to go out." (25:10)'),
    '"My mom doesn\'t like to go out."',
  )
})

test('bỏ mốc mở đầu dòng có gạch đầu dòng', () => {
  const t = '- 31:08 — vào bài. Cô hỏi về tính cách.\n- 42:15 — cô chốt bộ từ vựng.'
  assert.equal(locBo(t), '- vào bài. Cô hỏi về tính cách.\n- cô chốt bộ từ vựng.')
})

test('bỏ khoảng thời gian', () => {
  assert.equal(locBo('Đoạn 19:57–31:01 là phần nói chuyện ngoài bài.'),
    'là phần nói chuyện ngoài bài.')
  assert.equal(locBo('Từ 59:00 đến 01:01:26 em tự kể về gia đình.'),
    'em tự kể về gia đình.')
})

test('bỏ mốc có giới từ đứng trước', () => {
  assert.equal(locBo('Cô sửa lại tại 36:05 và em nhắc lại đúng.'),
    'Cô sửa lại và em nhắc lại đúng.')
})

test('bỏ mốc mở đầu mệnh đề giữa câu', () => {
  assert.equal(locBo('27:03 em nói "a big grain"; 27:26 cô sửa thành "heavy rain".'),
    'em nói "a big grain"; cô sửa thành "heavy rain".')
})

test('không đụng vào số không phải mốc', () => {
  const t = 'Em nói được 5 từ mới và giữ mạch 2,5 phút.'
  assert.equal(locBo(t), t)
  assert.equal(locBo('Học phí 250.000 đ mỗi buổi 60 phút.'),
    'Học phí 250.000 đ mỗi buổi 60 phút.')
})

test('giữ nguyên nội dung tiếng Anh của học viên', () => {
  const t = '"I am the baby of my family" và "I have an older brother".'
  assert.equal(locBo(t), t)
})

test('rỗng và null trả về chuỗi rỗng', () => {
  assert.equal(locBo(''), '')
  assert.equal(locBo(null), '')
})

test('bỏ cả cụm nhiều mốc nằm trong một ngoặc', () => {
  // Lỗi thật đã lọt vào bản in của Nhi ngày 25/09/2026: quy tắc cũ chỉ bắt
  // ngoặc chứa MỘT mốc, nên "(17:43, 22:10, 30:05)" bị gỡ lẻ thành "(17:43,)".
  assert.equal(
    locBo('Các đoạn Nhi đọc to (17:43, 22:10, 30:05) đều nghe chưa rõ.'),
    'Các đoạn Nhi đọc to đều nghe chưa rõ.',
  )
  assert.equal(locBo('Xem lại (05:10; 09:22) để nghe.'), 'Xem lại để nghe.')
  assert.equal(locBo('Nghe lại (1:02:30 và 1:05:00).'), 'Nghe lại.')
  // Không được ăn lem chữ trong ngoặc không phải mốc.
  assert.equal(locBo('Bài này (Unit 5) khá dài.'), 'Bài này (Unit 5) khá dài.')
})
