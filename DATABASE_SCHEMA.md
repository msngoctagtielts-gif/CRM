# DATABASE_SCHEMA.md — Đặc tả cơ sở dữ liệu

**Hệ quản trị:** PostgreSQL 17 trên Supabase
**Nguồn sự thật:** các file trong `supabase/migrations/`. Tài liệu này mô tả, không thay thế.
**Quy tắc nghiệp vụ:** `DECISIONS.md` — mọi mục D1–D13 dưới đây đã được Founder chốt ngày 10/09/2026.
**Khoá chính:** UUID (`gen_random_uuid()`) trên mọi bảng nghiệp vụ.
**Tiền tệ:** `numeric(14,2)`, đơn vị VND. Không dùng float cho tiền.
**Thời gian:** `timestamptz` cho mốc thời điểm, `date` cho ngày thuần.

---

## 1. Quy ước chung

Mỗi bảng nghiệp vụ đều có:

| Cột | Ý nghĩa |
|---|---|
| `id` | UUID, khoá chính |
| `created_at` | thời điểm tạo, mặc định `now()` |
| `updated_at` | tự cập nhật qua trigger `tg_set_updated_at()` |
| `created_by` | FK tới `users(id)` — ai tạo bản ghi |
| `status` | trạng thái vòng đời (enum riêng theo từng bảng) |

Các bảng quan trọng (`students`, `teachers`, `lessons`, `attendance`,
`teaching_reports`, `student_enrollments`, `payments`, `expenses`,
`teacher_payroll`, `leads`, `teacher_rates`) còn có trigger `tg_audit()` ghi toàn
bộ thay đổi vào `audit_logs`.

---

## 2. Sơ đồ quan hệ

```
auth.users ──1:1── users ──┬── teachers ──── teacher_rates
                           │       │
                           │       └──────── teacher_payable_lessons ──── teacher_payroll
                           │                                                    │
                           └── parents                         teacher_payroll_adjustments
                                   │
                          student_parents
                                   │
programs ──┬── levels              │
           │      │                │
           │      └────────────── students ──┬── class_students ──── classes ──┬── class_schedules
           │                          │      │                         │       │
           │                          │      └── student_enrollments    │       └── lessons
           │                          │                  │             │            │
           └── tuition_packages ──────┘                  │             │            ├── attendance
                                      │                  │             │            ├── teaching_reports
                                      │                  │             │            │      └── teaching_report_students
                                      ├── payments ───────┤             │            ├── homework
                                      │                  │             │            └── recordings
                                      │     lesson_consumptions ────────┴────────────┘
                                      │
                                      └── leads ──┬── lead_activities
                                                  ├── placement_tests
                                                  └── trial_classes

expenses          notifications          settings          audit_logs
```

---

## 3. Danh sách bảng

### 3.1 Định danh & phân quyền

| Bảng | Mục đích | Ghi chú |
|---|---|---|
| `roles` | 4 vai trò: `founder`, `teacher`, `staff`, `parent` | khoá chính là `code` (text) |
| `users` | hồ sơ ứng dụng, `id` = `auth.users.id` | `role_code` quyết định quyền; `is_active` cho phép vô hiệu hoá mà không xoá |
| `settings` | cấu hình vận hành | `report_deadline_hours` = 10, `timezone`, `currency` |
| `audit_logs` | nhật ký thay đổi | chỉ Founder đọc; ghi qua trigger SECURITY DEFINER |

Trigger `trg_on_auth_user_created` tự tạo dòng `users` khi có tài khoản Supabase
Auth mới, **mặc định vai trò `teacher`** (đặc quyền tối thiểu). Founder phải được
nâng quyền thủ công bằng một câu UPDATE.

**Hàm kiểm quyền** (SECURITY DEFINER, dùng trong mọi policy RLS):

| Hàm | Trả về |
|---|---|
| `current_role_code()` | mã vai trò của người đang đăng nhập |
| `is_founder()` / `is_teacher()` / `is_staff()` | boolean |
| `current_teacher_id()` | `teachers.id` của người đang đăng nhập |
| `teaches_class(class_id)` | người dùng có dạy lớp này không |
| `teaches_student(student_id)` | học viên này có trong lớp của người dùng không |
| `teaches_lesson(lesson_id)` | buổi học này có thuộc người dùng không |
| `student_in_lesson_class(lesson_id, student_id)` | học viên có thuộc lớp của buổi học không |

### 3.2 Học thuật

