/**
 * Bài tự đánh giá "Thấu hiểu người học" — tám câu.
 *
 * Cách chấm cố ý đơn giản và **mở**: mỗi lựa chọn cộng điểm cho một hoặc vài
 * chân dung, chân dung nào cao điểm nhất thì thắng. Không có công thức giấu.
 * Ai muốn kiểm chứng thì đọc đúng file này là thấy hết.
 *
 * Câu 1 là câu định tuyến cứng: chọn "con tôi" thì ra thẳng chân dung phụ
 * huynh, vì người ngồi đọc kết quả khi đó không phải người học.
 *
 * File này không import gì để chạy được bằng `node --test`.
 */

import type { MaChanDung } from './chan-dung'

export type LuaChon = {
  ma: string
  nhan: string
  diem: Partial<Record<MaChanDung, number>>
}

export type CauHoi = {
  ma: string
  cau: string
  /** Vì sao hỏi câu này — hiện trên trang để người trả lời không thấy bị dò xét. */
  viSaoHoi: string
  luaChon: LuaChon[]
}

export const CAU_HOI: CauHoi[] = [
  {
    ma: 'nguoi_hoc',
    cau: 'Ai là người sẽ học?',
    viSaoHoi: 'Người lớn tự học và phụ huynh chọn cho con cần hai loại lời khuyên khác hẳn nhau.',
    luaChon: [
      { ma: 'toi', nhan: 'Tôi học', diem: {} },
      { ma: 'con', nhan: 'Con tôi học', diem: { phu_huynh: 100 } },
    ],
  },
  {
    ma: 'muc_tieu',
    cau: 'Điều gần nhất bạn muốn làm được bằng tiếng Anh?',
    viSaoHoi: 'Mục tiêu quyết định giáo trình. Người cần thi và người cần nói chuyện học hai thứ khác nhau.',
    luaChon: [
      { ma: 'cong_viec', nhan: 'Nói chuyện được trong công việc', diem: { ngai_noi: 2, ban_ron: 2 } },
      { ma: 'doi_song', nhan: 'Nói chuyện được trong đời sống, đi du lịch', diem: { ngai_noi: 2, mat_goc: 1 } },
      { ma: 'ielts', nhan: 'Đạt một mức điểm IELTS cụ thể', diem: { ielts_gap: 4 } },
      { ma: 'lai_tu_dau', nhan: 'Lấy lại từ đầu, hiện giờ gần như không dùng được', diem: { mat_goc: 4 } },
    ],
  },
  {
    ma: 'cam_giac',
    cau: 'Khi phải nói tiếng Anh với người lạ, cảm giác đầu tiên của bạn là gì?',
    viSaoHoi: 'Đây là câu quan trọng nhất. Nó tách "không biết" khỏi "biết mà không bật ra được".',
    luaChon: [
      { ma: 'nghen', nhan: 'Biết từ, hiểu câu, nhưng không bật ra được', diem: { ngai_noi: 4 } },
      { ma: 'so', nhan: 'Sợ nói sai, sợ người ta cười', diem: { so_sai: 4 } },
      { ma: 'trong', nhan: 'Trong đầu trống, không nghĩ ra được từ nào', diem: { mat_goc: 3 } },
      { ma: 'binh_thuong', nhan: 'Nói được, chỉ thấy mình chưa chính xác', diem: { ielts_gap: 2, ngai_noi: 1 } },
    ],
  },
  {
    ma: 'lan_truoc',
    cau: 'Lần học tiếng Anh gần nhất của bạn dừng lại vì điều gì?',
    viSaoHoi: 'Lý do bỏ dở lần trước thường chính là thứ sẽ làm bạn bỏ dở lần này.',
    luaChon: [
      { ma: 'het_gio', nhan: 'Hết thời gian, công việc chen vào', diem: { ban_ron: 4 } },
      { ma: 'khong_tien_bo', nhan: 'Học mãi không thấy khá hơn', diem: { mat_goc: 2, ngai_noi: 2 } },
      { ma: 'lop_dong', nhan: 'Lớp đông, ngại nói, thành ra ngồi im', diem: { so_sai: 4 } },
      { ma: 'chua_tung', nhan: 'Chưa từng học lại sau khi rời ghế nhà trường', diem: { mat_goc: 2 } },
    ],
  },
  {
    ma: 'thoi_gian',
    cau: 'Thật lòng, mỗi tuần bạn có bao nhiêu thời gian cho việc này?',
    viSaoHoi: 'Hỏi con số thật, không hỏi con số mong muốn. Kế hoạch lập trên con số mong muốn thì luôn đổ.',
    luaChon: [
      { ma: 'rat_it', nhan: 'Dưới 1 giờ', diem: { ban_ron: 4 } },
      { ma: 'it', nhan: '1 tới 2 giờ', diem: { ban_ron: 2 } },
      { ma: 'vua', nhan: '3 tới 4 giờ', diem: {} },
      { ma: 'nhieu', nhan: 'Trên 4 giờ', diem: { ielts_gap: 1 } },
    ],
  },
  {
    ma: 'von_tu',
    cau: 'Mô tả nào đúng nhất với bạn hiện giờ?',
    viSaoHoi: 'Để biết nên bắt đầu từ âm, từ vốn từ, hay từ phản xạ.',
    luaChon: [
      { ma: 'khong_nho', nhan: 'Nhìn chữ còn không chắc đọc thế nào', diem: { mat_goc: 4 } },
      { ma: 'doc_hieu', nhan: 'Đọc hiểu được, nói thì không', diem: { ngai_noi: 3 } },
      { ma: 'nghe_phim', nhan: 'Nghe phim hiểu được kha khá', diem: { ngai_noi: 1, ielts_gap: 1 } },
      { ma: 'dung_duoc', nhan: 'Dùng được trong công việc, muốn chuẩn hơn', diem: { ielts_gap: 2 } },
    ],
  },
  {
    ma: 'han_chot',
    cau: 'Bạn có hạn chót nào không?',
    viSaoHoi: 'Có hạn chót thì cách học phải đổi hoàn toàn: đo trước, dồn vào chỗ yếu nhất.',
    luaChon: [
      { ma: 'gap', nhan: 'Có, dưới 3 tháng', diem: { ielts_gap: 4, ban_ron: 1 } },
      { ma: 'co', nhan: 'Có, khoảng 3 tới 6 tháng', diem: { ielts_gap: 2 } },
      { ma: 'khong', nhan: 'Không, tôi học lâu dài', diem: {} },
    ],
  },
  {
    ma: 'noi_dung_thich',
    cau: 'Bạn muốn học bằng nội dung nào?',
    viSaoHoi: 'Ngôn ngữ đi vào đầu nhanh hơn khi nó chở thứ bạn vốn đã quan tâm.',
    luaChon: [
      { ma: 'phim_nhac', nhan: 'Phim, nhạc, chuyện đời thường', diem: { ngai_noi: 1, so_sai: 1 } },
      { ma: 'cong_viec', nhan: 'Công việc, cuộc họp, email', diem: { ban_ron: 2 } },
      { ma: 'du_lich', nhan: 'Du lịch, giao tiếp hằng ngày', diem: { mat_goc: 1, ngai_noi: 1 } },
      { ma: 'hoc_thuat', nhan: 'Học thuật, thi cử', diem: { ielts_gap: 2 } },
    ],
  },
]

