# MNEE Management System

Hệ thống quản lý nội bộ cho **Ms.Ngọc Elite English** — trung tâm tiếng Anh online cao cấp.

> *"Thấu hiểu để dẫn lối."*

Một nơi duy nhất để quản lý học viên, giáo viên, lớp học, báo cáo giảng dạy, học phí,
chi phí và tình hình tài chính của trung tâm.

---

## Tài liệu

| File | Nội dung |
|---|---|
| [`PROJECT_PLAN.md`](PROJECT_PLAN.md) | Kiến trúc hệ thống, phân quyền, nguyên tắc tài chính, rủi ro, giả định |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Đặc tả đầy đủ cơ sở dữ liệu và Row Level Security |
| [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) | Cái gì đã xong, đã kiểm thử, còn thiếu |
| [`TODO.md`](TODO.md) | Việc tiếp theo theo thứ tự ưu tiên |
| [`supabase/README.md`](supabase/README.md) | Quy trình migration và sao lưu |

---

## Công nghệ

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** — hệ màu Navy / Gold / White / Burgundy
- **Supabase** — PostgreSQL 17, Auth, Row Level Security
- **Recharts** cho biểu đồ · **Zod** cho kiểm tra dữ liệu đầu vào

Mọi thao tác ghi đi qua **Server Action** có kiểm quyền; mọi thao tác đọc đi qua
**Row Level Security**. Service role key chỉ dùng trong cron job.

---

## Chạy trên máy

```bash
# 1. Cài phụ thuộc
npm install

# 2. Cấu hình môi trường
cp .env.example .env.local
#    rồi điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Áp cấu trúc CSDL lên Supabase project
supabase link --project-ref <project-ref>
supabase db push

# 4. Tạo tài khoản Founder trong Supabase Studio → Authentication → Users,
#    rồi nâng quyền:
#    update public.users set role_code = 'founder' where email = '<email>';

# 5. Chạy
npm run dev
```

## Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | chạy môi trường phát triển |
| `npm run build` | build bản production |
| `npm run typecheck` | kiểm tra kiểu TypeScript |
| `npm run lint` | kiểm tra ESLint |
| `npm run test:unit` | kiểm thử phần logic AI (không cần mạng, không cần khoá) |
| `./supabase/tests/run-local.sh` | kiểm thử nghiệp vụ trên PostgreSQL tạm (không cần Docker) |
| `./scripts/backup/dump.sh` | sao lưu CSDL ra tệp đã mã hoá (xem `docs/FREE_TIER.md`) |
| `./scripts/backup/restore.sh` | phục hồi từ bản sao lưu |
| `npm run db:types` | sinh lại type từ Supabase (cần Docker) |
| `python3 scripts/gen-types.py <DB_URL>` | sinh lại type khi không có Docker |
| `./supabase/tests/run-local.sh` | **chạy 86 kiểm thử nghiệp vụ** trên PostgreSQL tạm |

---

## Vai trò

| Vai trò | Thấy được |
|---|---|
| **Founder / Admin** | Toàn bộ: tài chính, lợi nhuận, lương, học viên, cảnh báo, duyệt điều chỉnh |
| **Teacher** | Chỉ lớp và học viên được phân công. Nộp báo cáo giảng dạy, điểm danh, giao bài tập, thêm recording. **Không thấy** doanh thu, chi phí, lợi nhuận, hay lương của giáo viên khác |
| **Staff** | Giai đoạn 3 |
| **Parent / Student** | Giai đoạn 5 |

Phân quyền được thực thi ở **tầng database** (Row Level Security), không chỉ ở giao
diện — một lỗi ở frontend cũng không làm rò rỉ số liệu tài chính.

---

## Hai điều quan trọng nhất cần hiểu

### 1. Tiền mặt ≠ Doanh thu

| Khái niệm | Nguồn dữ liệu |
|---|---|
| Tiền mặt đã thu | `payments` |
| Doanh thu ghi nhận | `lesson_consumptions` — chỉ phát sinh khi buổi học đã dạy |
| Công nợ học phí | `student_enrollments.net_amount − tổng đã thanh toán` |

Học viên đóng 3.000.000đ cho 12 buổi: tiền mặt tăng 3.000.000 ngay, nhưng doanh
thu chỉ được ghi nhận 250.000đ mỗi buổi sau khi dạy. Phần chênh lệch là **nghĩa vụ
phải dạy**, không phải lợi nhuận.

### 2. Hạn nộp báo cáo 10 giờ

Khi giáo viên đánh dấu buổi học đã dạy xong, hệ thống đặt hạn nộp báo cáo là **giờ
kết thúc + 10 giờ**. Sau hạn đó, nếu còn thiếu **bài tập về nhà**, **link recording**
hoặc **nhận xét giáo viên**, báo cáo tự chuyển thành `INCOMPLETE` và sinh một cảnh
báo chất lượng gửi tới Founder. Buổi học có báo cáo chưa đủ cũng **không** được tính
vào lương.

Việc quét cần được gọi định kỳ — xem [`supabase/README.md`](supabase/README.md).

---

## Kiểm thử

```bash
./supabase/tests/run-local.sh
```

Dựng một cluster PostgreSQL tạm (không cần Docker), áp toàn bộ migration, rồi chạy
**86 assertion** về nghiệp vụ: logic học phí, ghi nhận doanh thu, hạn báo cáo 10
giờ, cảnh báo chất lượng, tính lương, và 19 kiểm tra Row Level Security.

---

## An toàn dữ liệu

- Không bao giờ sửa cấu trúc database production bằng tay — luôn qua migration
- `SUPABASE_SERVICE_ROLE_KEY` chỉ tồn tại ở phía server (`src/lib/supabase/admin.ts`
  có chốt `import 'server-only'`)
- Mọi thay đổi quan trọng được ghi vào `audit_logs`
- Row Level Security bật trên toàn bộ 33 bảng
