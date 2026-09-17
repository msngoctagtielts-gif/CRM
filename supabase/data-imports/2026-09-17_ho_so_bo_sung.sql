-- Nap ba tai lieu vua soan vao kho ho so CRM (17/09/2026).
--
-- Kho ho so tu 12 dong: 10 da co link, 2 con can bo sung.
--
-- KHONG soan hai tai lieu con lai:
--   - "Lo trinh hoc theo chuong trinh": can chuan dau ra that cua tung level
--     theo giao trinh Kid's Box va Speak Now. Bang levels trong he thong chi co
--     thang CEFR chung (Pre-A1 den C2), khong level nao gan voi chuong trinh
--     nao va khong co mo ta. Bia muc CEFR hay noi dung giao trinh la rui ro
--     thuong hieu, khong phai giup viec.
--   - "Quy trinh Placement Test": can bai kiem tra dau vao do Founder thiet ke.
--     Bang placement_tests da dung san nhung chua co dong nao.

update public.documents set
  url = 'https://app.notion.com/p/3c569ee495ba813eab41c4c102d5ae12',
  notes = 'Ban V1.0 soan 17/09/2026. Moi dieu khoan lay nguyen tu Thoa thuan dang ky chuong trinh hoc V1.2, khong them quy dinh moi. CAN CO tai tep .docx len Notion va dien Zalo/email o muc 9.'
where title = 'Chính sách học tập';

update public.documents set
  url = 'https://app.notion.com/p/3c569ee495ba813eab41c4c102d5ae12',
  notes = 'Ban V1.0 soan 17/09/2026, gui khi hoc vien vao lop chinh thuc. Bieu mau dien cho tung hoc vien. CAN CO tai len Notion va dien thong tin lien he Trung tam.'
where title = 'Welcome Pack (bắt đầu học)';

insert into public.documents (title, category, audiences, stage, url, notes, sort_order) values
('Tuyển dụng giáo viên Philippines (tiếng Anh)', 'bieu_mau', array['noi_bo'], null,
 'https://app.notion.com/p/3c569ee495ba81e9a56de387795a1d69',
 'Ban V1.1 soan 17/09/2026, thay ban V1.0. V1.0 chao "USD 5-15/hour" trong khi muc thuc tra 120.000d chi tuong duong 4,60 USD. V1.1 bo khoang uoc luong do, thay bang bang thu lao that theo VND kem quy doi USD tham khao va ghi ro ty gia.', 95);
