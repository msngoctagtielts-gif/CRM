/**
 * Kiểm thử cách chấm bài tự đánh giá.
 *
 *     npm run test:unit
 *
 * Vì sao đáng kiểm: chấm sai thì người đọc nhận một lời khuyên không dành cho
 * mình, và họ sẽ không quay lại để báo là nó sai. Đây là kiểu lỗi im lặng.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CAU_HOI,
  chamBai,
  cauHoiCanHien,
  daTraLoiDu,
  type CauTraLoi,
} from './bai-tu-danh-gia.ts'

test('chọn "con tôi" thì ra thẳng chân dung phụ huynh, không cần trả lời tiếp', () => {
  const traLoi: CauTraLoi = { nguoi_hoc: 'con' }
  assert.equal(chamBai(traLoi), 'phu_huynh')
  assert.equal(daTraLoiDu(traLoi), true)
  assert.equal(cauHoiCanHien(traLoi).length, 1)
})

test('người lớn thì phải trả lời hết tám câu mới tính là xong', () => {
  assert.equal(daTraLoiDu({ nguoi_hoc: 'toi' }), false)
  assert.equal(cauHoiCanHien({ nguoi_hoc: 'toi' }).length, CAU_HOI.length)
})

test('biết nhiều mà nghẹn khi nói → ngai_noi', () => {
  assert.equal(
    chamBai({
      nguoi_hoc: 'toi',
      muc_tieu: 'doi_song',
      cam_giac: 'nghen',
      lan_truoc: 'khong_tien_bo',
      thoi_gian: 'vua',
      von_tu: 'doc_hieu',
      han_chot: 'khong',
      noi_dung_thich: 'phim_nhac',
    }),
    'ngai_noi',
  )
})

test('ngại vì lớp đông và sợ bị cười → so_sai', () => {
  assert.equal(
    chamBai({
      nguoi_hoc: 'toi',
      muc_tieu: 'doi_song',
      cam_giac: 'so',
      lan_truoc: 'lop_dong',
      thoi_gian: 'vua',
      von_tu: 'nghe_phim',
      han_chot: 'khong',
      noi_dung_thich: 'phim_nhac',
    }),
    'so_sai',
  )
})

test('hết giờ, dưới một tiếng mỗi tuần → ban_ron', () => {
  assert.equal(
    chamBai({
      nguoi_hoc: 'toi',
      muc_tieu: 'cong_viec',
      cam_giac: 'binh_thuong',
      lan_truoc: 'het_gio',
      thoi_gian: 'rat_it',
      von_tu: 'dung_duoc',
      han_chot: 'khong',
      noi_dung_thich: 'cong_viec',
    }),
    'ban_ron',
  )
})

test('nhìn chữ không đọc được, bắt đầu lại từ đầu → mat_goc', () => {
  assert.equal(
    chamBai({
      nguoi_hoc: 'toi',
      muc_tieu: 'lai_tu_dau',
      cam_giac: 'trong',
      lan_truoc: 'chua_tung',
      thoi_gian: 'vua',
      von_tu: 'khong_nho',
      han_chot: 'khong',
      noi_dung_thich: 'du_lich',
    }),
    'mat_goc',
  )
})

test('hạn chót dưới ba tháng cho IELTS → ielts_gap', () => {
  assert.equal(
    chamBai({
      nguoi_hoc: 'toi',
      muc_tieu: 'ielts',
      cam_giac: 'binh_thuong',
      lan_truoc: 'khong_tien_bo',
      thoi_gian: 'nhieu',
      von_tu: 'dung_duoc',
      han_chot: 'gap',
      noi_dung_thich: 'hoc_thuat',
    }),
    'ielts_gap',
  )
})

test('không trả lời gì thì không đoán bừa — trả về chân dung mặc định', () => {
  assert.equal(chamBai({}), 'ngai_noi')
})

test('đổi câu đầu từ "con tôi" sang "tôi" thì bộ câu hỏi mở lại đủ tám câu', () => {
  assert.equal(cauHoiCanHien({ nguoi_hoc: 'con' }).length, 1)
  assert.equal(cauHoiCanHien({ nguoi_hoc: 'toi' }).length, 8)
})

test('mọi mã lựa chọn trong một câu đều khác nhau', () => {
  for (const c of CAU_HOI) {
    const ma = c.luaChon.map((l) => l.ma)
    assert.equal(new Set(ma).size, ma.length, `câu ${c.ma} có mã lựa chọn trùng`)
  }
})

test('mọi câu hỏi đều có mã khác nhau và có lời giải thích vì sao hỏi', () => {
  const ma = CAU_HOI.map((c) => c.ma)
  assert.equal(new Set(ma).size, ma.length)
  for (const c of CAU_HOI) {
    assert.ok(c.viSaoHoi.length > 10, `câu ${c.ma} thiếu phần vì sao hỏi`)
  }
})
