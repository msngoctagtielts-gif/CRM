# DECISIONS.md — Quyết định nghiệp vụ đã được Founder xác nhận

Mỗi dòng dưới đây là một quy tắc **đã được Founder chốt**, không phải giả định.
Khi code và tài liệu khác xung đột với file này, file này đúng.

Giả định chưa xác nhận vẫn nằm ở `PROJECT_PLAN.md` mục 6.

---

## 10/09/2026 — Vòng 1: mô hình nghiệp vụ

| # | Quyết định | Ảnh hưởng |
|---|---|---|
| D1 | **Giữ cả hai hình thức đóng học phí**: "Cuối tháng" (trả sau, đối soát cuối tháng) và "Gói 10 buổi" (trả trước) | `student_enrollments.billing_mode`; thêm bảng `tuition_statements` cho kỳ đối soát tháng |
| D2 | **Hạn nộp báo cáo 24 giờ** (không phải 10 giờ như bản mô tả ban đầu), đúng tham số `GIO_TRE_BAO_CAO` đang dùng | `settings.report_deadline_hours = 24` |
| D3 | **Báo cáo "đủ" chấm theo 6 tiêu chí + điểm QC 0–100, ngưỡng đạt 60**: có video · có timestamp đối chiếu · có trích nguyên văn lời học viên · điểm mạnh đủ sâu · phần cần cải thiện đủ sâu · homework có mẫu câu | Thêm các cột QC vào `teaching_reports`; `qc_score` tính tự động |
| D4 | **Lương vẫn tính dù báo cáo thiếu video/bài tập/nhận xét** — chỉ gắn cờ để Founder thấy | `fn_generate_payable_lesson` bỏ điều kiện báo cáo đủ |
| D5 | **Điều kiện CỨNG để tính lương: giáo viên phải ghi ngày + giờ dạy + tên.** Thiếu thì báo động đỏ ghi thẳng cho giáo viên kèm cảnh báo "không cung cấp thì không tính lương" | Chỉ cần `start_time`/`end_time`; thiếu thì không sinh buổi tính lương và tạo cảnh báo gửi riêng giáo viên đó |
| D6 | **Khi giáo viên đưa link video/record, AI tự viết và điền vào feedback** | Thêm `authored_by` để biết nội dung do giáo viên hay AI viết |
| D7 | **Cho học vượt số tiền đã đóng.** Số buổi còn lại được phép âm, hệ thống tự ghi công nợ và cảnh báo KHẨN | `fn_pick_enrollment` bỏ điều kiện `remaining > 0` |
| D8 | **Nhập dữ liệu cũ nguyên trạng, đánh dấu dòng nghi vấn** để Founder sửa trong hệ thống mới. Không tự đoán số tiền | Thêm `needs_review` + `review_note`; view `v_data_review` |
| D9 | **Tạo Supabase project mới**, không dùng project cũ `yevsupsuelpbodwawfyw`. Dùng gói Free để làm tiếp, **nâng Pro trước khi nhập dữ liệu thật** (gói Free tự tạm dừng khi không dùng và không sao lưu hằng ngày) | ✅ Đã có project `zyzxqthlgrunkxohvhku` (Singapore), 16 migration đã áp |

## 10/09/2026 — Vòng 2: đối soát dữ liệu sheet "CRM ( 10/9)"

