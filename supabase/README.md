# Supabase — cấu trúc CSDL & quy trình migration

## Nguyên tắc tuyệt đối

> **Không bao giờ sửa cấu trúc database production bằng tay.**
> Mọi thay đổi phải là một file migration mới trong `supabase/migrations/`.

File migration đã push thì **không sửa nội dung nữa** — sai thì viết migration mới để vá.

## Thứ tự file

| File | Nội dung |
|---|---|
| `0001_foundation.sql` | extension, enum, `settings`, `audit_logs`, trigger dùng chung |
| `0002_identity.sql` | `roles`, `users`, hàm kiểm quyền (`is_founder`, `is_teacher`…) |
| `0003_academic.sql` | `programs`, `levels`, `teachers`, `teacher_rates`, `parents`, `students` |
| `0004_classes_lessons.sql` | `classes`, `class_students`, `class_schedules`, `lessons`, `attendance` |
| `0005_teaching_reports.sql` | `teaching_reports`, `homework`, `recordings`, logic kiểm tra thiếu trường |
| `0006_finance.sql` | `tuition_packages`, `student_enrollments`, `lesson_consumptions`, `payments`, `expenses` |
| `0007_payroll.sql` | `teacher_payable_lessons`, `teacher_payroll`, logic tính lương |
| `0008_crm.sql` | `leads`, `lead_activities`, `placement_tests`, `trial_classes` |
| `0009_notifications.sql` | `notifications` + `fn_scan_overdue_reports()` (cảnh báo 10 giờ) |
| `0010_views.sql` | view báo cáo (`security_invoker = on`) |
| `0011_rls.sql` | Row Level Security cho toàn bộ bảng |
| `0012_seed_reference.sql` | dữ liệu tham chiếu (chương trình, cấp độ CEFR, gói mẫu) |
| `0013_business_model_alignment.sql` | chỉnh theo mô hình nghiệp vụ thật sau khi đối soát Google Sheets — xem `DECISIONS.md` |

## Chạy lần đầu

```bash
# 1. Đăng nhập & liên kết project
supabase login
supabase link --project-ref <project-ref>

# 2. Áp toàn bộ migration
supabase db push

# 3. Sinh lại type cho TypeScript
npm run db:types
```

## Kiểm thử cục bộ trước khi đẩy lên production

```bash
supabase start          # dựng Postgres + Auth trong Docker
supabase db reset       # áp lại toàn bộ migration từ đầu
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f tests/smoke.sql
```

## Sau khi áp migration

1. Tạo tài khoản Founder trong Supabase Studio → Authentication → Users.
2. Chạy:
   ```sql
   update public.users set role_code = 'founder' where email = '<email founder>';
   ```
3. Kiểm tra cảnh báo bảo mật: Studio → Advisors → Security.

## Sao lưu

Supabase tự sao lưu hằng ngày ở gói Pro. Với gói Free, chạy định kỳ:

```bash
supabase db dump -f backup/$(date +%F).sql
```

## Lịch chạy cảnh báo báo cáo trễ

`fn_scan_overdue_reports()` cần được gọi định kỳ (khuyến nghị mỗi giờ):

- **Cách 1 — n8n / Vercel Cron:** `POST /api/cron/scan-reports` kèm header
  `Authorization: Bearer $CRON_SECRET`.
- **Cách 2 — pg_cron trong Supabase:**
  ```sql
  select cron.schedule('scan-overdue-reports', '0 * * * *',
                       $$select public.fn_scan_overdue_reports()$$);
  ```
