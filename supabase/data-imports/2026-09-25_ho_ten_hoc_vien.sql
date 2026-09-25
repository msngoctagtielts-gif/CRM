-- =====================================================================
-- Bổ sung họ tên đầy đủ: Duy, Vy, Nhi — 25/09/2026
-- =====================================================================
--
-- NGUỒN: tên hiển thị Zoom trong sổ "Nhật ký lớp Zoom - YouTube", cột
-- "Có mặt (phút)", đối chiếu với nhãn người nói trong transcript.
-- Hệ thống KHÔNG có hồ sơ phụ huynh cho ba học viên này (bảng parents /
-- student_parents đều trống), nên đây là nguồn duy nhất đối chiếu được.
--
-- Tên hiển thị Zoom tìm thấy trong sổ:
--   'Mai Công Duy'
--   'khánh vy lê ngọc'  (và bản rút gọn 'khánh vy')
--   'uyển nhi'
--
-- KẾT QUẢ
--   HV0023  Công Duy -> Mai Công Duy        CHẮC CHẮN
--   HV0019  Vy       -> Lê Ngọc Khánh Vy    SUY LUẬN, cần cô xác nhận
--   HV0020  Nhi      -> Uyển Nhi            CHƯA ĐỦ, thiếu họ
--
-- VÌ SAO KHÔNG ĐOÁN HỌ CỦA NHI
--   Tên Zoom chỉ có phần tên gọi. Đoán một họ rồi in lên báo cáo gửi phụ
--   huynh là sai lầm không sửa được bằng lời xin lỗi. Để trống và gắn cờ
--   needs_review thì trung thực hơn.
--
-- VÌ SAO ĐẢO THỨ TỰ TÊN CỦA VY
--   'khánh vy lê ngọc' viết thường, tên trước họ sau — cách gõ rất phổ
--   biến khi người dùng tự đặt tên hiển thị Zoom. Sắp lại theo thứ tự
--   tiếng Việt: họ Lê · đệm Ngọc · tên Khánh Vy. Đã gắn needs_review vì
--   đây là suy luận, không phải bằng chứng trực tiếp.
-- =====================================================================

update public.students
   set full_name = 'Mai Công Duy', nickname = 'Duy', updated_at = now()
 where student_code = 'HV0023';

update public.students
   set full_name = 'Lê Ngọc Khánh Vy', nickname = 'Vy',
       needs_review = true,
       review_note = 'Ho ten lay tu ten hien thi Zoom "khanh vy le ngoc" (viet thuong, ten truoc ho sau). Da sap lai thanh Le Ngoc Khanh Vy: ho Le, dem Ngoc, ten Khanh Vy. CAN CO NGOC XAC NHAN dung thu tu va dau chua.',
       updated_at = now()
 where student_code = 'HV0019';

update public.students
   set full_name = 'Uyển Nhi', nickname = 'Nhi',
       needs_review = true,
       review_note = 'CHUA DU HO TEN. Ten hien thi Zoom chi co "uyen nhi", khong co ho. He thong khong co ho so phu huynh de doi chieu. KHONG suy doan ho — can co Ngoc bo sung ho va ten dem.',
       updated_at = now()
 where student_code = 'HV0020';

-- Tách một câu gửi riêng Founder ra khỏi mục chuyên môn trong báo cáo
-- Ngân 17/09, để bộ lọc bản in (src/lib/bao-cao-in.ts) cắt đúng phần nội
-- bộ mà vẫn giữ nhận định chuyên môn cho phụ huynh đọc.
-- Nội dung sau khi sửa: xem mục 5 và mục 6 của report bfe4c319.
