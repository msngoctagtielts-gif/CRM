# IMPLEMENTATION_STATUS.md

**Cập nhật:** 10/09/2026
**Nhánh:** `claude/mnee-system-architecture-oxsrc4`

Tài liệu này nói thẳng cái gì đã chạy và đã kiểm thử, cái gì chỉ mới có cấu trúc,
cái gì chưa làm. **Không có hạng mục nào được đánh dấu xong nếu chưa kiểm thử.**

---

## Chú giải

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Đã xong **và** đã kiểm thử |
| 🟡 | Đã có CSDL + giao diện, nhưng chưa kiểm thử end-to-end trên Supabase thật |
| ⬜ | Chưa làm |
| 🧱 | Bảng/cấu trúc đã tạo sẵn, giao diện thuộc giai đoạn sau |

---

## 1. Hiện trạng trước khi triển khai

Repository `msngoctagtielts-gif/CRM` **rỗng hoàn toàn** — không có commit nào.
**Không có chức năng nào bị xoá hay ghi đè.**

Supabase project `yevsupsuelpbodwawfyw` đang **INACTIVE (tạm dừng)**, nên chưa đọc
được schema và **chưa áp migration nào lên đó**. Cần Founder xác nhận trước.

---

## 2. Nền tảng

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Next.js 15 + React 19 + TypeScript strict | ✅ | `npm run build` thành công, 19 route |
| Tailwind CSS v4 + hệ màu thương hiệu | ✅ | Navy/Gold/White/Burgundy khai báo bằng `@theme` |
| 12 file migration | ✅ | áp sạch trên PostgreSQL 16 và 17 |
| Sinh type TypeScript từ schema | ✅ | `src/types/database.types.ts`, 1.8k dòng, có cả quan hệ khoá ngoại |
| Row Level Security 33 bảng | ✅ | 19 assertion riêng cho RLS |
| Bộ kiểm thử nghiệp vụ | ✅ | 86 assertion, `./supabase/tests/run-local.sh` |
| CI (typecheck + lint + build + test CSDL) | ✅ | `.github/workflows/ci.yml` |
| ESLint | ✅ | `npm run lint` sạch |

---

## 3. Giai đoạn 1 — theo từng module

### 3.1 Xác thực & phân quyền — ✅

| Hạng mục | Trạng thái |
|---|---|
| Đăng nhập email/mật khẩu qua Supabase Auth | 🟡 |
| Làm mới phiên trong `middleware.ts`, chặn route chưa đăng nhập | ✅ (đã kiểm: `/` và `/dashboard` → 307 về `/login`) |
| Tự tạo hồ sơ `users` khi có tài khoản Auth mới | ✅ |
| Vai trò mặc định `teacher` (đặc quyền tối thiểu) | ✅ |
| Chặn tài khoản bị vô hiệu hoá (`is_active = false`) | 🟡 |
| Giáo viên không tự nâng mình thành Founder | ✅ |
| Trang `/unauthorized` | ✅ |
| Đăng xuất | 🟡 |

### 3.2 Học viên (CRM) — 🟡

| Hạng mục | Trạng thái |
|---|---|
| Danh sách, tìm kiếm theo tên/mã, lọc theo trạng thái | 🟡 |
| Thêm học viên (kèm phụ huynh, tuỳ chọn) | 🟡 |
| Hồ sơ học viên đầy đủ theo mục IV của yêu cầu | 🟡 |
| Mã học viên tự sinh `HV0001` | ✅ |
| Tuổi suy ra từ ngày sinh, không lưu cứng | ✅ |
| 7 trạng thái học viên | ✅ |
| Giáo viên chỉ thấy học viên lớp mình | ✅ |
| Công nợ & buổi còn lại chỉ Founder thấy | ✅ |
| **Sửa hồ sơ học viên** | ⬜ server action đã viết (`updateStudent`) nhưng **chưa có trang giao diện** |

### 3.3 Giáo viên — 🟡

| Hạng mục | Trạng thái |
|---|---|
| Danh sách kèm đơn giá 30/60/90 phút đang hiệu lực | 🟡 |
| Thêm giáo viên + đơn giá ban đầu | 🟡 |
| Thêm đơn giá mới có ngày hiệu lực | 🟡 |
| Đơn giá đóng băng — đổi giá không làm sai lương cũ | ✅ |
| Giáo viên chỉ thấy đơn giá của mình | ✅ |
| **Liên kết `teachers.user_id` với tài khoản Auth từ giao diện** | ⬜ hiện phải làm bằng SQL |

### 3.4 Lớp học — 🟡

| Hạng mục | Trạng thái |
|---|---|
| Danh sách lớp, sĩ số, giáo viên | 🟡 |
| Tạo lớp 1-1 / 1-2 / nhóm nhỏ; 30/60/90 phút | 🟡 |
| Chi tiết lớp: học viên, lịch, buổi học | 🟡 |
| Thêm học viên vào lớp (chặn vượt sĩ số) | 🟡 |
| Thêm lịch học định kỳ theo tuần | 🟡 |
| Sinh buổi học từ lịch (chạy lại không tạo trùng) | 🟡 |
| Mã lớp tự sinh `LH0001` | ✅ |
| Giáo viên chỉ thấy lớp mình | ✅ |

