# MNEE Management System — Kế hoạch dự án

**Doanh nghiệp:** Ms.Ngọc Elite English
**Triết lý thương hiệu:** *"Thấu hiểu để dẫn lối."*
**Loại hình:** Trung tâm tiếng Anh online cao cấp, quy mô nhỏ
**Tài liệu này:** kiến trúc hệ thống + lộ trình triển khai theo giai đoạn

---

## 0. Hiện trạng khi bắt đầu (đã kiểm tra)

| Hạng mục | Tình trạng thực tế |
|---|---|
| Repository `msngoctagtielts-gif/CRM` | **Rỗng hoàn toàn** — không có commit nào, không có file nào ngoài `.git` |
| Mã nguồn hiện có | **Không có.** Không có gì để ghi đè hay phá vỡ |
| Supabase project | Tồn tại 1 project: `yevsupsuelpbodwawfyw` (region `ap-southeast-2`, Postgres 17.6) — trạng thái **INACTIVE (đang tạm dừng)** nên chưa đọc được schema |
| Dữ liệu vận hành hiện tại | Đang nằm ở Google Sheets (theo mô tả của Founder) — **chưa được kiểm chứng bằng dữ liệu thật** |
| CI/CD | Chưa có |

> **Kết luận:** đây là dự án greenfield. Không có chức năng đang chạy nào bị xoá hay ghi đè trong lần triển khai này.

---

## 1. Kiến trúc hệ thống

### 1.1 Nguyên tắc thiết kế

1. **Một nguồn sự thật duy nhất** — mọi con số tài chính đều suy ra từ giao dịch gốc (`payments`, `lesson_consumptions`, `expenses`), không nhập tay số tổng.
2. **Bảo mật ở tầng database** — Row Level Security là hàng rào cuối cùng. Tầng ứng dụng kiểm tra quyền thêm một lần nữa, nhưng không phải là hàng rào duy nhất.
3. **Modular** — mỗi nghiệp vụ là một module độc lập: `students`, `classes`, `reports`, `finance`, `payroll`, `leads`.
4. **Sẵn sàng cho tự động hoá** — mọi logic nghiệp vụ quan trọng (cảnh báo báo cáo trễ, sinh buổi dạy tính lương) nằm trong Postgres function, gọi được từ n8n qua API route bảo vệ bằng secret.
5. **Vietnamese first, English ready** — toàn bộ chuỗi hiển thị đi qua một từ điển (`src/lib/i18n`), không hard-code tiếng Việt rải rác trong component.

### 1.2 Sơ đồ tầng

