-- Lo trinh hoc tap V1.1 va mo ta CEFR cho bang levels.
--
-- Founder cung cap EDU_LoTrinhHocTap_CurriculumMap_V1.0_2026-09-16.pdf — nguon
-- ma truoc do toi thieu nen khong soan duoc lo trinh.
--
-- 1. Dien mo ta "lam duoc gi" cho 7 level. Truoc do ca 7 dong deu khong co mot
--    chu mo ta nao. Noi dung lay tu Bang tu danh gia CEFR (Council of Europe /
--    Europass) ma chinh Curriculum Map da dan nguon — khong tu viet.
--
-- 2. Ghi ro cot program_id de TRONG la dung. Mot bac CEFR co the vua la dich
--    cua chuong trinh nay vua la diem khoi dau cua chuong trinh kia (A1 la dich
--    cua Kids va diem bat dau cua Adult), mot khoa ngoai don tri khong dien ta
--    duoc dieu do.

update public.levels set description = case code
  when 'PRE_A1' then 'Chưa đạt A1. Nhận biết và nhắc lại được từ, cụm từ rất quen thuộc; chào hỏi và giới thiệu tên tuổi rất đơn giản khi có giáo viên hỗ trợ.'
  when 'A1'     then 'Nghe: hiểu từ và cụm từ quen thuộc về bản thân, gia đình. Nói: giao tiếp đơn giản nếu người đối diện nói chậm. Đọc: hiểu tên riêng, từ và câu rất đơn giản. Viết: điền form thông tin cá nhân.'
  when 'A2'     then 'Nghe: hiểu từ vựng tần suất cao liên quan trực tiếp tới bản thân. Nói: trao đổi thông tin đơn giản trong sinh hoạt hằng ngày. Đọc: tìm được thông tin cụ thể trong văn bản ngắn. Viết: ghi chú, tin nhắn ngắn.'
  when 'B1'     then 'Nghe: hiểu ý chính của lời nói rõ ràng về chủ đề quen thuộc. Nói: xử lý hầu hết tình huống giao tiếp thường ngày. Đọc: hiểu văn bản chứa từ vựng thông dụng. Viết: văn bản liên kết đơn giản.'
  when 'B2'     then 'Nghe: hiểu bài nói dài, theo dõi lập luận khá phức tạp. Nói: tương tác trôi chảy, tự nhiên với người bản xứ. Đọc: bài báo, báo cáo về vấn đề đương đại. Viết: luận và báo cáo có lập luận.'
  when 'C1'     then 'Nghe: hiểu bài nói dài dù không có cấu trúc rõ ràng. Nói: diễn đạt trôi chảy, gần như không cần tìm từ. Đọc: văn bản dài, phức tạp. Viết: văn bản có cấu trúc tốt, trình bày quan điểm dài.'
  when 'C2'     then 'Ngoài phạm vi mục tiêu giảng dạy hiện tại của trung tâm. Giữ trong danh mục để thang CEFR đầy đủ.'
  end, updated_at = now();

comment on column public.levels.program_id is
  'De TRONG voi thang CEFR dung chung. Mot bac CEFR co the vua la dich cua chuong trinh nay vua la diem khoi dau cua chuong trinh kia (vi du A1), nen khong gan cung vao mot chuong trinh.';

-- 3. Kho ho so: 14 dong, 13 da co link, 1 con thieu (bo de placement test).
