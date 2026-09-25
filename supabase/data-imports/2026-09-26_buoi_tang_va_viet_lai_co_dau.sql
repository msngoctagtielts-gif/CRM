-- =====================================================================
-- Buổi tặng + viết lại báo cáo có dấu — 3 lớp Duy · Uyển Nhi · Khánh Vy
-- Ngày chạy: 25/09/2026
-- =====================================================================
--
-- 1) BUỔI 1 CỦA CẢ BA LỚP LÀ BUỔI TẶNG TRẢI NGHIỆM
--    Cô Ngọc chốt ngày 25/09/2026. Cả ba buổi vốn đã is_billable = false
--    từ đợt đối soát 14/09; lần này chỉ ghi rõ LÝ DO là buổi tặng.
--      VY-SH  04/08/2026
--      NHI-PH 10/08/2026   (lý do cũ ghi "buổi làm quen, cần Founder xác nhận")
--      DUY-SH 24/08/2026
--
-- 2) UYỂN NHI ĐƯỢC TẶNG 2 BUỔI VỚI CÔ HÒA
--    Hai buổi này KHÔNG có trong hệ thống. Đã kiểm: không có lớp nào của
--    Nhi gắn với Ms. Hòa, và mọi buổi của Ms. Hòa đều thuộc lớp NGOC-HO.
--    KHÔNG tự tạo bản ghi vì không biết ngày học — ghi vào students.learning_notes
--    để không mất dấu. Khi cô Ngọc cho ngày thì nhập vào và đánh dấu miễn phí.
--
-- 3) VIẾT LẠI BÁO CÁO CHO CÓ DẤU TIẾNG VIỆT
--    Trước khi sửa, 20 báo cáo có nội dung chia làm ba nhóm:
--      - Nhi tháng 8 (5 báo cáo): tiếng Việt CÓ DẤU, do Ms. Phương viết. Giữ nguyên.
--      - Vy + Duy tháng 8 (11 báo cáo): viết bằng TIẾNG ANH, lời Ms. Sheba.
--        => Dịch sang tiếng Việt cho phụ huynh đọc, GIỮ NGUYÊN bản gốc tiếng
--           Anh của cô ở cuối mỗi mục. Không xoá lời giáo viên.
--      - 4 báo cáo tháng 9 (Vy 24/09, Duy 21/09 + 23/09, Nhi 19/09): tiếng Việt
--        KHÔNG DẤU, do trợ lý viết trong đợt đọc transcript.
--        => Viết lại đầy đủ dấu, giữ nguyên toàn bộ mốc thời gian và nội dung.
--
--    Sau khi sửa: 20/20 báo cáo có dấu tiếng Việt.
--
-- 4) BẢN PDF
--    scripts/xuat-pdf-bao-cao.mjs được nâng cấp: thêm trang tổng quan toàn bộ
--    quá trình học (số buổi, số buổi được tặng, ngày buổi đầu, bảng lịch sử
--    từng buổi), và hiện cả những buổi CHƯA CÓ BÁO CÁO thay vì bỏ qua —
--    phụ huynh thấy đủ lịch sử, và trung tâm không giấu phần còn thiếu.
--
-- =====================================================================
-- MỘT ĐIỂM CẦN FOUNDER XEM
--    Lớp DUY-SH có HAI buổi cùng ngày 11/09/2026 (id fa656854... và
--    c859ffc3...), cả hai đều chưa có nội dung báo cáo. Nhiều khả năng là
--    một buổi bị nhập trùng. Cần cô xác nhận rồi xoá bớt một buổi, vì nó
--    ảnh hưởng cả số buổi đã học lẫn học phí.
-- =====================================================================

update public.attendance a
   set ly_do_mien_phi = 'Buổi 1 — TẶNG TRẢI NGHIỆM. Cô Ngọc chốt ngày 25/09/2026: buổi đầu của cả ba lớp Duy, Uyển Nhi, Khánh Vy đều là buổi tặng, không tính học phí.'
  from public.lessons l
 where a.lesson_id = l.id
   and l.id in ('b986ca41-7204-41ac-b05a-ad8901c61850',
                'f6e29d8e-f5e8-4663-812e-0d50bf58c257',
                '914dd0aa-670b-42e7-b025-62b3c7e188dd');

update public.students
   set learning_notes = coalesce(learning_notes || E'\n\n', '') ||
       'QUÀ TẶNG: Uyển Nhi được tặng 2 buổi học với cô Hòa (cô Ngọc ghi nhận ngày 25/09/2026). Hai buổi này chưa có trong hệ thống — chưa rõ ngày học nên chưa tạo bản ghi. Khi cô Ngọc cho ngày, nhập vào và đánh dấu miễn phí.',
       updated_at = now()
 where student_code = 'HV0020';

-- Nội dung 15 báo cáo được viết lại: xem lịch sử thao tác ngày 25/09/2026.