| Bảng | Cột đáng chú ý |
|---|---|
| `programs` | `code`, `name_vi`, `name_en`, `target_audience` |
| `levels` | `code`, `cefr_code`, `sort_order` — Pre-A1 … C2 |
| `teachers` | `user_id` (NULL được: giáo viên chưa có tài khoản vẫn tính lương), `teacher_code` tự sinh `GV001` |
| `teacher_rates` | `scope` ∈ {`default`,`duration`,`class`}, `duration_minutes` ∈ {30,60,90}, `effective_from/to` |
| `parents` | `user_id` để dành cho cổng phụ huynh Giai đoạn 5 |
| `students` | `student_code` tự sinh `HV0001`, `status` (7 trạng thái), `internal_notes` không hiển thị cho phụ huynh |
| `student_parents` | quan hệ nhiều-nhiều; unique index bảo đảm tối đa một phụ huynh `is_primary` mỗi học viên |

**Tuổi không được lưu** — luôn suy ra bằng `student_age(date_of_birth)` để không bị cũ.

### 3.3 Lớp học & buổi học

| Bảng | Cột đáng chú ý |
|---|---|
| `classes` | `class_type` ∈ {`one_to_one`,`one_to_two`,`small_group`}, `default_duration_minutes` ∈ {30,60,90} (mặc định 60), `max_students` |
| `class_students` | unique `(class_id, student_id)` |
| `class_schedules` | lịch tuần: `weekday` 0–6 (0 = Chủ nhật), `start_time`, `duration_minutes`, `effective_from/to` |
| `lessons` | `scheduled_start_at/end_at`, `actual_start_at/end_at`, `duration_minutes`, `status`, **`report_due_at`** |
| `attendance` | unique `(lesson_id, student_id)`, `status` (5 giá trị), **`is_billable`** |

**Trigger `tg_lessons_derive()`** tính tự động:

- `duration_minutes` từ giờ thực tế, nếu thiếu thì lấy theo lịch
- `report_due_at = coalesce(actual_end_at, scheduled_end_at) + settings.report_deadline_hours`
  — chỉ khi `status = 'completed'`
- `teacher_id` lấy từ lớp nếu không chỉ định

**Trigger `tg_attendance_defaults()`** đặt `is_billable` theo trạng thái điểm danh:
`present`, `late`, `absent_unexcused`, `no_show` → **có** trừ buổi;
`absent_excused` → **không** trừ buổi (giả định A5). Founder vẫn ghi đè được bằng tay.

### 3.4 Báo cáo giảng dạy — module quan trọng nhất

| Bảng | Vai trò |
|---|---|
| `teaching_reports` | một dòng cho mỗi buổi học (unique `lesson_id`) |
| `teaching_report_students` | nhận xét riêng từng học viên — lớp 1-1 có 1 dòng, lớp nhóm có N dòng |
| `homework` | bài tập; `student_id` NULL = cả lớp |
| `recordings` | link video; CHECK bắt buộc URL `http(s)://` |

Cột trạng thái:

| Cột | Ý nghĩa |
|---|---|
| `status` | `draft` → `submitted` → `approved`, hoặc `incomplete` khi quá hạn mà còn thiếu |
| `missing_fields` | `text[]` các tiêu chí còn thiếu |
| `submitted_at` | lần bấm nộp đầu tiên (có thể còn thiếu) |
| `completed_at` | thời điểm báo cáo ĐẠT (đủ giờ dạy và điểm QC ≥ ngưỡng) |
| `is_late` | `completed_at > report_due_at`; nếu chưa đạt mà đã quá hạn thì `true` ngay |
| `qc_score` | 0–100, tính từ 6 tiêu chí chất lượng |
| `authored_by` | `teacher` · `ai` · `ai_edited_by_teacher` (D6) |
| `sent_to_parent_at` | mốc gửi phụ huynh — bước riêng do người bấm |

**Hạn nộp: 24 giờ** kể từ giờ kết thúc buổi học (D2, `settings.report_deadline_hours`).

### Hai tầng điều kiện khác nhau — đừng trộn lẫn

**Tầng 1 — điều kiện CỨNG để tính lương (D5):** chỉ cần `start_time` và `end_time`.
Thiếu thì buổi **không vào bảng lương** và sinh báo động đỏ gửi riêng giáo viên
(`fn_alert_missing_lesson_time`).