| # | Quyết định | Chi tiết |
|---|---|---|
| D10 | **Thảo: 250.000 ₫/buổi** (không phải 249.000 trong danh sách lớp) | Theo bảng giá, căn cứ "Founder chốt 13/08/2026", chứng từ 3 lần × 2.500.000 = 30 buổi |
| D11 | **Bé Ngân: 179.000 ₫ đến 31/08/2026, rồi 190.000 ₫ từ 01/09/2026** | Sửa ô lỗi 1.790.009.190 ₫. Chứng từ: 716.000 = 4 buổi, 1.432.000 = 8 buổi. ⇒ **đơn giá học phí phải có ngày hiệu lực**, không phải một số cố định |
| D12 | **THIENAI-KO (Thiên Ái – Mr. Kobe): tạm ngưng** | Dòng 11 và 21 trùng mã lớp và trùng sheet feedback ⇒ nhập thành một lớp, trạng thái tạm ngưng |
| D13 | **Y Khoa là lớp nhóm 3 người: tách thành 3 học viên riêng** (Ms. Min, Mr. Max, Mr. John) để điểm danh và nhận xét từng người, nhưng **học phí gắn vào một hợp đồng do một người đại diện đóng** | 360.000 ₫/buổi cho cả nhóm − 150.000 ₫/tháng |
| D14 | **Người đóng học phí lớp Y Khoa là Hoàng Uyên — vợ anh Max**, và chị không phải học viên của lớp | Thêm `payer_parent_id` vào hợp đồng (migration 0014). Ràng buộc chỉ cho phép một người đứng tên đóng |

## 10/09/2026 — Đã dựng cơ sở dữ liệu thật

**Supabase project:** `zyzxqthlgrunkxohvhku` · vùng **ap-southeast-1 (Singapore)** ·
PostgreSQL 17.6 · gói Free (0 ₫/tháng)

- 17 migration đã áp, đối chiếu **khớp tuyệt đối** với bản kiểm thử cục bộ trên cả
  12 chỉ số, gồm 4 mã băm MD5 phủ cột+kiểu, tên hàm, tên policy và giá trị enum
- 35 bảng · 10 view · 69 policy RLS · 18 enum · 100 trigger
- Tham số vận hành đã đúng: hạn báo cáo **24 giờ**, ngưỡng QC **60**, KPI **20 buổi/tháng**

> ⚠ Vẫn là gói Free: **tự tạm dừng khi không dùng một thời gian và không có sao lưu
> hằng ngày**. Phải nâng lên Pro **trước khi** nhập dữ liệu học viên thật.

## 10/09/2026 — Sự cố bảo mật đã phát hiện và vá

Supabase Security Advisor báo sau khi áp migration: PostgreSQL mặc định cấp
`EXECUTE` cho `PUBLIC` trên mọi hàm mới. Các migration trước có cấp quyền cho
`authenticated` nhưng **không thu hồi quyền mặc định**, nên vai trò `anon` —
người **chưa đăng nhập**, dùng khoá công khai vốn nằm sẵn trong trình duyệt — gọi
được cả **39 hàm SECURITY DEFINER** qua `/rest/v1/rpc/...`

Hậu quả nếu không vá:

| Hàm | Ai cũng gọi được để làm gì |
|---|---|
| `fn_resolve_teacher_rate` | Đọc **đơn giá lương** của giáo viên |
| `fn_resolve_tuition_rate` | Đọc **đơn giá học phí** của học viên |
| `fn_enrollment_payer_name` | Đọc **tên người đóng tiền** |
| `fn_consume_lesson` | **Buộc ghi nhận doanh thu** cho một buổi học |
| `fn_generate_payable_lesson`, `fn_recalc_payroll` | Can thiệp **bảng lương** |
| `fn_refresh_report_status`, `fn_score_report_qc` | Đổi **trạng thái báo cáo** |

**Đã vá (migration 0015 và 0016):**

1. Thu hồi sạch `EXECUTE` khỏi `PUBLIC`, `anon`, `authenticated`; đặt lại
   default privileges để hàm tạo về sau không tự động mở ra nữa
2. Cấp lại đúng 17 hàm cần thiết cho `authenticated` (hàm dùng trong RLS và view)
3. Hàm quét và sinh cảnh báo: **chỉ service role**. Nút "Quét lại ngay" của
   Founder đi qua server action đã kiểm quyền rồi dùng service role
4. Hai hàm học phí chuyển sang **SECURITY INVOKER** — giáo viên gọi thẳng vẫn
   nhận `NULL` vì phải chịu RLS
