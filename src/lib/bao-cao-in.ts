/**
 * Lọc ghi chú nội bộ ra khỏi báo cáo trước khi in cho phụ huynh.
 *
 * File này CỐ Ý không import gì — chạy thẳng được bằng `node --test`.
 *
 * VÌ SAO CẦN
 *   Các trường strengths / improvements / next_lesson_recommendation dùng chung
 *   cho cả Founder lẫn phụ huynh. Trong đó có những đoạn chỉ Founder được đọc:
 *   nghi vấn ai là người dạy buổi đó, tiền lương, sức khoẻ giáo viên, chuyện
 *   riêng của học viên. In nhầm những đoạn này cho phụ huynh là sự cố nghiêm
 *   trọng — mất uy tín giáo viên và lộ thông tin nội bộ.
 *
 * QUY ƯỚC
 *   Một đoạn là nội bộ khi DÒNG ĐẦU của nó chứa một trong các dấu hiệu dưới
 *   đây. Đoạn được tách bằng dòng trống, hoặc bằng mục đánh số ở đầu dòng
 *   (1. / 2. / a. …). Cả đoạn bị bỏ, không chỉ dòng đầu.
 *
 *   Khi viết feedback về sau, muốn ghi gì cho riêng Founder thì mở đoạn bằng
 *   "GHI CHU CHO FOUNDER" hoặc "CAN FOUNDER" — đừng gài lẫn vào giữa một đoạn
 *   dành cho phụ huynh, vì bộ lọc chỉ nhìn dòng đầu.
 */

/** Dấu hiệu mở đầu một đoạn chỉ dành cho nội bộ. Không dấu, không phân biệt hoa thường. */
const DAU_HIEU_NOI_BO = [
  'ghi chu cho founder',
  'ghi chu founder',
  'can founder',
  'ghi chu ky thuat',
  'luu y ky thuat',
  'nhay cam',
  'chi founder',
]

/** Bỏ dấu tiếng Việt để so khớp không phụ thuộc cách gõ dấu. */
function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Bỏ ký hiệu đánh mục ở đầu dòng: "4. ", "a) ", "- ", "• ".
 *
 * Lớp ký tự phải hẹp — chỉ đúng phần đánh mục. Một lớp rộng kiểu [\d.)a-z-]*
 * sẽ ăn luôn cả chữ cái của nội dung và mọi dòng đều khớp rỗng.
 */
const DANH_MUC = /^\s*(?:\d+[.)]|[a-z][.)]|[-•*–—])?\s*/

/** Dòng này có mở đầu một đoạn nội bộ không? */
export function laDongNoiBo(dong: string): boolean {
  const sach = boDau(dong).replace(DANH_MUC, '')
  return DAU_HIEU_NOI_BO.some((d) => sach.startsWith(d))
}

/**
 * Một đoạn mới bắt đầu khi gặp dòng trống, hoặc khi dòng mở đầu bằng số thứ tự
 * / gạch đầu dòng. Nhờ vậy mục "4. GHI CHU CHO FOUNDER" nằm giữa danh sách vẫn
 * bị cắt gọn mà không kéo theo mục số 5 phía sau.
 */
function laDongMoDoan(dong: string): boolean {
  return /^\s*(\d+[.)]|[-•*]|[a-z][.)])\s/.test(dong)
}

/**
 * Trả về phần nội dung an toàn để gửi phụ huynh.
 * Chuỗi rỗng hoặc null trả về chuỗi rỗng.
 */