**Tầng 2 — 6 tiêu chí chất lượng (D3):** quyết định báo cáo ĐẠT hay chưa, nhưng
**không giữ lương** (D4) — chỉ gắn cờ `has_video` / `has_evidence` trong
`teacher_payable_lessons`.

| # | Tiêu chí | Máy tự kiểm được? | Nguồn |
|---|---|---|---|
| 1 | Link video | Có | có dòng `recordings` |
| 2 | Timestamp đối chiếu | Có | `video_timestamp` khác rỗng |
| 3 | Trích nguyên văn lời học viên | Có | `student_quote` khác rỗng |
| 4 | Điểm mạnh đủ sâu | **Không** | `qc_strengths_deep` — AI hoặc Founder chấm |
| 5 | Phần cần cải thiện đủ sâu | **Không** | `qc_improvements_deep` — AI hoặc Founder chấm |
| 6 | Homework có mẫu câu | Có | `homework.sentence_patterns` khác rỗng |

`fn_score_report_qc()` cho mỗi tiêu chí trọng số bằng nhau ⇒ `qc_score` = số tiêu
chí đạt × 100 / 6. Hai tiêu chí "đủ sâu" chưa chấm (`NULL`) tính là **chưa đạt**,
nên một báo cáo mới nhập không bao giờ tự nhiên đạt 100 điểm.

Hai cột `qc_strengths_deep` và `qc_improvements_deep` là **kết luận chấm**, không
phải dữ liệu giáo viên nhập. Chính sách RLS cho phép giáo viên sửa mọi cột của báo
cáo chưa duyệt, nên trigger `trg_guard_qc_verdict` (migration 0017) giữ nguyên giá
trị cũ của hai cột này cùng `qc_notes` khi người ghi không phải Founder — nếu chỉ
giấu ô trên giao diện thì giáo viên vẫn có thể gọi thẳng PostgREST để tự nâng điểm
lên 100 và làm tắt cảnh báo chất lượng.

Báo cáo **ĐẠT** khi có đủ giờ dạy **và** `qc_score >= settings.qc_min_score` (mặc
định 60).

`fn_refresh_report_status()` tính lại trạng thái; chạy tự động qua trigger khi
báo cáo, bài tập hoặc recording thay đổi. **Báo cáo đã `approved` không bị hạ cấp.**

### 3.5 Tài chính

> Ba khái niệm **không bao giờ dùng chung một cột**:
> **tiền mặt đã thu** (`payments`) · **doanh thu ghi nhận** (`lesson_consumptions`) · **công nợ** (`net_amount − đã trả`).

| Bảng | Vai trò |
|---|---|
| `tuition_packages` | **catalogue gợi ý**. `default_price_per_lesson` chỉ để điền nhanh |
| `student_enrollments` | **hợp đồng học phí** — nơi chứa giá thật của từng học viên |
| `tuition_rates` | **lịch sử đơn giá theo ngày hiệu lực** (D11) |
| `tuition_statements` | **phiếu đối soát tháng** cho hình thức đóng cuối tháng (D1) |
| `lesson_consumptions` | cầu nối dạy học ↔ tiền: mỗi buổi hoàn tất sinh 1 dòng/học viên |
| `payments` | **DÒNG TIỀN VÀO**. `payment_code` tự sinh `TT25090001` |
| `expenses` | chi phí; `payroll_id` để không đếm hai lần với lương giáo viên |

### Hai hình thức đóng học phí (D1)

`student_enrollments.billing_mode`:

| Giá trị | Nghĩa | `lessons_purchased` / `net_amount` | Số buổi còn lại |
|---|---|---|---|
| `prepaid_package` | Mua gói trước ("Gói 10 buổi") | **bắt buộc** | có, được phép ÂM |
| `monthly_postpaid` | Học trước, đối soát cuối tháng ("Cuối tháng") | để trống | không áp dụng (`NULL`) |
| `undetermined` | Chưa chốt | để trống | không áp dụng |

Ràng buộc `chk_enrollment_prepaid_shape` bắt buộc gói trả trước phải có số buổi và
tổng tiền; trả sau theo tháng thì hai cột đó trống vì **chỉ biết khi chốt tháng**.

### Đơn giá học phí có ngày hiệu lực (D11)

`tuition_rates` hoạt động giống `teacher_rates`: `fn_resolve_tuition_rate(enrollment, ngày)`
trả về đơn giá có hiệu lực vào **ngày buổi học diễn ra**, nếu bảng trống thì lấy
`student_enrollments.price_per_lesson`.

