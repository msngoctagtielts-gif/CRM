import { test } from 'node:test'
import assert from 'node:assert/strict'
import { locGhiChuNoiBo, laDongNoiBo } from './bao-cao-in.ts'

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