export function locGhiChuNoiBo(text: string | null | undefined): string {
  const goc = (text ?? '').replace(/\r\n/g, '\n')
  if (goc.trim() === '') return ''

  const dsDong = goc.split('\n')
  const giu: string[] = []
  let dangBo = false

  for (const dong of dsDong) {
    const trong = dong.trim() === ''

    if (trong) {
      // Dòng trống khép lại đoạn đang bỏ; đoạn tiếp theo được xét lại từ đầu.
      dangBo = false
      giu.push(dong)
      continue
    }

    if (dangBo) {
      // Chỉ thoát khi gặp một mục mới — dòng tiếp nối vẫn thuộc đoạn đang bỏ.
      if (laDongMoDoan(dong) && !laDongNoiBo(dong)) {
        dangBo = false
        giu.push(dong)
      }
      continue
    }

    if (laDongNoiBo(dong)) {
      dangBo = true
      continue
    }

    giu.push(dong)
  }

  // Gộp các dòng trống thừa do cắt đoạn để lại, rồi cắt trắng hai đầu.
  return giu.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Bỏ mốc thời gian video ra khỏi nhận xét trước khi gửi phụ huynh.
 *
 * VÌ SAO
 *   Cô Ngọc chốt ngày 25/09/2026: bản gửi phụ huynh không ghi giây phút.
 *   Mốc thời gian là công cụ đối soát của trung tâm — nó chứng minh mỗi câu
 *   nhận xét có căn cứ trong video. Nhưng với phụ huynh thì "27:03 con nói…"
 *   đọc như biên bản giám sát, không phải như lời cô giáo nói về con.
 *
 *   Mốc vẫn được giữ NGUYÊN trong cơ sở dữ liệu. Chỉ bản in cho phụ huynh mới
 *   lọc — để cô còn tra lại được bất cứ lúc nào.
 *
 * XOÁ NHỮNG DẠNG NÀO
 *   "(25:10)"            "27:03 HV nói…"        "tại 36:05"
 *   "đoạn 19:57–31:01"   "từ 59:00 đến 01:01:26"  "01:02:20 — cô dừng buổi"
 */

/** Một mốc: mm:ss hoặc hh:mm:ss. */
const MOC = String.raw`\d{1,2}:\d{2}(?::\d{2})?`

/** Khoảng: 19:57–31:01 · 19:57-31:01 · từ 59:00 đến 01:01:26 */
const KHOANG = new RegExp(
  String.raw`(?:từ\s+)?${MOC}\s*(?:[–—-]|đến)\s*${MOC}`,
  'g',
)

export function boMocThoiGian(text: string | null | undefined): string {
  let t = (text ?? '').replace(/\r\n/g, '\n')
  if (t.trim() === '') return ''

  // 1. Mốc trong ngoặc, kể cả khi một ngoặc chứa nhiều mốc:
  //    "(25:10)" · "(1:00:50)" · "(17:43, 22:10, 30:05)" · "(05:10; 09:22)"
  //    Phải bắt cả cụm. Chỉ bắt một mốc thì các mốc sau bị quy tắc 5 gỡ lẻ,
  //    để lại cái vỏ "(17:43,)" — đúng lỗi đã lọt vào bản in của Nhi.
  t = t.replace(
    new RegExp(
      String.raw`\s*\(\s*${MOC}(?:\s*(?:,|;|·|và)\s*${MOC})*\s*\)`,
      'gi',
    ),
    '',
  )

  // 2. Khoảng thời gian, kèm giới từ đứng trước nếu có.
  //    Cờ 'i' để bắt cả "Đoạn" viết hoa đầu câu — không có nó thì giới từ
  //    còn lại lủng lẳng trước một khoảng trống.
  t = t.replace(
    new RegExp(String.raw`\s*(?:tại|ở|trong|vào|đoạn)?\s*` + KHOANG.source, 'gi'),
    '',
  )

  // 3. Mốc lẻ có giới từ: "tại 36:05" · "ở 27:26" · "vào 12:31"
  t = t.replace(new RegExp(String.raw`\s*(?:tại|ở|vào)\s+${MOC}`, 'gi'), '')

  // 4. Mốc mở đầu một dòng hoặc một mệnh đề: "- 31:08 — vào bài" · "27:03 HV nói"
  t = t.replace(new RegExp(String.raw`(^|\n)(\s*[-–•*]\s*)?${MOC}\s*(?:[–—-]\s*)?`, 'g'), '$1$2')

  // 5. Mốc còn sót giữa câu
  t = t.replace(new RegExp(String.raw`\s${MOC}(?=[\s,.;:)])`, 'g'), '')

  // 6. Dọn dấu câu và khoảng trắng thừa do việc cắt để lại
  return t
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([(,;:])\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/^[ \t]*[,;:]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((d) => d.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim()
}