Ca thật: Bé Ngân **179.000 ₫ đến 31/08/2026**, rồi **190.000 ₫ từ 01/09/2026**. Buổi
ngày 20/08 ghi nhận 179.000, buổi ngày 05/09 ghi nhận 190.000 — đổi giá không làm
sai doanh thu buổi cũ.

### Lớp nhóm và chiết khấu tháng (D13)

`headcount` (số người) và `monthly_discount_amount` (chiết khấu cố định mỗi tháng).
Lớp nhóm dùng **một hợp đồng** do một người đại diện đóng (`payer_student_id`), nhưng
vẫn là **nhiều học viên riêng** trong `class_students` để điểm danh và nhận xét từng người.

Ca thật Y Khoa: 3 người, 360.000 ₫/buổi cho cả nhóm (= 120.000 × 3), chiết khấu
150.000 ₫/tháng. 7 buổi tháng 7/2026 ⇒ phiếu tháng **2.370.000 ₫**, đúng bằng chứng
từ thật ngày 12/08/2026.

`fn_build_tuition_statement()` chỉ trừ chiết khấu khi tháng đó **thực sự có buổi học** —
tránh tạo ra số phải trả âm cho tháng không dạy.

### Cho học vượt (D7)

`fn_pick_enrollment()` **không** đòi còn buổi. Thứ tự chọn: đúng lớp → cùng chương
trình → còn lại; trong đó gói còn buổi được ưu tiên trước gói đã hết. Hệ quả:

- Học viên có nhiều gói: buổi mới tự trừ vào gói còn buổi (FIFO)
- Học viên hết gói: số buổi còn lại đi xuống **âm**, sinh cảnh báo `lessons_overdrawn` mức KHẨN

`student_enrollments` quan trọng nhất:

| Cột | Ghi chú |
|---|---|
| `lessons_purchased` | `numeric(8,2)` — cho phép nửa buổi |
| `price_per_lesson` | **đơn giá riêng từng học viên**; HV A 250k, HV B 280k, HV giảm giá 190k |
| `gross_amount` | cột GENERATED = `lessons_purchased × price_per_lesson` |
| `net_amount` | số phải trả sau giảm giá |
| `is_migrated_balance` | đánh dấu dòng số dư mở đầu khi di trú từ Google Sheets |

`fn_consume_lesson(attendance_id)` chạy qua trigger khi điểm danh hoặc trạng thái
buổi học thay đổi:

- buổi chưa `completed` hoặc `is_billable = false` → **xoá** dòng đã trừ (hoàn buổi)
- đã có dòng → bỏ qua (không bao giờ đếm hai lần)
- chọn hợp đồng bằng `fn_pick_enrollment()`: ưu tiên hợp đồng gắn đúng lớp → cùng
  chương trình → còn lại, theo FIFO `start_date`
- không có hợp đồng hiệu lực → **không** trừ và **không** ghi nhận doanh thu
  (sẽ lộ ra ở dashboard thay vì âm thầm tính sai)

### 3.6 Lương giáo viên

| Bảng | Vai trò |
|---|---|
| `teacher_payable_lessons` | một dòng/buổi đã dạy, **đơn giá đóng băng** tại thời điểm sinh |
| `teacher_payroll` | kỳ lương: `draft` → `pending_review` → `approved` → `paid` |
| `teacher_payroll_adjustments` | thưởng/trừ; `amount` âm là trừ |

Điều kiện sinh `teacher_payable_lessons` (`fn_generate_payable_lesson`) — **đã đổi
theo D4/D5**:

1. `lessons.status = 'completed'`
2. **có ngày và giờ dạy** — từ `teaching_reports.start_time/end_time` hoặc
   `lessons.actual_start_at/actual_end_at`. Đây là điều kiện CỨNG duy nhất (D5)
3. đã điểm danh cho **toàn bộ** học viên đang hoạt động của lớp

Báo cáo thiếu video / bài tập / nhận xét **vẫn được tính lương** (D4); chỉ gắn cờ
`has_video`, `has_evidence`, `qc_score`, `sent_to_parent` để Founder thấy.

Nếu một trong ba điều kiện mất đi, dòng `pending` bị rút lại. Dòng đã
`included`/`paid` trong kỳ lương đã duyệt thì **không bao giờ** bị sửa — kể cả khi
báo cáo thay đổi về sau.

`teacher_payroll` còn gộp thêm: `lessons_missing_evidence`, `lessons_missing_video`,
`avg_qc_score`, `kpi_target`, `kpi_met` (KPI mặc định 20 buổi/tháng).