### 3.5 Báo cáo giảng dạy hằng ngày — ✅ (logic) / 🟡 (giao diện)

| Hạng mục | Trạng thái |
|---|---|
| Biểu mẫu mobile-first, một cột, thanh lưu dính đáy | 🟡 |
| Ghi giờ bắt đầu/kết thúc, thời lượng tự tính | ✅ |
| Điểm danh ngay trong biểu mẫu | ✅ |
| Ba trường bắt buộc (bài tập, recording, nhận xét) | ✅ |
| Nhận xét riêng từng học viên (hỗ trợ lớp nhóm) | 🟡 |
| Lưu thời điểm nộp báo cáo | ✅ |
| **Hạn 10 giờ tính từ giờ kết thúc buổi học** | ✅ |
| **Tự chuyển `INCOMPLETE` khi quá hạn mà còn thiếu** | ✅ |
| **Sinh cảnh báo chất lượng đúng định dạng yêu cầu** | ✅ |
| Cảnh báo không trùng khi quét lại | ✅ |
| Cảnh báo tự đóng khi đã bổ sung đủ | ✅ |
| Founder duyệt báo cáo; đã duyệt thì giáo viên không sửa được | ✅ (RLS) / 🟡 (nút duyệt chưa gắn vào trang) |

### 3.6 Học phí & hợp đồng — 🟡

> Mục VII thuộc Giai đoạn 2, nhưng dashboard Giai đoạn 1 cần **Công nợ học phí**,
> nên biểu mẫu hợp đồng tối thiểu đã được làm sớm. Đây là mở rộng có chủ ý so với
> phân chia ban đầu, ghi lại ở đây để minh bạch.

| Hạng mục | Trạng thái |
|---|---|
| Hợp đồng học phí với đơn giá riêng từng học viên | 🟡 |
| Giảm giá, tổng phải trả, xem trước số tiền | 🟡 |
| Buổi đã mua / đã học / còn lại | ✅ |
| Gói học phí chỉ là giá gợi ý | ✅ |
| Công nợ = phải trả − đã trả | ✅ |

### 3.7 Thanh toán — 🟡

| Hạng mục | Trạng thái |
|---|---|
| Ghi nhận thu: tiền mặt / chuyển khoản / khác | 🟡 |
| Gắn thanh toán vào hợp đồng, kiểm tra đúng học viên | 🟡 |
| Mã thanh toán tự sinh `TT25090001` | ✅ |
| Bảng công nợ theo hợp đồng | 🟡 |
| **Tách tiền mặt đã thu / doanh thu ghi nhận / công nợ** | ✅ |
| Học phí trả trước hiển thị là nghĩa vụ, không phải lợi nhuận | ✅ |
| Giáo viên hoàn toàn không đọc được | ✅ |

### 3.8 Chi phí — 🟡

| Hạng mục | Trạng thái |
|---|---|
| 8 hạng mục chi phí theo yêu cầu | ✅ |
| Ghi nhận chi phí kèm nhà cung cấp, hoá đơn | 🟡 |
| Lọc theo ngày/tuần/tháng/quý/năm/tuỳ chọn | 🟡 |
| Phân tích theo hạng mục | 🟡 |
| Không đếm hai lần lương giáo viên | ✅ |

### 3.9 Dashboard Founder — 🟡

7 hàng theo đúng mục XIV của yêu cầu:

| Hàng | Nội dung | Trạng thái |
|---|---|---|
| 1 | Doanh thu · Chi phí · Lợi nhuận · Công nợ | 🟡 |
| — | *(thêm)* Tiền mặt đã thu · Đã thu chưa dạy | 🟡 |
| 2 | Học viên đang học · Lớp · Buổi · Giờ dạy | 🟡 |
| 3 | Biểu đồ doanh thu & dòng tiền (vẽ tách biệt) | 🟡 |
| 4 | Học phí cần thu | 🟡 |
| 5 | Cảnh báo chất lượng | 🟡 |
| 6 | Buổi học sắp tới | 🟡 |
| 7 | Thanh toán gần đây | 🟡 |
| — | Bộ lọc: hôm nay/tuần/tháng/tháng trước/quý/năm/tuỳ chọn | 🟡 |
| — | So sánh với kỳ trước | 🟡 |

### 3.10 Cảnh báo vận hành — 🟡

| Hạng mục | Trạng thái |
|---|---|
| Trang cảnh báo, tách đang mở / đã xử lý | 🟡 |
| Đánh dấu đã xem / bỏ qua | 🟡 |
| Nút quét lại ngay | 🟡 |
| `POST /api/cron/scan-reports` bảo vệ bằng `CRON_SECRET` | ✅ (đã kiểm 401 khi thiếu/sai secret) |
| Sẵn sàng cho n8n và pg_cron | ✅ |

