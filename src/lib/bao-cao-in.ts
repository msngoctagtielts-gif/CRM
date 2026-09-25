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
