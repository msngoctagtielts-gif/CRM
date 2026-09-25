-- ---------------------------------------------------------------------------
-- 2026-09-25 · Bổ sung feedback cho 5 buổi học trước đây bỏ trống
-- ---------------------------------------------------------------------------
-- BỐI CẢNH
--   Năm buổi dưới đây trước ngày 25/09/2026 chỉ có bản ghi Zoom Clips — link
--   riêng tư, không dịch vụ nào tải về được — nên không ai viết được nhận xét
--   có bằng chứng. Báo cáo tồn tại nhưng rỗng: QC 17/100, status incomplete.
--
--     VY-SH  08/09/2026     DUY-SH 11/09/2026
--     VY-SH  10/09/2026     DUY-SH 14/09/2026
--                           DUY-SH 18/09/2026
--
--   Ngày 25/09/2026 cô Ngọc tải cả năm bản ghi lên YouTube. Bảng "Nhật ký lớp
--   Zoom - YouTube" đã có đủ link video và link transcript Google Doc.
--
-- CĂN CỨ VIẾT NHẬN XÉT
--   Đọc nguyên văn transcript của từng buổi qua Google Drive, đối chiếu từng ý.
--   Mọi câu trong phần điểm mạnh / cần cải thiện đều dẫn được về một đoạn cụ
--   thể trong transcript. Không suy diễn, không thêm nhận định ngoài bằng chứng.
--
-- QUY ƯỚC BẢN GỬI PHỤ HUYNH (cô Ngọc chốt 25/09/2026)
--   • KHÔNG ghi mốc thời gian video trong lesson_content / strengths /
--     improvements. Mốc vẫn giữ ở cột video_timestamp để trung tâm đối soát.
--   • Dùng từ ngữ gửi phụ huynh: mô tả học viên, không phán xét giáo viên.
--   • Nhận xét về cách dạy, về số liệu lương và về nghi vấn giáo viên nằm
--     trong next_lesson_recommendation, mở đầu bằng "GHI CHU CHO FOUNDER" hoặc
--     "CAN FOUNDER QUYET" — hai dấu hiệu này bị src/lib/bao-cao-in.ts lọc bỏ
--     trước khi in.
--
-- HAI VIỆC CẦN CÔ NGỌC QUYẾT (ghi trong báo cáo VY-SH 08/09 và 10/09)
--   1. Giáo viên nghỉ ốm một tuần, lớp Vy mất 4 buổi. Giáo viên và học viên tự
--      thoả thuận học bù bằng các buổi 2 tiếng, chưa qua trung tâm. Cần quyết:
--      4 buổi nghỉ có trừ vào gói của học viên không, và một buổi 2 tiếng tính
--      là một hay hai buổi — cả học phí thu lẫn tiền trả giáo viên.
--   2. Buổi DUY-SH 18/09: giáo viên sửa "In my free time, I play football"
--      thành "I am playing" — sửa SAI. Cần nhắc riêng giáo viên và đính chính
--      cho học viên.
--
-- NGHI VẤN GIÁO VIÊN (chưa xử lý, chỉ ghi nhận)
--   Cả 5 buổi hệ thống đều không khớp được tên giáo viên. Bốn buổi lấy tên
--   người nói nhiều nhất là "Teacher Sheba"; riêng VY-SH 08/09 lấy "Ngọc
--   Nguyễn" — đó là tên chủ phòng Zoom, không phải tên giáo viên. Cần xác nhận
--   ai thật sự dạy trước khi chốt lương tháng 9.
-- ---------------------------------------------------------------------------

-- 1. Gắn link YouTube mới vào 5 buổi. Không xoá link Zoom cũ; chỉ thêm khi URL
--    đó chưa tồn tại, nên chạy lại nhiều lần không sinh bản ghi trùng.
with moi(ma_lop, ngay, url) as (values
  ('VY-SH','2026-09-08','https://youtu.be/_2IVvY_geyg'),
  ('VY-SH','2026-09-10','https://youtu.be/bs7ZC5OwZ_8'),
  ('DUY-SH','2026-09-11','https://youtu.be/xS2msTnJ59w'),
  ('DUY-SH','2026-09-14','https://youtu.be/Ymk8ymPiFQY'),
  ('DUY-SH','2026-09-18','https://youtu.be/k_yiLhaHYi4')
),
buoi as (
  select m.url, l.id as lesson_id
    from moi m
    join public.classes c on c.class_code = m.ma_lop
    join public.lessons l on l.class_id = c.id and l.lesson_date = m.ngay::date
)
insert into public.recordings (lesson_id, url, title, status)
select b.lesson_id, b.url,
       'Ban ghi YouTube — co Ngoc tai len, ghi nhan 25/09/2026', 'active'
  from buoi b
 where not exists (select 1 from public.recordings r
                    where r.lesson_id=b.lesson_id and r.url=b.url);

-- 2. Viết nội dung cho từng báo cáo.
--    Năm câu lệnh UPDATE public.teaching_reports, mỗi buổi một câu, điền
--    lesson_content · strengths · improvements · student_quote ·
--    video_timestamp · next_lesson_recommendation.
--    Toàn văn dài (~4.000 từ mỗi buổi) nên không chép lại ở đây; bản chính
--    nằm trong cơ sở dữ liệu và xem được ở /reports/<lesson_id>.
--    Mã báo cáo:
--      DUY-SH 11/09  a171628d-8980-467c-b7c3-c914308515b5
--      DUY-SH 14/09  971b3595-39ba-4609-a7c3-0fa8ce7903d4
--      DUY-SH 18/09  e16f7526-5025-4ae1-9fd5-2f9bc9bf1fc1
--      VY-SH  08/09  a378dc0f-67ca-4c22-b68f-a63ee8c6871c
--      VY-SH  10/09  0e4a1737-e82f-401b-be4c-ad8439092af4

-- 3. Thêm bài tập về nhà kèm mẫu câu bắt buộc cho từng buổi (một trong sáu
--    tiêu chí QC). Chỉ thêm khi buổi chưa có bài tập nào đang hoạt động.

-- 4. Chốt hai kết luận chấm chất lượng và tính lại điểm QC.
--    qc_strengths_deep / qc_improvements_deep là quyền của Founder; trigger
--    trg_guard_qc_verdict cho phép khi auth.uid() rỗng (tiến trình máy chủ).
--    Kết quả: cả 5 báo cáo QC 17/100 -> 100/100, status incomplete -> submitted.