5. Cố định `search_path` cho 11 hàm còn thiếu

Advisor sau khi vá: **không còn cảnh báo nào cho `anon`**. 11 hàm còn lại chỉ
trả về thông tin về chính người gọi, hoặc tự kiểm `is_founder()` bên trong.

Bộ kiểm thử có thêm mục 12 chứng minh: `anon` bị chặn cả 7 hàm thử gọi, giáo viên
bị chặn 3 hàm và nhận `NULL` từ 2 hàm học phí, nhưng RLS và trigger vẫn chạy đúng.

## 10/09/2026 — Chặn giáo viên tự chấm chất lượng (migration 0017)

Phát hiện khi làm form báo cáo mới: policy `reports_teacher_update` cho giáo viên
sửa **mọi cột** của báo cáo chưa duyệt. Trong đó có `qc_strengths_deep` và
`qc_improvements_deep` — hai tiêu chí lẽ ra do Founder hoặc AI chấm (D3). Giấu ô
trên giao diện là chưa đủ: giáo viên vẫn gọi thẳng PostgREST được để tự bật cả hai,
đưa điểm QC từ 67 lên 100 và làm **tắt cảnh báo chất lượng gửi Founder**.

Đã vá bằng trigger `trg_guard_qc_verdict`: khi người ghi không phải Founder, ba cột
`qc_strengths_deep`, `qc_improvements_deep`, `qc_notes` giữ nguyên giá trị cũ; mọi
nội dung khác của báo cáo vẫn lưu bình thường. Bộ kiểm thử có thêm mục 13 chứng
minh cả hai chiều: giáo viên bật không ăn thua, Founder bật thì có hiệu lực.

## 10/09/2026 — Chọn Google Gemini cho phần AI viết nhận xét (D6)

Founder yêu cầu: dùng Google AI Studio hoặc bất kỳ cách nào, **miễn là miễn phí**.

Đã chọn **Google Gemini** (`gemini-2.0-flash`) vì Google AI Studio cấp khoá API
miễn phí **không cần thẻ**, và hạn mức miễn phí (khoảng 15 lượt/phút, 1.500
lượt/ngày) xa hơn nhiều so với vài chục buổi mỗi tuần của trung tâm. Phần chạm
mạng gói riêng trong `src/lib/ai/provider.ts` nên đổi nhà cung cấp về sau chỉ sửa
một file.

**Không dùng** các cổng "gọi AI không cần khoá" đang lưu hành: chúng vi phạm điều
khoản của nhà cung cấp, có thể tắt bất cứ lúc nào, và đẩy dữ liệu học viên qua
một bên thứ ba không rõ danh tính.

### Giới hạn phải biết trước: AI không xem được recording trên Google Drive

Gemini đọc trực tiếp được video YouTube, nhưng **không mở được link Google Drive**
vì đó là file riêng tư cần đăng nhập. Trung tâm đang lưu recording trên Drive, nên
phần lớn buổi học rơi vào trường hợp này.

Khi không có nguồn nghe được, hệ thống **để trống trích nguyên văn lời học viên và
timestamp** thay vì để AI điền cho đủ điểm. Trích nguyên văn là một trong 6 tiêu
chí chấm chất lượng nên có áp lực bịa; một câu tiếng Anh bịa ra rồi gửi phụ huynh
như thể con họ đã nói là hỏng lòng tin. Chặn ở hai lớp: prompt cấm bịa, và máy chủ
xoá trích dẫn/timestamp nếu model vẫn cố điền (`enforceNoFabrication`). Lớp thứ
hai mới là lớp bảo đảm — dặn một mô hình ngôn ngữ không phải là bảo đảm.

Cách để có đủ 6 tiêu chí: giáo viên dán bản ghi lời thoại vào form.

### Dữ liệu gửi ra ngoài