Đơn giá do `fn_resolve_teacher_rate()` chọn: theo lớp → theo thời lượng → mặc định.
`rate_source` ghi lại đã dùng loại nào; `missing` nghĩa là chưa cấu hình đơn giá.

Trigger `tg_payroll_guard()` bảo vệ quy trình duyệt:

- chỉ Founder chuyển được sang `approved` / `paid`
- **không** đi trực tiếp từ `draft` sang `paid`
- khi `approved`: tự ghi `approved_by`, `approved_at`
- khi `paid`: toàn bộ buổi trong kỳ chuyển sang `paid`

### 3.7 Lead CRM (bảng dựng sẵn cho Giai đoạn 3)

| Bảng | Ghi chú |
|---|---|
| `leads` | `status`: `new` → `contacted` → `consultation` → `placement_test` → `trial` → `follow_up` → `enrolled` \| `lost`; `converted_student_id` nối sang `students` |
| `lead_activities` | nhật ký liên hệ |
| `placement_tests` | điểm 4 kỹ năng + `result_level_id` |
| `trial_classes` | `outcome` ∈ `enrolled`/`follow_up`/`lost`/`undecided` |

### 3.8 Cảnh báo

`notifications` — `type`, `severity`, `title`, `body`, `entity_type`/`entity_id`,
`payload` (jsonb), `target_role`/`target_user_id`, `status`, `due_at`.

Unique index **một phần** bảo đảm mỗi `(type, entity_type, entity_id)` chỉ có một
cảnh báo đang mở → quét lại nhiều lần không sinh trùng.

`fn_scan_overdue_reports()` tạo cảnh báo đúng định dạng yêu cầu:

```
CẢNH BÁO CHẤT LƯỢNG

Học viên: Tân
Giáo viên: Ms. Sheba
Ngày học: 09/09/2026

Còn thiếu:
- Link recording
- Bài tập về nhà

Đã quá hạn: 10 giờ

Trạng thái: Cần xem xét
```

Nếu báo cáo đã được bổ sung đủ, lần quét kế tiếp **tự đóng** cảnh báo (`resolved`).

---

## 4. View báo cáo

Tất cả đều `security_invoker = on` — RLS của người gọi được áp dụng, nên giáo
viên truy vấn view tài chính chỉ nhận về 0 dòng.

| View | Nội dung |
|---|---|
| `v_enrollment_balances` | theo hợp đồng: buổi đã dùng/còn lại, đã trả, công nợ, doanh thu ghi nhận, **`deferred_revenue`** |
| `v_student_finance` | tổng hợp theo học viên |
| `v_student_overview` | hồ sơ học viên + phụ huynh chính + lớp + giáo viên + tuổi |
| `v_lesson_reports` | buổi học + tình trạng báo cáo + `is_overdue` + `has_recording` + `has_homework` |
| `v_cash_received_daily` | dòng tiền theo ngày |
| `v_revenue_recognized_daily` | doanh thu ghi nhận theo ngày (quy về giờ Việt Nam) |
| `v_expenses_daily` | chi phí theo ngày và hạng mục |
| `v_teacher_payroll_summary` | kỳ lương + số giờ dạy |
| `v_quality_alerts` | cảnh báo báo cáo đang mở |
| `v_data_review` | dòng di trú cần Founder đối soát (D8) |

---

## 5. Row Level Security

RLS được bật trên **toàn bộ 35 bảng** (thêm `tuition_rates`, `tuition_statements`). Không dùng `FORCE ROW LEVEL SECURITY` —
chủ bảng cần bỏ qua RLS để các trigger SECURITY DEFINER (audit, tính lại báo cáo,
sinh buổi tính lương) và các hàm kiểm quyền đọc `users` không bị đệ quy vào chính
policy của mình.

