/**
 * Kiểu dữ liệu của cổng — CỐ Ý không dùng chung database.types.ts với hệ quản
 * trị.
 *
 * File kiểu bên quản trị mô tả toàn bộ 36 bảng và mọi view, kể cả tài chính
 * trung tâm và lương giáo viên. Đưa nó sang đây là mở cho lập trình viên tương
 * lai gõ `supabase.from('teacher_payroll')` trong mã của cổng và được trình
 * biên dịch chấp nhận.
 *
 * Ở đây chỉ khai đúng bốn view mà cổng được phép đọc. Gõ tên bảng khác là lỗi
 * biên dịch ngay, không đợi tới lúc chạy.
 */
export type PortalHocVien = {
  student_id: string
  ten_hoc_vien: string | null
  student_code: string | null
  trang_thai: string | null
  ten_lop: string | null
  giao_vien: string | null
  tong_buoi_da_hoc: number | null
  buoi_gan_nhat: string | null
  buoi_con_lai: number | null
  kieu_hoc_phi: string | null
}

export type PortalBuoiHoc = {
  student_id: string
  lesson_id: string
  lesson_date: string
  duration_minutes: number | null
  ten_lop: string | null
  giao_vien: string | null
  diem_danh: string | null
  noi_dung: string | null
  diem_manh: string | null
  can_cai_thien: string | null
  bai_tap: string | null
  de_xuat: string | null
  video: string | null
}

export type PortalHocPhi = {
  student_id: string
  enrollment_code: string | null
  hinh_thuc: string | null
  trang_thai: string | null
  start_date: string | null
  price_per_lesson: number | null
  lessons_purchased: number | null
  lessons_used: number | null
  lessons_remaining: number | null
  tong_hoc_phi: number | null
  da_dong: number | null
  con_lai_phai_dong: number | null
}

export type PortalHopDongNhom = {
  student_id: string
  ten_lop: string | null
  nguoi_dung_ten: string | null
  si_so: number | null
}

export type PortalLichHoc = {
  student_id: string
  ten_lop: string | null
  giao_vien: string | null
  weekday: number | null
  start_time: string | null
  duration_minutes: number | null
  ngay_ke_tiep: string | null
}
