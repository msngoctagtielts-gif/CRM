/**
 * Chọn ra những hợp đồng cần nhắc học phí, và soạn tin nhắn gửi người đóng tiền.
 *
 * Tách riêng khỏi màn hình /month-end vì job nhắc việc hằng tháng cũng phải đếm
 * đúng con số đó. Nếu mỗi bên tự viết lại luật, job sẽ báo "3 người cần nhắc"
 * trong khi màn hình hiện 5 — và cô Ngọc không biết tin bên nào.
 *
 * Không import gì ngoài hàm định dạng tiền, để chạy được bằng `node --test`.
 */
import { formatCurrency, formatNumber } from '../format.ts'
import type { Enums } from '../../types/database.types.ts'

/** Một dòng của view `v_enrollment_balances` — chỉ những cột luật nhắc cần. */
export type ReminderBalance = {
  enrollment_id: string | null
  student_id: string | null
  enrollment_code: string | null
  billing_mode: Enums<'billing_mode'> | null
  lessons_remaining: number | string | null
  outstanding_amount: number | string | null
  price_per_lesson: number | string | null
  payer_name: string | null
  total_paid?: number | string | null
  lessons_used?: number | string | null
  revenue_recognized?: number | string | null
}

/** Một dòng của bảng `tuition_statements` trong kỳ đang chốt. */
export type ReminderStatement = {
  enrollment_id: string | null
  status: string | null
  net_amount: number | string | null
  paid_amount: number | string | null
}

export type Reminder = {
  balance: ReminderBalance
  /** Vì sao phải nhắc — hiện nguyên văn trên màn hình và trong tin nhắn. */
  ly_do: string
  /** `true` khi tiền đã hết hẳn: hết buổi, học vượt, hoặc chưa lập phiếu tháng. */
  gap: boolean
}

const num = (v: number | string | null | undefined): number => Number(v ?? 0)

/**
 * Luật nhắc học phí, xếp theo thứ tự ưu tiên. Một hợp đồng chỉ sinh một lý do —
 * lý do đầu tiên khớp, để tin nhắn không kể hai chuyện cùng lúc.
 */
export function pickReminders(opts: {
  balances: ReminderBalance[]
  statements: ReminderStatement[]
  /** Nhãn tháng đang chốt, dạng `MM/YYYY`. */
  monthLabel: string
  /** Ngưỡng "sắp hết buổi", lấy từ bảng settings. */
  alertLessonsRemaining: number
}): Reminder[] {
  const byEnrollment = new Map(
    opts.statements.filter((s) => s.enrollment_id).map((s) => [s.enrollment_id!, s]),
  )

  return opts.balances
    .map((b): Reminder | null => {
      const remaining = b.lessons_remaining === null ? null : num(b.lessons_remaining)
      const outstanding = num(b.outstanding_amount)
      const st = b.enrollment_id ? byEnrollment.get(b.enrollment_id) : undefined

      // Gói trả trước: nhắc theo số buổi còn lại, vì tiền đã thu trước.
      if (b.billing_mode === 'prepaid_package' && remaining !== null) {
        if (remaining < 0) {
          return { balance: b, ly_do: `Đã học vượt ${formatNumber(Math.abs(remaining))} buổi`, gap: true }
        }
        if (remaining <= opts.alertLessonsRemaining) {
          return { balance: b, ly_do: `Còn ${formatNumber(remaining)} buổi`, gap: remaining === 0 }
        }
      }

      // Trả sau theo tháng: nhắc theo phiếu học phí của kỳ.
      if (b.billing_mode === 'monthly_postpaid') {
        if (!st) return { balance: b, ly_do: `Chưa lập phiếu tháng ${opts.monthLabel}`, gap: true }
        const con_thieu = num(st.net_amount) - num(st.paid_amount)
        if (st.status !== 'paid' && con_thieu > 0) {
          return { balance: b, ly_do: `Phiếu tháng còn thiếu ${formatCurrency(con_thieu)}`, gap: false }
        }
      }

      // Còn nợ mà không rơi vào hai luật trên — vẫn phải nhắc.
      if (outstanding > 0) return { balance: b, ly_do: `Công nợ ${formatCurrency(outstanding)}`, gap: false }
      return null
    })
    .filter((r): r is Reminder => r !== null)
}

/**
 * Tin nhắn Zalo soạn sẵn, gửi NGƯỜI ĐÓNG TIỀN chứ không phải học viên: nhà Y
 * Khoa có một người đại diện đóng cho cả nhóm, và vợ anh Max đóng thay anh.
 * Gọi sai tên là chuyện phụ huynh nhớ rất lâu.
 *
 * Không nêu con số nào mà hệ thống chưa chốt được. Số buổi còn lại và công nợ
 * lấy thẳng từ view; không ước lượng, không làm tròn cho đẹp.
 */
export function soanTinNhac(p: {
  hocVien: string
  nguoiDong: string | null
  lyDo: string
  soBuoiConLai: number | null
  donGia: number
  congNo: number
  traTruoc: boolean
}): string {
  const xungHo = p.nguoiDong ? `Dạ chào anh/chị ${p.nguoiDong},` : 'Dạ chào anh/chị,'
  const dong: string[] = [xungHo, '']

  if (p.traTruoc && p.soBuoiConLai !== null) {
    if (p.soBuoiConLai < 0) {
      dong.push(
        `Ms.Ngọc Elite English xin thông báo: bé ${p.hocVien} đã học vượt ${Math.abs(p.soBuoiConLai)} buổi so với gói đã đóng.`,
        'Trung tâm vẫn giữ lịch học bình thường cho bé, anh/chị sắp xếp đóng bù khi thuận tiện ạ.',
      )
    } else if (p.soBuoiConLai === 0) {
      dong.push(`Ms.Ngọc Elite English xin thông báo: bé ${p.hocVien} đã học hết số buổi của gói.`)
    } else {
      dong.push(
        `Ms.Ngọc Elite English xin thông báo: bé ${p.hocVien} còn ${p.soBuoiConLai} buổi trong gói hiện tại.`,
      )
    }
    if (p.donGia > 0) {
      dong.push('', `Học phí hiện tại: ${formatCurrency(p.donGia)}/buổi.`)
    }
  } else {
    dong.push(`Ms.Ngọc Elite English xin gửi anh/chị thông tin học phí của bé ${p.hocVien}.`)
    if (p.congNo > 0) {
      dong.push('', `Số tiền cần thanh toán: ${formatCurrency(p.congNo)}.`)
    } else {
      dong.push('', `Ghi chú: ${p.lyDo}.`)
    }
  }

  dong.push(
    '',
    'Anh/chị cần xem lại chi tiết từng buổi học, trung tâm gửi ngay ạ.',
    'Cảm ơn anh/chị đã đồng hành cùng trung tâm.',
  )
  return dong.join('\n')
}