```
┌──────────────────────────────────────────────────────────────┐
│  TRÌNH DUYỆT (desktop / iPad / mobile)                       │
│  Next.js App Router · React 19 · TypeScript · Tailwind v4    │
│  - Server Components đọc dữ liệu (mặc định)                  │
│  - Client Components chỉ cho form & biểu đồ                  │
└───────────────┬──────────────────────────────────────────────┘
                │ cookie phiên (Supabase Auth, httpOnly)
┌───────────────▼──────────────────────────────────────────────┐
│  TẦNG SERVER NEXT.JS (chạy trên server, không lộ ra browser) │
│  - middleware.ts        → làm mới phiên, chặn route          │
│  - Server Actions       → toàn bộ ghi dữ liệu + kiểm quyền   │
│  - Route Handlers /api  → webhook & cron cho n8n             │
│  Dùng ANON KEY + phiên người dùng ⇒ RLS luôn có hiệu lực     │
└───────────────┬──────────────────────────────────────────────┘
                │ PostgREST / SQL
┌───────────────▼──────────────────────────────────────────────┐
│  SUPABASE                                                     │
│  Auth (email + mật khẩu)                                      │
│  PostgreSQL 17 + RLS + trigger + function + view              │
│  Storage (giai đoạn sau — hiện dùng URL Google Drive)         │
└──────────────────────────────────────────────────────────────┘
                ▲
                │ HTTPS + CRON_SECRET
┌───────────────┴──────────────────────────────────────────────┐
│  n8n (giai đoạn 4) — nhắc nhở Zalo, cảnh báo, đồng bộ Sheets │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Vì sao chọn như vậy

| Quyết định | Lý do | Đánh đổi đã chấp nhận |
|---|---|---|
| Next.js App Router + Server Components | Dữ liệu tài chính không bao giờ rời server trừ khi đã lọc theo quyền | Đường cong học tập cao hơn Pages Router |
| Server Actions thay vì REST API riêng | Ít tầng hơn, gõ kiểu đầu-cuối, dễ bảo trì cho đội nhỏ | Khó tái dùng cho app mobile native sau này (chấp nhận: đã có `/api` cho n8n) |
| RLS làm hàng rào chính | Kể cả khi code frontend có lỗi, giáo viên vẫn không đọc được lợi nhuận | Debug policy phức tạp hơn |
| Không dùng ORM (Prisma/Drizzle) | Supabase client + type sinh tự động đã đủ; tránh 2 nguồn định nghĩa schema | Query phức tạp phải viết SQL/view |
| Migration file trong repo | Không bao giờ sửa cấu trúc production bằng tay | Bắt buộc kỷ luật khi thay đổi schema |
| Tiền lưu bằng `numeric(14,2)` VND | Không sai số dấu phẩy động khi cộng dồn doanh thu | Phải ép kiểu khi tính toán ở JS |

### 1.4 Cây thư mục

```
/
├─ PROJECT_PLAN.md            ← tài liệu này
├─ DATABASE_SCHEMA.md         ← đặc tả CSDL đầy đủ
├─ IMPLEMENTATION_STATUS.md   ← cái gì đã xong, cái gì chưa
├─ TODO.md                    ← việc tiếp theo, có thứ tự ưu tiên
├─ supabase/
│  └─ migrations/             ← nguồn sự thật của schema (đánh số tăng dần)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/        ← đăng nhập
│  │  ├─ (app)/               ← khu vực cần đăng nhập
│  │  │  ├─ dashboard/        ← bảng điều khiển Founder
│  │  │  ├─ students/         ← CRM học viên
│  │  │  ├─ teachers/         ← giáo viên + đơn giá
│  │  │  ├─ classes/          ← lớp & lịch học
│  │  │  ├─ lessons/          ← buổi học, điểm danh
│  │  │  ├─ reports/          ← báo cáo giảng dạy (mobile-first)
│  │  │  ├─ payments/         ← thu học phí
│  │  │  ├─ expenses/         ← chi phí
│  │  │  └─ alerts/           ← cảnh báo chất lượng
│  │  └─ api/cron/            ← điểm gọi cho n8n / Vercel Cron
│  ├─ components/             ← UI dùng chung (card, table, badge, form)
│  ├─ lib/
│  │  ├─ supabase/            ← client cho browser / server / admin
│  │  ├─ auth/                ← lấy người dùng + kiểm quyền phía server
│  │  ├─ i18n/                ← từ điển vi / en
│  │  └─ format.ts            ← tiền tệ, ngày giờ theo VN
│  └─ types/database.types.ts ← sinh từ Supabase CLI
└─ .github/workflows/ci.yml   ← typecheck + build mỗi lần push
```

---

## 2. Vai trò & phân quyền

| | Founder / Admin | Teacher | Staff (P3) | Parent (P5) |
|---|---|---|---|---|
| Học viên | Toàn bộ | Chỉ HV lớp mình dạy | Toàn bộ, không xem tài chính | Chỉ con mình |
| Lớp học | Toàn bộ | Chỉ lớp mình | Toàn bộ | Chỉ lớp của con |
| Báo cáo giảng dạy | Xem tất cả | Tạo/sửa của mình | Xem | Xem (đã duyệt) |
| Điểm danh | Toàn bộ | Ghi cho lớp mình | Xem | Xem |
| Học phí & thanh toán | Toàn bộ | **Không** | Xem công nợ | Chỉ của con mình |
| Chi phí | Toàn bộ | **Không** | Không | Không |
| Lương giáo viên | Toàn bộ + duyệt | **Chỉ của chính mình** | Không | Không |
| Doanh thu / Lợi nhuận | Toàn bộ | **Không** | Không | Không |
| Lead CRM | Toàn bộ | Không | Toàn bộ | Không |

Bốn vai trò được lưu trong bảng `roles`; `staff` và `parent` đã có sẵn trong bảng và trong hàm RLS nhưng **chưa cấp quyền ghi** ở Giai đoạn 1.

---

## 3. Nguyên tắc tài chính (quan trọng nhất)

Ba khái niệm **không được trộn lẫn**:

| Khái niệm | Định nghĩa | Nguồn dữ liệu |
|---|---|---|
| **Tiền mặt đã thu** (Cash Received) | Tiền thực tế đã vào tài khoản/két | `payments.amount` theo `payment_date` |
| **Doanh thu ghi nhận** (Revenue Recognized) | Phần học phí đã "dạy xong" | `lesson_consumptions.recognized_amount` theo `recognized_at` |
| **Công nợ học phí** (Outstanding) | Đã cam kết nhưng chưa trả | `student_enrollments.net_amount − Σ payments` |

**Ví dụ.** Học viên đóng 3.000.000đ cho 12 buổi, đơn giá 250.000đ/buổi.

- Ngày đóng tiền: `Tiền mặt đã thu += 3.000.000`, `Doanh thu ghi nhận += 0`, `Công nợ = 0`
- Sau buổi 1 (có điểm danh hợp lệ): `Doanh thu ghi nhận += 250.000`
- Sau 12 buổi: `Doanh thu ghi nhận = 3.000.000`, học phí trả trước còn lại (deferred revenue) = 0

Bảng `lesson_consumptions` chính là cầu nối: mỗi buổi học hoàn tất sinh đúng một dòng cho mỗi học viên có mặt, ghi số buổi trừ và số tiền được ghi nhận theo **đơn giá của chính hợp đồng học viên đó** — không có giá cố định toàn hệ thống.

---

## 4. Lộ trình theo giai đoạn

### Giai đoạn 1 — Nền tảng vận hành *(phạm vi của lần triển khai này)*
Xác thực · CSDL nền · Học viên · Giáo viên · Lớp học · Buổi học & điểm danh · **Báo cáo giảng dạy hằng ngày** · Thanh toán · Chi phí · Dashboard Founder cơ bản · Cảnh báo chất lượng 10 giờ

### Giai đoạn 2 — Học phí & lương
Gói học phí · Hợp đồng ghi danh · Số buổi còn lại · Ghi nhận doanh thu theo buổi · Bảng lương giáo viên tự động · Báo cáo tài chính đầy đủ

> *Bảng của Giai đoạn 2 đã được tạo sẵn trong migration ở Giai đoạn 1* để không phải sửa cấu trúc production về sau. Giao diện của Giai đoạn 2 mới là phần chưa làm.

### Giai đoạn 3 — Lead CRM
Pipeline tuyển sinh · Kiểm tra đầu vào · Học thử · Chuyển đổi lead → học viên

### Giai đoạn 4 — Tự động hoá
n8n · Nhắc học phí · Cảnh báo Zalo/Telegram · Di trú dữ liệu từ Google Sheets

### Giai đoạn 5 — Cổng phụ huynh / học viên
Báo cáo học tập · Recording · Phân tích bằng AI

---

## 5. Rủi ro đã nhận diện

| # | Rủi ro | Mức độ | Cách xử lý |
|---|---|---|---|
| R1 | Supabase project đang **INACTIVE** — chưa xác minh được có dữ liệu cũ hay không | **Cao** | Chưa áp migration lên project đó. Cần Founder xác nhận trước (xem mục "Cần Founder trả lời") |
| R2 | Giáo viên không nộp báo cáo → dữ liệu lương và chất lượng bị thủng | Cao | Cảnh báo tự động sau 10 giờ + dashboard cảnh báo + form mobile-first tối giản thao tác |
| R3 | Trộn lẫn tiền mặt và doanh thu → Founder ra quyết định sai | Cao | Tách 3 khái niệm từ tầng CSDL, không cho tổng hợp chung một cột |
| R4 | Di trú từ Google Sheets sai lệch số dư buổi học | Trung bình | Nhập số dư mở đầu như một `student_enrollments` riêng có ghi chú "số dư di trú", đối chiếu tay trước khi chốt |
| R5 | Rò rỉ service role key ra frontend | Cao | Key chỉ dùng trong `src/lib/supabase/admin.ts`, file có chốt chặn `import 'server-only'` |
| R6 | Đơn giá giáo viên thay đổi giữa kỳ làm lương tính sai hồi tố | Trung bình | `teacher_rates` có `effective_from`/`effective_to`; số tiền được **đóng băng** vào `teacher_payable_lessons` tại thời điểm sinh dòng |
| R7 | Buổi học bị huỷ/dời làm trừ nhầm buổi | Trung bình | Chỉ `attendance.is_billable = true` mới sinh `lesson_consumptions`; huỷ có lý do được ghi log |
| R8 | Múi giờ — deadline 10 giờ tính sai | Trung bình | Toàn bộ mốc thời gian lưu `timestamptz`; hiển thị theo `Asia/Ho_Chi_Minh` |

---

## 6. Giả định đã ghi nhận (chưa được Founder xác nhận)

Những điểm dưới đây **là giả định**, không phải quy tắc nghiệp vụ đã được duyệt. Đã ghi lại thay vì tự bịa ra rồi coi là đúng.

| # | Giả định | Ảnh hưởng nếu sai |
|---|---|---|
| A1 | Tiền tệ duy nhất là **VND**, không có ngoại tệ | Phải thêm bảng tỷ giá |
| A2 | Múi giờ vận hành **Asia/Ho_Chi_Minh (UTC+7)** | Sai toàn bộ deadline & lịch |
| A3 | Deadline báo cáo **10 giờ** tính từ **giờ kết thúc thực tế**; nếu giáo viên không bấm giờ kết thúc thì tính từ **giờ kết thúc theo lịch** | Cảnh báo sai thời điểm |
| A4 | Ba trường bắt buộc để báo cáo được coi là ĐỦ: **bài tập về nhà, link recording, nhận xét giáo viên** | Cảnh báo sai/thiếu |
| A5 | Học viên vắng **không báo trước** vẫn **bị trừ buổi** (`is_billable = true`); vắng **có phép** thì **không trừ** | Sai số dư buổi học của học viên |
| A6 | Giáo viên **vẫn được tính lương** cho buổi học viên vắng không phép (vì giáo viên đã có mặt) | Sai bảng lương |
| A7 | Lớp nhóm: lương giáo viên tính **theo buổi dạy**, không nhân theo số học viên | Sai bảng lương lớp nhóm |
| A8 | Một học viên có thể học **nhiều chương trình song song** ⇒ nhiều hợp đồng `student_enrollments` cùng lúc | Phải chuyển sang mô hình 1-1 |
| A9 | Một tài khoản người dùng có **đúng một vai trò** | Founder kiêm dạy phải có 2 tài khoản |
| A10 | Buổi học được coi là **hoàn tất** khi trạng thái = `completed` **và** đã có điểm danh cho toàn bộ học viên | Sinh lương/doanh thu sai thời điểm |
| A11 | Buổi học chỉ được tính lương khi báo cáo **đã đủ** toàn bộ trường bắt buộc. Báo cáo `INCOMPLETE` làm buổi đó **chưa** vào bảng lương (bổ sung đủ thì tự vào lại) | Nếu sai: lương phải tính ngay cả khi báo cáo thiếu |
| A12 | Buổi học của học viên **không có hợp đồng học phí hiệu lực** thì **không** trừ buổi và **không** ghi nhận doanh thu (hiện lên như dữ liệu thiếu, thay vì âm thầm tính sai) | Nếu sai: cần cho phép số dư buổi âm |

---

## 7. Cần Founder trả lời trước khi triển khai lên production

1. **Supabase project `yevsupsuelpbodwawfyw` đang tạm dừng.** Đó là project trống dùng cho hệ thống này, hay đang chứa dữ liệu thật? Có được phép kích hoạt lại và áp migration lên đó không, hay cần tạo project mới?
2. Xác nhận hay sửa lại các giả định **A1–A10** ở trên.
3. Danh sách chương trình học thật (`programs`) và hệ cấp độ (`levels`) đang dùng — hiện mới có dữ liệu mẫu theo CEFR.
4. Cách tính lương giáo viên chính xác: theo đơn giá/buổi theo thời lượng, hay có thêm phụ cấp/thưởng cố định?
5. Chính sách trừ buổi khi học viên báo vắng trước bao nhiêu giờ?
6. Chu kỳ trả lương (theo tháng dương lịch, hay từ ngày X đến ngày Y)?
7. File Google Sheets hiện tại — cần một bản xuất mẫu để thiết kế script di trú ở Giai đoạn 4.
