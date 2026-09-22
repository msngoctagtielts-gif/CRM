/**
 * Kiểm thử phần logic thuần của việc xác minh buổi học từ video.
 *
 *     npm run test:unit
 *
 * Trọng tâm không phải "hàm có chạy không" mà là: KHI MODEL TRẢ VỀ SỐ VÔ LÝ
 * THÌ HỆ THỐNG CÓ BỎ KHÔNG. Con số này dùng để đối chiếu với lời khai của giáo
 * viên — một số đo sai là nghi oan người dạy thật.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildXacMinhPrompt, locKetQuaVoLy, parseXacMinhJSON, XAC_MINH_RONG } from './xac-minh.ts'

test('đọc được JSON đầy đủ', () => {
  const kq = parseXacMinhJSON(
    JSON.stringify({
      phut_thuc_te: 52,
      phut_tong_video: 61,
      thoi_gian_hv_noi: 24,
      gian_doan: [{ tu: '12:03', den: '13:10', so_giay: 67, dien_ra_gi: 'học viên rời máy' }],
      khong_khi_lop: 'Học viên hỏi lại hai lần khi chưa rõ nghĩa.',
    }),
  )
  assert.equal(kq?.phut_thuc_te, 52)
  assert.equal(kq?.thoi_gian_hv_noi, 24)
  assert.equal(kq?.gian_doan.length, 1)
  assert.equal(kq?.gian_doan[0].dien_ra_gi, 'học viên rời máy')
})

test('bóc được JSON bị bọc trong ```json', () => {
  const kq = parseXacMinhJSON('```json\n{"phut_thuc_te": 30}\n```')
  assert.equal(kq?.phut_thuc_te, 30)
})

test('JSON hỏng thì trả null chứ không đoán', () => {
  assert.equal(parseXacMinhJSON('không phải JSON'), null)
  assert.equal(parseXacMinhJSON('[1,2,3]'), null)
})

test('số âm và chữ không phải số đều thành null, không thành 0', () => {
  const kq = parseXacMinhJSON(
    JSON.stringify({ phut_thuc_te: -5, phut_tong_video: 'không rõ', thoi_gian_hv_noi: null }),
  )
  assert.equal(kq?.phut_thuc_te, null)
  assert.equal(kq?.phut_tong_video, null)
  assert.equal(kq?.thoi_gian_hv_noi, null)
})

test('dòng gián đoạn thiếu số giây thì bỏ, không tự điền', () => {
  const kq = parseXacMinhJSON(
    JSON.stringify({ gian_doan: [{ tu: '01:00', den: '02:00' }, { so_giay: 45 }] }),
  )
  assert.equal(kq?.gian_doan.length, 1)
  assert.equal(kq?.gian_doan[0].so_giay, 45)
})

test('học thật dài hơn video thì BỎ số đó, không cắt cho vừa', () => {
  const { ketQua, daBo } = locKetQuaVoLy({
    ...XAC_MINH_RONG,
    phut_thuc_te: 90,
    phut_tong_video: 60,
  })
  assert.equal(ketQua.phut_thuc_te, null)
  assert.equal(ketQua.phut_tong_video, 60)
  assert.equal(daBo.length, 1)
})

test('học viên nói lâu hơn cả buổi học thì BỎ số đó', () => {
  const { ketQua, daBo } = locKetQuaVoLy({
    ...XAC_MINH_RONG,
    phut_thuc_te: 50,
    thoi_gian_hv_noi: 80,
  })
  assert.equal(ketQua.thoi_gian_hv_noi, null)
  assert.equal(ketQua.phut_thuc_te, 50)
  assert.ok(daBo[0].includes('học viên nói'))
})

test('gián đoạn dưới 30 giây bị loại — đó là nhịp nghỉ bình thường', () => {
  const { ketQua, daBo } = locKetQuaVoLy({
    ...XAC_MINH_RONG,
    gian_doan: [
      { tu: '01:00', den: '01:10', so_giay: 10, dien_ra_gi: 'im lặng' },
      { tu: '05:00', den: '06:30', so_giay: 90, dien_ra_gi: 'mất mạng' },
    ],
  })
  assert.equal(ketQua.gian_doan.length, 1)
  assert.equal(ketQua.gian_doan[0].so_giay, 90)
  assert.equal(daBo.length, 1)
})

test('kết quả hợp lệ thì không bỏ gì', () => {
  const { ketQua, daBo } = locKetQuaVoLy({
    phut_thuc_te: 52,
    phut_tong_video: 61,
    thoi_gian_hv_noi: 24,
    gian_doan: [{ tu: '12:03', den: '13:10', so_giay: 67, dien_ra_gi: 'rời máy' }],
    khong_khi_lop: 'ổn',
  })
  assert.deepEqual(daBo, [])
  assert.equal(ketQua.phut_thuc_te, 52)
})

test('lời nhắc nêu đúng số phút giáo viên khai, để máy biết đang đối chiếu với gì', () => {
  const p = buildXacMinhPrompt({
    className: 'Tân - Ms. Sheba',
    lessonDate: '2026-09-13',
    phutKhai: 60,
    videoUrls: ['https://youtu.be/abc'],
  })
  assert.ok(p.includes('60 phút'))
  assert.ok(p.includes('KHÔNG suy đoán'))
  assert.ok(p.includes('TRÊN 30 GIÂY'))
})

test('nhiều video thì lời nhắc dặn cộng dồn, không đo riêng lẻ', () => {
  const p = buildXacMinhPrompt({
    className: 'Vy - Ms. Sheba',
    lessonDate: '2026-09-17',
    phutKhai: null,
    videoUrls: ['https://youtu.be/a', 'https://youtu.be/b'],
  })
  assert.ok(p.includes('2 video'))
  assert.ok(p.includes('Cộng dồn'))
})
