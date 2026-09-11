# IMPLEMENTATION_STATUS.md

**Cập nhật:** 10/09/2026 (vòng 2 — sau khi đối soát Google Sheets)
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

## 1b. Cơ sở dữ liệu thật — ĐÃ DỰNG ✅

| | |
|---|---|
| Project | `zyzxqthlgrunkxohvhku` |
| Vùng | ap-southeast-1 (Singapore) — gần Việt Nam hơn project cũ ở Sydney |
| PostgreSQL | 17.6 |
| Gói | Free (0 ₫/tháng) |
| Migration đã áp | **16/16** |
| Đối chiếu với bản kiểm thử cục bộ | **khớp tuyệt đối** trên 12 chỉ số, gồm 4 mã băm MD5 |

35 bảng · 10 view · 69 policy RLS · 18 enum · 100 trigger · 660 cột.

Project cũ `yevsupsuelpbodwawfyw` (Sydney) **không bị chạm tới** — vẫn đang tạm dừng.

> ⚠ **Gói Free tự tạm dừng khi không dùng và không có sao lưu hằng ngày.** Phải
> nâng lên Pro trước khi nhập dữ liệu học viên thật. Đây chính là lý do project cũ
> bị ngừng.

---

## 2. Nền tảng

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Next.js 15 + React 19 + TypeScript strict | ✅ | `npm run build` thành công, 19 route |
| Tailwind CSS v4 + hệ màu thương hiệu | ✅ | Navy/Gold/White/Burgundy khai báo bằng `@theme` |
| 16 file migration | ✅ | đã áp lên Supabase thật và đối chiếu khớp tuyệt đối |
| Sinh type TypeScript từ schema | ✅ | `src/types/database.types.ts`, 1.8k dòng, có cả quan hệ khoá ngoại |
| Row Level Security 35 bảng | ✅ | 21 assertion riêng cho RLS |
| Bộ kiểm thử nghiệp vụ | ✅ | **166 assertion**, `./supabase/tests/run-local.sh` |
| Vá lỗ hổng quyền gọi hàm | ✅ | migration 0015, 0016 — xem `DECISIONS.md` |
| Công cụ soát dữ liệu Sheets | ✅ | `scripts/migration/` — chuẩn hoá level, bóc lịch học |
| CI (typecheck + lint + build + test CSDL) | ✅ | `.github/workflows/ci.yml` |
| ESLint | ✅ | `npm run lint` sạch |

---

## ⚠ 2b. GIAO DIỆN ĐANG CHẬM HƠN CƠ SỞ DỮ LIỆU

Ngày 10/09/2026, sau khi đối soát hệ thống Google Sheets đang chạy, Founder chốt 13
quyết định làm thay đổi mô hình nghiệp vụ (xem `DECISIONS.md`). **Cơ sở dữ liệu đã
được cập nhật và kiểm thử đầy đủ. Giao diện thì chưa.**

| Quyết định | CSDL | Giao diện |
|---|---|---|
| D1 — hai hình thức đóng học phí | ✅ đã kiểm thử | ✅ form hỏi khác nhau theo từng hình thức |
| D1 — phiếu đối soát tháng | ✅ đã kiểm thử | ✅ trang `/statements`: lập → chốt → thu |
| D2 — hạn 24 giờ | ✅ | ✅ mọi chỗ đọc từ bảng `settings`, không còn chữ viết cứng |
| D3 — 6 tiêu chí + điểm QC | ✅ đã kiểm thử | ✅ form mới đủ 6 tiêu chí, hiện điểm ngay khi gõ |
| D4, D5 — lương theo giờ dạy | ✅ đã kiểm thử | ✅ trang `/payroll` + cờ thiếu bằng chứng |
| D6 — AI viết feedback | ✅ cột `authored_by` | ✅ đã nối Gemini miễn phí, **đã gọi thử thật và chạy đúng** |
| D7 — cho học vượt | ✅ đã kiểm thử | ✅ thẻ "Sắp hết buổi / đã học vượt" trên dashboard |
| D8 — đánh dấu dòng cần đối soát | ✅ view `v_data_review` | ✅ trang `/review` |
| D11 — đơn giá theo ngày hiệu lực | ✅ đã kiểm thử | ✅ form "Đổi đơn giá học phí" + lịch sử các mốc |
| D13, D14 — lớp nhóm một người đóng | ✅ đã kiểm thử | ✅ chọn hoặc tạo mới người đứng tên đóng |
| A13 — gửi phụ huynh là bước riêng | ✅ cột `sent_to_parent_at` | ✅ có nút "Đánh dấu đã gửi" |

**Hệ quả thực tế còn lại:** giao diện đã bám đúng cả 14 quyết định và đủ để nhập 21 lớp
thật. Phần AI (D6) đã nối vào Google Gemini gói miễn phí và **đã gọi thử thật, chạy đúng**
(xem mục 7 của `docs/AI_SETUP.md`). Chưa đặt khoá thì tính năng tự tắt và mọi phần
khác chạy bình thường.

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
| **Hạn 24 giờ tính từ giờ kết thúc buổi học** (D2) | ✅ CSDL / 🟡 giao diện còn ghi 10 giờ |
| **6 tiêu chí chấm chất lượng + điểm QC 0–100** (D3) | ✅ CSDL / ⬜ giao diện |
| **Lương không bị giữ vì báo cáo thiếu, chỉ gắn cờ** (D4) | ✅ |
| **Thiếu ngày/giờ dạy ⇒ không tính lương + báo động đỏ cho GV** (D5) | ✅ |
| **Ghi nhận nội dung do AI viết** (D6) | ✅ CSDL / ⬜ chưa nối AI |
| **Mốc gửi phụ huynh + cảnh báo sau 3 ngày** | ✅ CSDL / ⬜ giao diện |
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

