# Bản sao dữ liệu thử nghiệm ZZ — xoá ngày 17/09/2026

Founder yêu cầu xoá ("xóa đi phần thử nghiệm"). Đây là bản sao đầy đủ 13 dòng
được chụp lại **trước khi xoá**, để còn dấu vết đối chiếu nếu về sau cần.

Toàn bộ số dòng này do chính ghi chú trong bản ghi tự nhận là dữ liệu thử:
*"Dữ liệu thử. Xoá sau khi thử xong."* và *"Tài khoản thử để Founder xem hệ
thống qua mắt giáo viên."*

## Vì sao phải xoá

Một buổi thử ngày 15/09/2026 đã lọt vào số liệu thật của tháng 9:
- **120.000₫** chờ trả lương (buổi duy nhất chưa trả trong toàn hệ thống)
- **200.000₫** doanh thu ghi nhận
- 1 học viên, 1 lớp, 1 giáo viên đếm vào chỉ số vận hành tháng 9

## 13 dòng đã xoá

| Bảng | Dòng | Khoá chính |
|---|---:|---|
| teachers | 1 | `54d6d6d9-39b7-4efa-9370-9bd2f8bba5f5` — GV012 "ZZ Giáo viên thử nghiệm" |
| teacher_rates | 1 | `010b2652-e4ea-41d4-a3f0-96028fe189a1` — 120.000₫/60 phút, ghi chú "Đơn giá giả, chỉ để thử" |
| classes | 1 | `8761312e-1a18-475d-b0c8-6e8fbc9a9e1d` — ZZ-TEST "ZZ Lớp thử nghiệm" |
| students | 1 | `5d0b74bf-92ec-4184-86b3-6b29a965fcab` — ZZ-TEST-01 |
| student_enrollments | 1 | `c02b6250-8d71-43a1-8853-358301b493dd` — ZZ-TEST-EN, gói 10 buổi × 200.000₫ |
| class_students | 1 | `ef2b3b2f-c452-4d00-9dad-71eb1105c6a9` |
| lessons | 1 | `bcb00361-49c4-4011-80f4-306f057464c0` — 15/09/2026, 60 phút, chủ đề "speak now" |
| attendance | 1 | `e1d3ed3d-bf9f-412d-870c-b75e128fdb93` — present |
| lesson_consumptions | 1 | `de9c67ec-ef5d-4dbd-b7bc-50d5cd8c3b74` — ghi nhận 200.000₫ |
| teacher_payable_lessons | 1 | `070df943-34c5-4978-8f32-b543d3f8cebf` — 120.000₫, trạng thái pending |
| teaching_reports | 1 | `01477d0b-903f-4370-b5d4-f9de9c416134` — nháp, điểm QC 17 |
| recordings | 1 | `05ee4c52-6a3b-4ba7-8e0a-e0cdfe119554` — link YouTube `8JZzCNF_P-U` |
| **Tổng** | **13** | |

## Hai điều cần biết

1. **Video trên YouTube KHÔNG bị xoá.** Bảng `recordings` chỉ giữ đường dẫn. Xoá
   dòng này là bỏ liên kết trong CRM, video gốc vẫn nằm nguyên trên tài khoản
   đang sở hữu nó.

2. **Email trên hồ sơ giáo viên thử** là một địa chỉ Gmail của Founder. Em không
   chép địa chỉ đó vào đây vì kho mã lưu lịch sử vĩnh viễn; nếu cần tra lại thì
   nó nằm trong nhật ký phiên làm việc ngày 17/09/2026.

## Thứ tự xoá

Xoá từ bảng con lên bảng cha để không vướng khoá ngoại:

```
lesson_consumptions → teacher_payable_lessons → recordings → teaching_reports
→ attendance → lessons → class_students → student_enrollments → students
→ teacher_rates → classes → teachers
```
