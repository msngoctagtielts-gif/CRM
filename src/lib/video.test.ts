/**
 * Kiểm thử phần đọc link bản ghi.
 *
 *     npm run test:unit
 *
 * Trọng tâm: KHÔNG được đọc nhầm một đường dẫn lạ thành mã video, vì hậu quả là
 * một khung nhúng trắng trơn trên màn hình báo cáo mà không ai hiểu vì sao.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { docBanGhi, docVideoId, giayTuMoc, linkNhung, loaiVideo } from './video.ts'

test('đọc được mã video từ mọi dạng link trung tâm đang dùng', () => {
  assert.equal(docVideoId('https://youtu.be/0gjG_Ts7rKY'), '0gjG_Ts7rKY')
  assert.equal(docVideoId('https://www.youtube.com/watch?v=0gjG_Ts7rKY'), '0gjG_Ts7rKY')
  assert.equal(docVideoId('https://www.youtube.com/watch?t=30&v=0gjG_Ts7rKY'), '0gjG_Ts7rKY')
  assert.equal(docVideoId('https://www.youtube.com/embed/0gjG_Ts7rKY'), '0gjG_Ts7rKY')
  assert.equal(docVideoId('https://youtu.be/0gjG_Ts7rKY?t=42'), '0gjG_Ts7rKY')
})

test('mã không đúng 11 ký tự thì KHÔNG nhận — tránh khung nhúng hỏng', () => {
  assert.equal(docVideoId('https://youtu.be/abc'), null)
  assert.equal(docVideoId('https://youtu.be/0gjG_Ts7rKYqua_dai_roi'), null)
})

test('link Zoom Clips nhận đúng là zoom, không phải youtube', () => {
  const u =
    'https://us06web.zoom.us/rec/share/Ci3UQ7628XMBC9oANUzrbEsHKwxenWpJVho887Y8yE0Yz7BXwQXS3Qs6TEC5ZcVL.Fv4KGxbHs2oKOCQR'
  assert.equal(loaiVideo(u), 'zoom')
  assert.equal(docVideoId(u), null)
  assert.equal(docBanGhi(u)?.loai, 'zoom')
})

test('chuỗi rỗng hoặc không phải http thì bỏ qua', () => {
  assert.equal(docBanGhi(''), null)
  assert.equal(docBanGhi(null), null)
  assert.equal(docBanGhi('youtu.be/0gjG_Ts7rKY'), null)
})

test('link nhúng dùng youtube-nocookie — video có mặt và giọng trẻ em', () => {
  assert.ok(linkNhung('0gjG_Ts7rKY').startsWith('https://www.youtube-nocookie.com/embed/'))
  assert.ok(!linkNhung('0gjG_Ts7rKY').includes('start='))
})

test('có mốc thời gian thì link nhúng mở đúng khoảnh khắc đó', () => {
  assert.ok(linkNhung('0gjG_Ts7rKY', 723).includes('start=723'))
  assert.ok(!linkNhung('0gjG_Ts7rKY', 0).includes('start='))
  assert.ok(!linkNhung('0gjG_Ts7rKY', null).includes('start='))
})

test('đọc mốc thời gian dạng mm:ss và hh:mm:ss', () => {
  assert.equal(giayTuMoc('12:03'), 723)
  assert.equal(giayTuMoc('1:02:30'), 3750)
  assert.equal(giayTuMoc('khong phai moc'), null)
  assert.equal(giayTuMoc('00:00'), null)
})