| Nhóm bảng | Founder | Teacher |
|---|---|---|
| Dữ liệu tham chiếu (`roles`, `programs`, `levels`, `tuition_packages`, `settings`) | toàn quyền | chỉ đọc |
| `users` | toàn quyền | đọc & sửa hồ sơ của chính mình, **không đổi được `role_code`** |
| `teachers` | toàn quyền | đọc danh sách, sửa hồ sơ của mình |
| `teacher_rates` | toàn quyền | **chỉ đọc đơn giá của chính mình** |
| `students`, `parents`, `student_parents` | toàn quyền | chỉ đọc học viên trong lớp mình |
| `classes`, `class_students`, `class_schedules` | toàn quyền | chỉ đọc lớp mình |
| `lessons` | toàn quyền | đọc lớp mình; sửa buổi mình dạy (ghi giờ, đánh dấu đã dạy); **không tạo/xoá** |
| `attendance` | toàn quyền | ghi cho buổi mình dạy, **chỉ học viên có trong lớp đó** |
| `teaching_reports`, `teaching_report_students`, `homework`, `recordings` | toàn quyền | đọc/ghi trong phạm vi lớp mình; báo cáo đã `approved` thành chỉ đọc; **không tự chấm được `qc_strengths_deep` / `qc_improvements_deep` / `qc_notes`** |
| `student_enrollments`, `tuition_rates`, `tuition_statements`, `lesson_consumptions`, `payments`, `expenses` | toàn quyền | **không có policy nào ⇒ hoàn toàn vô hình** |
| `teacher_payable_lessons`, `teacher_payroll`, `teacher_payroll_adjustments` | toàn quyền + duyệt | **chỉ đọc của chính mình** |
| `leads`, `lead_activities` | toàn quyền | không truy cập |
| `placement_tests`, `trial_classes` | toàn quyền | chỉ bản ghi mình phụ trách |
| `notifications` | toàn quyền | đọc cảnh báo gửi cho vai trò/cá nhân mình |
| `audit_logs` | chỉ đọc | không truy cập |

Điểm mấu chốt: **không tồn tại policy nào** cho giáo viên trên `payments`,
`expenses`, `student_enrollments`, `tuition_rates`, `tuition_statements`,
`lesson_consumptions`. Lợi nhuận và doanh thu
của trung tâm không thể rò rỉ qua API, kể cả khi code frontend có lỗi.

---

## 6. Kiểm thử

`supabase/tests/smoke.sql` — **146 assertion** chạy trên cluster PostgreSQL sạch,
bao gồm:

- hồ sơ người dùng tự tạo, vai trò mặc định là `teacher`
- hai học viên với hai đơn giá khác nhau (250.000 và 280.000)
- tiền mặt 3.000.000 vào nhưng doanh thu ghi nhận = 0 (chưa dạy buổi nào)
- dạy 1 buổi → trừ 1 buổi, ghi nhận đúng 250.000, tiền mặt **không** đổi
- hạn nộp = giờ kết thúc + 24 giờ (D2)
- báo cáo thiếu + quá hạn → `INCOMPLETE` + cảnh báo đúng nội dung; quét lại không trùng
- bổ sung đủ → `submitted`, sinh buổi tính lương 300.000, vẫn ghi nhận là nộp trễ
- tăng đơn giá sau đó **không** làm sai lương buổi đã dạy
- kỳ lương: tính → điều chỉnh −50.000 → chặn `draft → paid` → duyệt → trả
- vắng có phép không trừ buổi; vắng không phép có trừ; huỷ buổi thì hoàn lại
- RLS: giáo viên không đọc được thanh toán/chi phí/hợp đồng/doanh thu; không thấy
  đơn giá hay bảng lương của giáo viên khác; không tự nâng quyền; không điểm danh
  học viên ngoài lớp

Và các ca nghiệp vụ thật lấy từ Google Sheets (mục 11 của `smoke.sql`):

- **Bé Ngân** — đơn giá đổi giữa kỳ, buổi tháng 8 và tháng 9 ghi nhận hai mức khác nhau
- **Y Khoa** — lớp nhóm 3 người trả sau theo tháng, phiếu tháng 7 ra đúng **2.370.000 ₫**
  bằng chứng từ thật
- **Học vượt** — mua 1 buổi học 2 buổi ⇒ còn lại −1, cảnh báo KHẨN; có gói thứ hai thì
  buổi mới trừ theo FIFO
- **Thiếu giờ dạy** — không vào bảng lương, báo động đỏ gửi riêng giáo viên; bổ sung giờ
  thì vào lương ngay
- **Chưa gửi phụ huynh quá 3 ngày** — có cảnh báo; buổi mới học hôm nay thì chưa
- **Kỳ lương đã trả** — không bị ghi đè khi báo cáo thay đổi về sau
- **Điểm QC** — 2/6 tiêu chí = 33 điểm (chưa đạt), 6/6 = 100 điểm (đạt)
- **RLS** — giáo viên không đọc được `tuition_rates` và `tuition_statements`

Chạy: `./supabase/tests/run-local.sh` (không cần Docker).