---

## 4. Giai đoạn 2–5 — trạng thái cấu trúc

| Giai đoạn | Bảng CSDL | Logic | Giao diện |
|---|---|---|---|
| **2** Lương giáo viên | 🧱 `teacher_payable_lessons`, `teacher_payroll`, `teacher_payroll_adjustments` | ✅ sinh buổi tính lương, tính kỳ lương, cổng duyệt — **đã kiểm thử** | ⬜ |
| **2** Ghi nhận doanh thu theo buổi | 🧱 `lesson_consumptions` | ✅ **đã kiểm thử** | 🟡 hiện qua dashboard |
| **3** Lead CRM | 🧱 `leads`, `lead_activities` | ⬜ | ⬜ |
| **3** Kiểm tra đầu vào & học thử | 🧱 `placement_tests`, `trial_classes` | ⬜ | ⬜ |
| **4** n8n & tự động hoá | — | ✅ điểm gọi cron đã có | ⬜ |
| **4** Di trú Google Sheets | 🧱 cờ `is_migrated_balance` | ⬜ | ⬜ |
| **5** Cổng phụ huynh | 🧱 `parents.user_id`, `student_parents`, `recordings.visible_to_parent` | ⬜ | ⬜ |
| **5** Phân tích bằng AI | — | ⬜ | ⬜ |

Toàn bộ bảng của các giai đoạn sau **đã được tạo ngay từ Giai đoạn 1** để không
phải sửa cấu trúc production về sau.

---

## 5. Đã kiểm thử những gì

### Đã kiểm thử tự động (86 assertion, `./supabase/tests/run-local.sh`)

Xem danh sách chi tiết ở mục 6 của `DATABASE_SCHEMA.md`. Bao phủ: vai trò mặc
định, mã tự sinh, tuổi suy ra, đơn giá riêng từng học viên, tách ba khái niệm tài
chính, hạn 10 giờ, cảnh báo chất lượng đúng định dạng, chống cảnh báo trùng, đóng
băng đơn giá, quy trình duyệt lương, logic trừ/hoàn buổi, và 19 kiểm tra RLS.

### Đã kiểm thử bằng tay

- `npm run build` → thành công, 19 route
- `npm run typecheck` → sạch
- `npm run lint` → sạch
- `GET /login` → HTTP 200, hiển thị đúng tiếng Việt và khẩu hiệu thương hiệu
- `GET /` và `/dashboard` chưa đăng nhập → 307 về `/login?next=…`
- `POST /api/cron/scan-reports` không có header → 401
- `POST /api/cron/scan-reports` sai secret → 401
- `POST /api/cron/scan-reports` đúng secret, thiếu service role key → 500 kèm thông báo rõ ràng

### ❗ Chưa kiểm thử

**Chưa có luồng nào được chạy trên một Supabase project thật.** Cụ thể chưa xác minh:

1. Đăng nhập và đăng xuất thật qua Supabase Auth
2. Các server action ghi dữ liệu qua PostgREST (đã kiểm logic ở tầng SQL, chưa
   kiểm qua tầng HTTP)
3. Hành vi RLS qua PostgREST (đã kiểm trực tiếp trong PostgreSQL)
4. Hiển thị thực tế trên điện thoại và iPad (đã thiết kế mobile-first, chưa chụp màn hình kiểm chứng)
5. Biểu đồ Recharts với dữ liệu thật

Lý do: Supabase project đang tạm dừng và việc kích hoạt lại cần Founder xác nhận
(xem rủi ro R1). Không tự ý áp migration lên một project có thể đang chứa dữ liệu thật.

---

## 6. Khác biệt so với yêu cầu ban đầu

| # | Khác biệt | Lý do |
|---|---|---|
| 1 | Biểu mẫu hợp đồng học phí làm sớm ở Giai đoạn 1 | Dashboard Giai đoạn 1 yêu cầu "Công nợ học phí", mà công nợ chỉ tính được khi có hợp đồng |
| 2 | Thêm bảng `lesson_consumptions` (không có trong danh sách mục III) | Bắt buộc để tách doanh thu ghi nhận khỏi dòng tiền theo mục XII |
| 3 | Thêm `teacher_payable_lessons`, `audit_logs`, `settings`, `teacher_rates`, `student_parents`, `lead_activities`, `teaching_report_students` | Hiện thực các yêu cầu về lương tự động, duyệt điều chỉnh, đơn giá riêng từng giáo viên, nhận xét từng học viên trong lớp nhóm |
| 4 | `users` thay cho việc dùng trực tiếp `auth.users` | Supabase quản lý `auth.users`; cần bảng riêng để gắn vai trò và `is_active` |
| 5 | Một tài khoản = một vai trò | Đơn giản hoá; Founder kiêm dạy cần 2 tài khoản (giả định A9) |
