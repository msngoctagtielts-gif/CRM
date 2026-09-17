-- Bo kiem tra dau vao V1.0 va ghi chu cot cho bang placement_tests.
--
-- Kho ho so CRM nay 14/14 dong deu co link — het dong "CAN BO SUNG".
--
-- Ghi chu cot duoc them de nguoi nhap khong dat ten test_type tuy y, va khong
-- ghi 0 vao o khong kiem tra. 0 nghia la LAM MA KHONG DUOC; de trong nghia la
-- KHONG KIEM TRA. Hai chuyen khac han nhau, va neu lan lon thi diem trung binh
-- cua Bo A se bi keo xuong oan.

update public.documents set
  title = 'Bộ kiểm tra đầu vào (Placement Test)',
  audiences = array['giao_vien','noi_bo'],
  url = 'https://app.notion.com/p/3ca69ee495ba819595ade68ab90dd058',
  notes = 'Ban V1.0 soan 17/09/2026. KHONG gui hoc vien. Bo A cho tre 6-10 tuoi (15 phut, Nghe va Noi); Bo B tu ~9 tuoi va nguoi lon (20 phut, du 4 ky nang). Cham ky nang noi theo DUNG 6 tieu chi va thang 1-5 trung tam da dung cho bao cao hang buoi. Phieu ghi ket qua khop dung cac o trong bang placement_tests.'
where title = 'Quy trình kiểm tra đầu vào (Placement Test)';

comment on column public.placement_tests.test_type is
  'Bo de da dung: ''kids'' = Bo A (tre 6-10 tuoi, Nghe va Noi, 15 phut) | ''adult'' = Bo B (tu ~9 tuoi va nguoi lon, du 4 ky nang, 20 phut). Xem Bo kiem tra dau vao V1.0.';

comment on column public.placement_tests.reading_score is
  'Thang 1-5. DE TRONG neu dung Bo A (tre em chi kiem tra Nghe va Noi). Khong ghi 0 — 0 nghia la lam ma khong duoc, trong nghia la khong kiem tra.';

comment on column public.placement_tests.writing_score is
  'Thang 1-5. DE TRONG neu dung Bo A. Khong ghi 0.';
