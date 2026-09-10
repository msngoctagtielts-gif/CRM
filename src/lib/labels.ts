import type { Enums } from '@/types/database.types'

/**
 * Nhãn tiếng Việt cho các enum trong database.
 *
 * Toàn bộ chuỗi hiển thị tập trung ở đây thay vì rải rác trong component — khi
 * cần thêm tiếng Anh ở giai đoạn sau chỉ cần thêm một từ điển song song.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold'

export const STUDENT_STATUS: Record<Enums<'student_status'>, { label: string; tone: Tone }> = {
  lead: { label: 'Tiềm năng', tone: 'neutral' },
  placement: { label: 'Kiểm tra đầu vào', tone: 'info' },
  trial: { label: 'Học thử', tone: 'info' },
  active: { label: 'Đang học', tone: 'success' },
  paused: { label: 'Tạm dừng', tone: 'warning' },
  completed: { label: 'Hoàn thành', tone: 'gold' },
  inactive: { label: 'Đã nghỉ', tone: 'danger' },
}

export const CLASS_TYPE: Record<Enums<'class_type'>, { label: string; short: string }> = {
  one_to_one: { label: 'Lớp 1 kèm 1', short: '1:1' },
  one_to_two: { label: 'Lớp 1 kèm 2', short: '1:2' },
  small_group: { label: 'Nhóm nhỏ', short: 'Nhóm' },
}

export const CLASS_STATUS: Record<Enums<'class_status'>, { label: string; tone: Tone }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  active: { label: 'Đang mở', tone: 'success' },
  paused: { label: 'Tạm dừng', tone: 'warning' },
  completed: { label: 'Đã kết thúc', tone: 'info' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

export const LESSON_STATUS: Record<Enums<'lesson_status'>, { label: string; tone: Tone }> = {
  scheduled: { label: 'Đã lên lịch', tone: 'info' },
  in_progress: { label: 'Đang diễn ra', tone: 'gold' },
  completed: { label: 'Đã dạy', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
  no_show: { label: 'Học viên không vào', tone: 'warning' },
  rescheduled: { label: 'Đã dời', tone: 'neutral' },
}

export const ATTENDANCE_STATUS: Record<
  Enums<'attendance_status'>,
  { label: string; tone: Tone }
> = {
  present: { label: 'Có mặt', tone: 'success' },
  late: { label: 'Đi muộn', tone: 'warning' },
  absent_excused: { label: 'Vắng có phép', tone: 'info' },
  absent_unexcused: { label: 'Vắng không phép', tone: 'danger' },
  no_show: { label: 'Không vào lớp', tone: 'danger' },
}

export const REPORT_STATUS: Record<Enums<'report_status'>, { label: string; tone: Tone }> = {
  draft: { label: 'Chưa hoàn tất', tone: 'warning' },
  submitted: { label: 'Đã nộp đủ', tone: 'success' },
  incomplete: { label: 'Thiếu — quá hạn', tone: 'danger' },
  needs_review: { label: 'Cần xem xét', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'gold' },
}

export const PAYMENT_METHOD: Record<Enums<'payment_method'>, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
}

export const PAYMENT_STATUS: Record<Enums<'payment_status'>, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã nhận', tone: 'success' },
  refunded: { label: 'Đã hoàn', tone: 'info' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

export const EXPENSE_CATEGORY: Record<Enums<'expense_category'>, string> = {
  teacher_salary: 'Lương giáo viên',
  software: 'Phần mềm',
  marketing: 'Marketing',
  advertising: 'Quảng cáo',
  equipment: 'Thiết bị',
  office: 'Văn phòng',
  training: 'Đào tạo',
  other: 'Khác',
}

export const PAYROLL_STATUS: Record<Enums<'payroll_status'>, { label: string; tone: Tone }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  pending_review: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'info' },
  paid: { label: 'Đã trả', tone: 'success' },
}

export const ENROLLMENT_STATUS: Record<Enums<'enrollment_status'>, { label: string; tone: Tone }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  active: { label: 'Hiệu lực', tone: 'success' },
  paused: { label: 'Tạm dừng', tone: 'warning' },
  completed: { label: 'Đã hoàn tất', tone: 'info' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

export const LEAD_STATUS: Record<Enums<'lead_status'>, { label: string; tone: Tone }> = {
  new: { label: 'Lead mới', tone: 'info' },
  contacted: { label: 'Đã liên hệ', tone: 'info' },
  consultation: { label: 'Đã tư vấn', tone: 'info' },
  placement_test: { label: 'Kiểm tra đầu vào', tone: 'gold' },
  trial: { label: 'Học thử', tone: 'gold' },
  follow_up: { label: 'Đang theo dõi', tone: 'warning' },
  enrolled: { label: 'Đã ghi danh', tone: 'success' },
  lost: { label: 'Không thành', tone: 'danger' },
}

/** Trường bắt buộc còn thiếu trong báo cáo giảng dạy. */
export const MISSING_FIELD: Record<string, string> = {
  homework: 'Bài tập về nhà',
  recording: 'Link recording',
  teacher_comments: 'Nhận xét của giáo viên',
  start_time: 'Giờ bắt đầu',
  end_time: 'Giờ kết thúc',
  report: 'Chưa nộp báo cáo',
}

export const ATTITUDE: Record<string, string> = {
  excellent: 'Rất tốt',
  good: 'Tốt',
  average: 'Bình thường',
  needs_improvement: 'Cần cải thiện',
  concerning: 'Đáng lo',
}

export const HOMEWORK_COMPLETION: Record<string, string> = {
  completed: 'Hoàn thành',
  partial: 'Làm một phần',
  not_done: 'Không làm',
  not_assigned: 'Không giao',
}

export const WEEKDAYS = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const

export function missingFieldLabels(fields: string[] | null | undefined): string[] {
  return (fields ?? []).map((f) => MISSING_FIELD[f] ?? f)
}
