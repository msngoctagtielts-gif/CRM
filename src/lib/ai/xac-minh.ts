/**
 * Xác minh buổi học từ video — phần thuần tuý, không chạm mạng.
 *
 * Tách khỏi `provider.ts` theo đúng kiểu `feedback.ts`: file này KHÔNG import
 * gì nên chạy thẳng được bằng `node --test`.
 *
 * VÌ SAO TÁCH KHỎI PHẦN SOẠN NHẬN XÉT
 *   Hai việc khác nhau về bản chất. Soạn nhận xét là VIẾT cho phụ huynh đọc —
 *   sai một chữ là mất lòng tin. Xác minh là ĐO — số phút thật, thời gian học
 *   viên nói, các lần gián đoạn. Kết quả của việc đo không gửi cho ai, chỉ để
 *   Founder đối chiếu với số giáo viên khai.
 *
 *   Trộn hai việc vào một lần gọi thì AI sẽ vừa đo vừa viết, và phần đo bị
 *   phần viết kéo cho "tròn" lại.
 */

export type GianDoan = {
  tu: string
  den: string
  so_giay: number
  dien_ra_gi: string
}

export type KetQuaXacMinh = {
  /** Số phút HỌC THẬT — đã trừ các khoảng chết trên 30 giây. */
  phut_thuc_te: number | null
  /** Độ dài toàn bộ video, kể cả khoảng chết. */
  phut_tong_video: number | null
  /** Số phút học viên nói (STT). Dùng đo lớp giao tiếp có đạt chuẩn không. */
  thoi_gian_hv_noi: number | null
  gian_doan: GianDoan[]
  khong_khi_lop: string
}

export const XAC_MINH_RONG: KetQuaXacMinh = {
  phut_thuc_te: null,
  phut_tong_video: null,
  thoi_gian_hv_noi: null,
  gian_doan: [],
  khong_khi_lop: '',
}

export type XacMinhInput = {
  className: string
  lessonDate: string
  /** Số phút giáo viên KHAI. Gửi kèm để AI biết đang đối chiếu với cái gì. */
  phutKhai: number | null
  videoUrls: string[]
}

/**
 * Lời nhắc viết bằng tiếng Việt vì Founder là người đọc kết quả.
 *
 * Ba chỗ cố ý viết chặt:
 *   · "KHÔNG suy đoán" đứng trước mọi trường — thà trả null còn hơn một con số
 *     nghe hợp lý mà sai, vì con số này dùng để đối chiếu với lời khai của
 *     giáo viên. Đo sai là nghi oan người dạy thật.
 *   · Gián đoạn chỉ tính trên 30 giây. Dưới ngưỡng đó là nhịp nghỉ bình thường
 *     của lớp học, đưa vào chỉ làm nhiễu.
 *   · Không khí lớp phải mô tả CÁI QUAN SÁT ĐƯỢC, cấm câu chung chung kiểu
 *     "lớp học sôi nổi" — câu đó đúng với mọi buổi nên không nói lên gì.
 */
