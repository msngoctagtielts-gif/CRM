-- Nap link ho so that tu Notion vao kho ho so CRM.
--
-- Co Ngoc da co san bo tai lieu chinh thuc V1.1 ban hanh 13/08/2026 trong Notion
-- (Kho tai lieu). Truoc do kho ho so CRM de trong nhung dong nay vi toi khong
-- biet chung da ton tai.
--
-- LUU Y: link Notion la NOI LUU BAN GOC, chi nguoi co quyen Notion mo duoc.
-- Muon gui hoc vien thi dinh kem PDF hoac tao link chia se cong khai.

update public.documents set
  url = 'https://app.notion.com/p/3c569ee495ba813eab41c4c102d5ae12',
  notes = 'Ban V1.1, 4 trang, co PDF va DOCX trong Notion. Da gom: buoi 1 mien phi, goi 10 buoi tu buoi 2, bao luu va hoan phi dinh luong, o tick dong y dung hinh anh, KHONG cam ket dau ra.'
where title = 'Thoả thuận học viên';

update public.documents set
  url = 'https://app.notion.com/p/3c569ee495ba813eab41c4c102d5ae12',
  notes = 'Ban V1.1 song ngu, 9 trang. Da gom: bang thu lao chuan, chuan chat luong buoi day, nghiem thu theo Dieu 418 BLDS, an toan tre em, khong loi keo hoc vien. CON THIEU dieu khoan so huu du lieu buoi hoc.'
where title = 'Thoả thuận giáo viên';

update public.documents set
  url = 'https://app.notion.com/p/3c569ee495ba8178831ec6eb51868982',
  notes = 'Bang hoc phi goi 10 buoi V1.0. Buoi dau mien phi, gia theo 01 hoc vien, tach cot GV Viet Nam va GV Philippines. IELTS CHUA CO GIA CHUAN. Day moi la bang gia chinh thuc.'
where title = 'Bảng học phí';

insert into public.documents (title, category, audiences, stage, url, notes, sort_order) values
('Brochure giới thiệu', 'bieu_mau', array['hoc_vien','phu_huynh'], 1,
 'https://app.notion.com/p/3c569ee495ba8178831ec6eb51868982',
 'Brochure 2 trang. Thu tu chuan: tu van xong gui Brochure truoc, khi bao gia moi gui Bang hoc phi.', 15),

('Chính sách cốt lõi (bảng tra 30 giây)', 'chinh_sach', array['noi_bo'], null,
 'https://app.notion.com/p/3c569ee495ba8178a61fc711dc33147e',
 'Dong "Cach goi" ghi ro khong tu nhan la trung tam duoc cap phep — giu nguyen dong nay.', 75);

-- Ket qua: 11 ho so, 7 da co link, 4 con can bo sung
-- (lo trinh, placement test, chinh sach hoc tap ban day du, Welcome Pack).