Chỉ gửi tên gọi (không gửi họ tên đầy đủ), tuổi, tên lớp, ngày học, nội dung buổi
học, ghi chú giáo viên và transcript nếu có. Không gửi số điện thoại, thông tin
phụ huynh, hay bất kỳ số liệu học phí/lương/doanh thu nào. Chi tiết và cách tắt
hẳn: `docs/AI_SETUP.md`.

### Đã gọi thử thật (10/09/2026)

Founder cấp khoá, đã chạy thử cả hai trường hợp và **đều đúng**: recording trên
Drive thì để trống trích dẫn; có bản ghi lời thoại thì trích đúng câu thật học
viên nói, kể cả câu sai ngữ pháp.

Hai lỗi chỉ lộ ra khi gọi thật, đã vá:

1. `gemini-2.0-flash` **đã bị Google khai tử** (404). Đổi mặc định sang
   `gemini-3.6-flash`. Không dùng bí danh `gemini-flash-latest` vì lúc kiểm nó
   trả 503 quá tải và bí danh có thể đổi model bên dưới mà mình không biết.
2. **Thinking token tính vào `maxOutputTokens`.** Gemini 3.x suy nghĩ trước khi
   trả lời; đo thật 620 token prompt sinh ~1.550 token suy nghĩ để viết ~330
   token nội dung. Hạn mức 2.048 là sát mép, có lần JSON đứt ngang và giáo viên
   mất cả bản nháp. Nâng lên 8.192, báo lỗi riêng khi bị cắt, thử lại một lần
   khi quá tải.

### ⚠ Khoá hiện tại coi như đã lộ

Khoá được dán vào khung chat nên đã nằm trong lịch sử hội thoại. Cần vào
<https://aistudio.google.com/apikey> **xoá khoá cũ và tạo khoá mới**, rồi chỉ đặt
thẳng vào biến môi trường. Khoá chưa bao giờ được ghi vào Git.

---

## Còn thiếu để hoàn tất việc nhập dữ liệu

Những mục này chỉ cần tra cứu, không cần quyết định lớn:

### Lịch học chưa có (6 lớp)
`LINH-PH` (Ms. Linh) · `KIEN-SH` (Kiên) · `VY-SH` (Vy) · `NHI-PH` (Nhi) · `THIENAI-KO` (Thiên Ái)

### Thiếu giờ kết thúc (3 lớp) — tạm hiểu là 60 phút, cần xác nhận
| Lớp | Ô gốc | Tôi hiểu là |
|---|---|---|
| `PHUC-PH` | `CN 10h15` | Chủ nhật 10:15–11:15 |
| `NGOC-HO` | `T3, T5, T7 6pm` | Thứ Ba/Năm/Bảy 18:00–19:00 |
| `HANG-PH` | `T3, T5, T6 2pm` | Thứ Ba/Năm/Sáu 14:00–15:00 |

### Không rõ sáng hay chiều (1 lớp)
`TAN-SH` — `T7 9:30-10:30 & CN 4:30-5:30`. Buổi Chủ nhật là **16:30–17:30** hay **04:30–05:30**?

### Khác
- `NGOC-HO` (Bảo Ngọc): hình thức đóng ghi **"Chưa xác định"** — Cuối tháng hay Gói?
- **Công Duy**: có trong bảng giá (chưa có học phí) nhưng không có lớp nào trong file mới. Còn học không?
- **Ms. Tuyết (Golf)**: trạng thái "đang đợi", chưa có mã lớp ⇒ tôi nhập thành *lead*, không phải học viên
- **Nâng Supabase lên gói Pro** trước khi nhập dữ liệu thật (gói Free tự tạm dừng, không sao lưu)
- **Số dư mở đầu**: bảng giá chỉ có mốc "đã đóng đủ đến ngày" cho 2 người (Bé Ngân 31/08/2026, Y Khoa 31/07/2026). 16 học viên còn lại cần lấy từ tab "LỊCH SỬ THANH TOÁN" — tôi sẽ tự đọc, không cần cô làm gì