export function buildXacMinhPrompt(input: XacMinhInput): string {
  const soVideo = input.videoUrls.length

  return [
    'Bạn đang XEM bản ghi một buổi học tiếng Anh online của trung tâm Ms.Ngọc Elite English.',
    'Nhiệm vụ của bạn là ĐO, không phải nhận xét và không phải khen.',
    '',
    'Thông tin buổi học:',
    `- Lớp: ${input.className}`,
    `- Ngày: ${input.lessonDate}`,
    input.phutKhai !== null ? `- Giáo viên khai dạy: ${input.phutKhai} phút` : null,
    soVideo > 1
      ? `- Buổi này có ${soVideo} video, là các phần nối tiếp nhau của CÙNG một buổi. Cộng dồn lại.`
      : null,
    '',
    'ĐO NĂM THỨ SAU. Mỗi thứ, nếu không đủ căn cứ thì trả null hoặc chuỗi rỗng.',
    'KHÔNG suy đoán, KHÔNG làm tròn cho đẹp, KHÔNG điền cho đủ.',
    '',
    '1. phut_thuc_te — số phút HỌC THẬT, đã trừ mọi khoảng chết trên 30 giây.',
    '2. phut_tong_video — độ dài toàn bộ video, kể cả khoảng chết.',
    '3. thoi_gian_hv_noi — tổng số phút HỌC VIÊN nói (không tính giáo viên nói).',
    '4. gian_doan — danh sách các lần dừng TRÊN 30 GIÂY. Mỗi lần ghi:',
    '   tu, den (dạng "mm:ss"), so_giay (số nguyên), dien_ra_gi (đang đợi điều gì:',
    '   mất mạng, học viên rời máy, giáo viên tìm tài liệu, im lặng không rõ lý do…).',
    '   Dưới 30 giây là nhịp nghỉ bình thường, ĐỪNG đưa vào.',
    '5. khong_khi_lop — 2 đến 4 câu tiếng Việt mô tả CÁI BẠN QUAN SÁT ĐƯỢC:',
    '   học viên chủ động hay chỉ trả lời khi được hỏi, có ngắt lời để hỏi lại không,',
    '   giáo viên chờ bao lâu trước khi nhắc, có lúc nào học viên mất tập trung.',
    '   CẤM những câu đúng với mọi buổi học ("lớp sôi nổi", "học viên tích cực",',
    '   "giáo viên nhiệt tình"). Nếu không xem được video thì trả chuỗi rỗng.',
    '',
    'Trả về DUY NHẤT một object JSON, không thêm chữ nào ngoài JSON:',
    '{"phut_thuc_te": number|null, "phut_tong_video": number|null,',
    ' "thoi_gian_hv_noi": number|null,',
    ' "gian_doan": [{"tu": "mm:ss", "den": "mm:ss", "so_giay": number, "dien_ra_gi": "..."}],',
    ' "khong_khi_lop": "..."}',
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
}

/** Đọc JSON model trả về. Sai định dạng thì trả null để bên gọi báo lỗi rõ. */
export function parseXacMinhJSON(text: string): KetQuaXacMinh | null {
  const raw = stripFence(text)
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  // MẢNG cũng lọt qua `typeof === 'object'`. Không chặn thì một câu trả lời
  // dạng [1,2,3] sẽ cho ra kết quả rỗng toàn null, và buổi học bị đánh dấu là
  // "đã xác minh" trong khi máy chưa đo được gì. Kiểm thử bắt được lỗi này.
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const o = value as Record<string, unknown>

  return {
    phut_thuc_te: soNguyenDuong(o.phut_thuc_te),
    phut_tong_video: soNguyenDuong(o.phut_tong_video),
    thoi_gian_hv_noi: soNguyenDuong(o.thoi_gian_hv_noi),
    gian_doan: docGianDoan(o.gian_doan),
    khong_khi_lop: typeof o.khong_khi_lop === 'string' ? o.khong_khi_lop.trim() : '',
  }
}

/**
 * Kiểm tra sau khi đọc: những chỗ vô lý thì BỎ, không sửa cho hợp.
 *
 * Ví dụ thời gian học viên nói lớn hơn cả buổi học — không có cách nào đúng,
 * nên bỏ hẳn con số đó thay vì cắt cho vừa. Cắt cho vừa là tạo ra một con số
 * trông hợp lý mà không ai đo được.
 */
export function locKetQuaVoLy(kq: KetQuaXacMinh): { ketQua: KetQuaXacMinh; daBo: string[] } {
  const daBo: string[] = []
  const out: KetQuaXacMinh = { ...kq, gian_doan: [...kq.gian_doan] }

  if (
    out.phut_thuc_te !== null &&
    out.phut_tong_video !== null &&
    out.phut_thuc_te > out.phut_tong_video
  ) {
    daBo.push('số phút học thật lớn hơn độ dài video')
    out.phut_thuc_te = null
  }
  const mocTren = out.phut_thuc_te ?? out.phut_tong_video
  if (out.thoi_gian_hv_noi !== null && mocTren !== null && out.thoi_gian_hv_noi > mocTren) {
    daBo.push('thời gian học viên nói lớn hơn cả buổi học')
    out.thoi_gian_hv_noi = null
  }
  if (out.gian_doan.some((g) => g.so_giay <= 30)) {
    daBo.push('có lần gián đoạn dưới 30 giây')
    out.gian_doan = out.gian_doan.filter((g) => g.so_giay > 30)
  }
  return { ketQua: out, daBo }
}

function soNguyenDuong(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n)
}

function docGianDoan(v: unknown): GianDoan[] {
  if (!Array.isArray(v)) return []
  const out: GianDoan[] = []
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const soGiay = soNguyenDuong(o.so_giay)
    if (soGiay === null) continue
    out.push({
      tu: typeof o.tu === 'string' ? o.tu : '',
      den: typeof o.den === 'string' ? o.den : '',
      so_giay: soGiay,
      dien_ra_gi: typeof o.dien_ra_gi === 'string' ? o.dien_ra_gi.trim() : '',
    })
  }
  return out
}

/** Model đôi khi bọc JSON trong ```json … ``` dù đã yêu cầu trả JSON thuần. */
function stripFence(text: string): string {
  const t = text.trim()
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t)
  return m ? m[1] : t
}
