-- Dong bo bang gia trong he thong voi SOP Thu hoc phi V1.1 (16/09/2026), Muc 2.
--
-- TRUOC: 4 goi, 12 va 24 buoi, gia 250.000 / 190.000 / 150.000, mo ta tu ghi la
--        "gia mac dinh goi y". Khong khop chinh sach o hai cho:
--          - Chinh sach chinh thuc la GOI 10 BUOI, khong phai 12 hay 24.
--          - Gia lop 2 nguoi ghi 190.000; SOP V1.1 ghi 180.000.
--
-- SAU : 10 goi 10 buoi, day du sau muc si so x hai loai giao vien, lay nguyen
--       tu bang gia SOP.
--
-- KHONG xoa 4 goi cu — chuyen sang 'archived' kem ly do, de con tra lai duoc
-- neu co dang ky nao dang tro toi chung.
--
-- LUU Y ve thoi luong: SOP ghi lop 5-6 nguoi hoc 75 phut. Cot duration_minutes
-- co rang buoc chi nhan 30, 60 hoac 90, nen hai goi do ghi 90 va noi ro trong
-- mo ta rang thoi luong that la 75. Muon ghi dung 75 thi phai sua rang buoc
-- chk o bang tuition_packages — chua lam vi anh huong ca bang teacher_rates.

update public.tuition_packages set status = 'archived',
  description = 'Ngung dung 16/09/2026: goi 12 va 24 buoi khong dung chinh sach (goi chuan la 10 buoi), va gia 1:2 ghi 190.000 trong khi SOP V1.1 la 180.000.'
where status = 'active';

insert into public.tuition_packages (code, name, class_type, duration_minutes, lesson_count, default_price_per_lesson, description) values
('VN-1-1-10',  'Gói 10 buổi · 1 kèm 1 · GV Việt Nam',      'one_to_one',   60, 10, 250000, 'SOP Thu hoc phi V1.1, Muc 2. Gia theo 01 hoc vien.'),
('VN-1-2-10',  'Gói 10 buổi · lớp 2 người · GV Việt Nam',  'one_to_two',   60, 10, 180000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('VN-1-3-10',  'Gói 10 buổi · lớp 3 người · GV Việt Nam',  'small_group',  60, 10, 150000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('VN-1-4-10',  'Gói 10 buổi · lớp 4 người · GV Việt Nam',  'small_group',  60, 10, 130000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('VN-1-5-10',  'Gói 10 buổi · lớp 5 người · GV Việt Nam',  'small_group',  90, 10, 115000, 'SOP V1.1. Thoi luong that 75 phut.'),
('VN-1-6-10',  'Gói 10 buổi · lớp 6 người · GV Việt Nam',  'small_group',  90, 10,  99000, 'SOP V1.1. Thoi luong that 75 phut.'),
('NN-1-1-10',  'Gói 10 buổi · 1 kèm 1 · GV nước ngoài',    'one_to_one',   60, 10, 280000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('NN-1-2-10',  'Gói 10 buổi · lớp 2 người · GV nước ngoài','one_to_two',   60, 10, 210000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('NN-1-3-10',  'Gói 10 buổi · lớp 3 người · GV nước ngoài','small_group',  60, 10, 170000, 'SOP Thu hoc phi V1.1, Muc 2.'),
('NN-1-4-10',  'Gói 10 buổi · lớp 4 người · GV nước ngoài','small_group',  60, 10, 150000, 'SOP Thu hoc phi V1.1, Muc 2.');

-- CHUA SUA, CHO FOUNDER QUYET:
--   settings.report_deadline_hours dang la 24, nhung CA HAI thoa thuan cam ket
--   bao cao gui trong vong 10 GIO. He thong dang de rong hon loi hua voi phu
--   huynh. Doi thanh 10 se lam nhieu buoi bi danh dau tre ngay lap tuc, nen
--   khong tu doi.