export type CauTraLoi = Record<string, string>

/**
 * Chấm bài. Hoà điểm thì lấy chân dung đứng trước trong `THU_TU_UU_TIEN` —
 * cố định để cùng một bộ câu trả lời luôn ra cùng một kết quả.
 */
const THU_TU_UU_TIEN: MaChanDung[] = [
  'phu_huynh',
  'ielts_gap',
  'mat_goc',
  'so_sai',
  'ban_ron',
  'ngai_noi',
]

export function chamBai(traLoi: CauTraLoi): MaChanDung {
  const diem = new Map<MaChanDung, number>()

  for (const cauHoi of CAU_HOI) {
    const daChon = traLoi[cauHoi.ma]
    if (!daChon) continue
    const luaChon = cauHoi.luaChon.find((l) => l.ma === daChon)
    if (!luaChon) continue
    for (const [ma, d] of Object.entries(luaChon.diem)) {
      diem.set(ma as MaChanDung, (diem.get(ma as MaChanDung) ?? 0) + d)
    }
  }

  let thang: MaChanDung = 'ngai_noi'
  let cao = -1
  for (const ma of THU_TU_UU_TIEN) {
    const d = diem.get(ma) ?? 0
    if (d > cao) {
      cao = d
      thang = ma
    }
  }
  // Không câu nào được trả lời thì không đoán bừa.
  return cao <= 0 ? 'ngai_noi' : thang
}

/** Đã trả lời hết chưa — câu "con tôi" thì chỉ cần câu đầu. */
export function daTraLoiDu(traLoi: CauTraLoi): boolean {
  if (traLoi.nguoi_hoc === 'con') return true
  return CAU_HOI.every((c) => Boolean(traLoi[c.ma]))
}

/** Các câu cần hiện — chọn "con tôi" thì dừng luôn, không hỏi tiếp. */
export function cauHoiCanHien(traLoi: CauTraLoi): CauHoi[] {
  if (traLoi.nguoi_hoc === 'con') return CAU_HOI.slice(0, 1)
  return CAU_HOI
}