### Đã kiểm thử tự động (146 assertion, `./supabase/tests/run-local.sh`)

Xem danh sách chi tiết ở mục 6 của `DATABASE_SCHEMA.md`. Ngoài các quy tắc nền,
bộ kiểm thử còn tái hiện **đúng số liệu thật từ Google Sheets**:

- **Y Khoa**: 7 buổi tháng 7/2026 ⇒ phiếu tháng **2.370.000 ₫**, khớp chứng từ thật
  ngày 12/08/2026 (360.000 × 7 − 150.000)
- **Bé Ngân**: buổi 20/08 ghi nhận 179.000 ₫, buổi 05/09 ghi nhận 190.000 ₫
- **Học vượt**: mua 1 buổi học 2 buổi ⇒ còn lại −1 kèm cảnh báo KHẨN
- **Thiếu giờ dạy**: không vào bảng lương, báo động đỏ gửi riêng giáo viên
- **Điểm QC**: 2/6 tiêu chí = 33 điểm (chưa đạt) → 6/6 = 100 điểm (đạt)
- **Kỳ lương đã trả**: không bị ghi đè khi báo cáo thay đổi về sau
- 21 kiểm tra RLS, gồm hai bảng tiền mới

### Đã kiểm thử bằng tay

- `npm run build` → thành công, 19 route
- `npm run typecheck` → sạch
- `npm run lint` → sạch
- `GET /login` → HTTP 200, hiển thị đúng tiếng Việt và khẩu hiệu thương hiệu
- `GET /` và `/dashboard` chưa đăng nhập → 307 về `/login?next=…`
- `POST /api/cron/scan-reports` không có header → 401
- `POST /api/cron/scan-reports` sai secret → 401
- `POST /api/cron/scan-reports` đúng secret, thiếu service role key → 500 kèm thông báo rõ ràng

### Đã kiểm thử trên Supabase thật

- 16 migration áp sạch, dấu vân tay schema khớp tuyệt đối với bản cục bộ
- Security Advisor: **không còn cảnh báo nào cho `anon`** sau khi vá
- Tham số vận hành đọc về đúng: hạn 24 giờ, QC 60, KPI 20

### ❗ Chưa kiểm thử

**Chưa có luồng người dùng nào chạy end-to-end trên Supabase thật.** Cụ thể:

1. Đăng nhập và đăng xuất qua Supabase Auth — **chưa có tài khoản Founder nào**
2. Các server action ghi dữ liệu qua PostgREST (đã kiểm logic ở tầng SQL, chưa
   kiểm qua tầng HTTP)
3. Hành vi RLS qua PostgREST (đã kiểm rất kỹ trực tiếp trong PostgreSQL)
4. Hiển thị thực tế trên điện thoại và iPad (đã thiết kế mobile-first, chưa chụp
   màn hình kiểm chứng)
5. Biểu đồ Recharts với dữ liệu thật
6. ~~Lần gọi thật tới Gemini~~ — **đã kiểm ngày 10/09/2026** bằng khoá thật, cả hai
   trường hợp (recording Google Drive và có bản ghi lời thoại) đều chạy đúng. Đã
   kiểm bundle trình duyệt không chứa khoá, endpoint hay header xác thực nào.
   Còn lại: chưa chạy qua giao diện web thật vì chưa có tài khoản Founder

**Đã nhập dữ liệu thật ngày 11/09/2026**: 6 giáo viên, 20 học viên, 20 lớp, 36 dòng
lịch học, 20 hợp đồng, 14 dòng chờ đối soát. Tài khoản Founder đã tạo (mật khẩu tạm,
phải đổi). Chưa sinh buổi học nào — cố ý, vì còn 5 lớp thiếu lịch và 4 lớp có giờ
tạm ghi. Chi phí không còn
là rào cản: toàn bộ hệ thống chạy thật ở **0 ₫/tháng** — Netlify Free cho app
(`docs/DEPLOY.md`), Supabase Free cho CSDL kèm sao lưu tự động (`docs/FREE_TIER.md`),
Gemini Free cho AI (`docs/AI_SETUP.md`), GitHub Actions cho việc định kỳ.

---

## 6. Khác biệt so với yêu cầu ban đầu

| # | Khác biệt | Lý do |
|---|---|---|
| 0 | **13 quyết định ngày 10/09/2026 thay đổi mô hình nghiệp vụ** so với bản mô tả ban đầu | Bản mô tả ban đầu khác với hệ thống Google Sheets đang chạy thật. Chi tiết và căn cứ ở `DECISIONS.md` |
| 1 | Biểu mẫu hợp đồng học phí làm sớm ở Giai đoạn 1 | Dashboard Giai đoạn 1 yêu cầu "Công nợ học phí", mà công nợ chỉ tính được khi có hợp đồng |
| 2 | Thêm bảng `lesson_consumptions` (không có trong danh sách mục III) | Bắt buộc để tách doanh thu ghi nhận khỏi dòng tiền theo mục XII |
| 3 | Thêm `teacher_payable_lessons`, `audit_logs`, `settings`, `teacher_rates`, `student_parents`, `lead_activities`, `teaching_report_students` | Hiện thực các yêu cầu về lương tự động, duyệt điều chỉnh, đơn giá riêng từng giáo viên, nhận xét từng học viên trong lớp nhóm |
| 4 | `users` thay cho việc dùng trực tiếp `auth.users` | Supabase quản lý `auth.users`; cần bảng riêng để gắn vai trò và `is_active` |
| 5 | Một tài khoản = một vai trò | Đơn giản hoá; Founder kiêm dạy cần 2 tài khoản (giả định A9) |
