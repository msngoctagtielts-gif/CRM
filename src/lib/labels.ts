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

export const PAYABLE_STATUS: Record<Enums<'payable_status'>, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ vào kỳ lương', tone: 'warning' },
  included: { label: 'Đã vào kỳ lương', tone: 'info' },
  excluded: { label: 'Không tính', tone: 'neutral' },
  paid: { label: 'Đã trả', tone: 'success' },
}

export const ADJUSTMENT_KIND: Record<string, string> = {
  bonus: 'Thưởng',
  allowance: 'Phụ cấp',
  deduction: 'Trừ',
  correction: 'Điều chỉnh',
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

/**
 * Trường còn thiếu trong báo cáo giảng dạy.
 *
 * `start_time` / `end_time` là điều kiện CỨNG — thiếu thì buổi không được tính
 * lương (DECISIONS.md D5). Sáu khoá còn lại là bộ tiêu chí chấm chất lượng (D3);
 * thiếu thì vẫn tính lương, chỉ gắn cờ (D4).
 */
export const MISSING_FIELD: Record<string, string> = {
  start_time: 'Giờ bắt đầu',
  end_time: 'Giờ kết thúc',
  video: 'Link video',
  timestamp: 'Timestamp đối chiếu',
  student_quote: 'Trích nguyên văn lời học viên',
  strengths_deep: 'Điểm mạnh đủ sâu',
  improvements_deep: 'Phần cần cải thiện đủ sâu',
  homework_pattern: 'Homework có mẫu câu',
  // Khoá cũ, giữ lại để báo cáo di trú từ trước vẫn hiển thị đúng.
  recording: 'Link video',
  homework: 'Bài tập về nhà',
  teacher_comments: 'Nhận xét của giáo viên',
  report: 'Chưa nộp báo cáo',
}

/** Sáu tiêu chí chấm chất lượng feedback, theo đúng thứ tự của bảng chấm (D3). */
export const QC_CRITERIA = [
  { key: 'video', label: 'Link video', auto: true },
  { key: 'timestamp', label: 'Timestamp đối chiếu', auto: true },
  { key: 'student_quote', label: 'Trích nguyên văn lời học viên', auto: true },
  { key: 'strengths_deep', label: 'Điểm mạnh đủ sâu', auto: false },
  { key: 'improvements_deep', label: 'Phần cần cải thiện đủ sâu', auto: false },
  { key: 'homework_pattern', label: 'Homework có mẫu câu', auto: true },
] as const

/** Ngưỡng điểm QC đạt. Giá trị thật đọc từ bảng settings; đây là mặc định. */
export const QC_MIN_SCORE = 60

export function qcTone(score: number | null | undefined): Tone {
  if (score === null || score === undefined) return 'neutral'
  if (score >= 80) return 'success'
  if (score >= QC_MIN_SCORE) return 'gold'
  return 'danger'
}

export const BILLING_MODE: Record<Enums<'billing_mode'>, { label: string; short: string }> = {
  prepaid_package: { label: 'Gói trả trước', short: 'Gói' },
  monthly_postpaid: { label: 'Đóng cuối tháng', short: 'Cuối tháng' },
  undetermined: { label: 'Chưa xác định', short: 'Chưa rõ' },
}

export const REPORT_AUTHOR: Record<Enums<'report_author'>, string> = {
  teacher: 'Giáo viên viết',
  ai: 'AI viết',
  ai_edited_by_teacher: 'AI viết, giáo viên sửa',
}

export const STATEMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  issued: { label: 'Đã gửi', tone: 'warning' },
  partial: { label: 'Trả một phần', tone: 'warning' },
  paid: { label: 'Đã thu đủ', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
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
