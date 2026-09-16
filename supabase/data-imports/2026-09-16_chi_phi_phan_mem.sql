-- Chi phi phan mem dinh ky, theo so lieu co Ngoc xac nhan ngay 16/09/2026.
--
-- Zoom Pro   : 288.000d/thang, bat dau 09/08/2025.
-- Claude Pro : trung binh 22 USD/thang, bat dau 20/01/2026. Co Ngoc yeu cau
--              quy doi sang VND de ghi so.
--
-- TY GIA DUNG DE QUY DOI
--   26.090 d/USD -- ty gia BAN ra cua Vietcombank ngay 10/09/2026.
--   22 USD x 26.090 = 573.980 d/thang.
--   Ap DUNG MOT ty gia cho ca 8 thang, vi con so 22 USD da la so trung binh co
--   Ngoc dua ra. Tung thang thuc te khac nhau.
--   Day la SAN, khong phai so cuoi: the quoc te con bi phi giao dich ngoai te
--   (thuong 3-4% tuy ngan hang) ma co Ngoc chua xac nhan, nen chua cong vao.
--
-- GIA DINH DA GHI RO (chua duoc xac nhan bang sao ke):
--  1. Ngay tru tien hang thang lay theo ngay bat dau su dung (ngay 9 va ngay 20).
--     Co Ngoc moi noi ngay BAT DAU SU DUNG, chua noi ngay NGAN HANG TRU TIEN.
--  2. Hinh thuc thanh toan de 'other' vi chua biet tra bang the hay chuyen khoan.
--  3. Truoc do co Ngoc tung noi Zoom "tu thang 1/2025". Lan nay co noi ro
--     09/08/2025. Lay moc moi vi no cu the hon va la cau tra loi cho dung cau
--     hoi "ngay bat dau that la ngay nao".
--
-- Muon doi ty gia ve sau: sua so 573980 va ghi chu, dung sua moi dong mot kieu.

-- Zoom Pro: tu 09/08/2025 den ky gan nhat da qua (09/09/2026) = 14 ky.
insert into public.expenses (expense_date, category, description, amount, currency, method, vendor, notes)
select d::date,
       'software',
       'Zoom Pro - thang ' || to_char(d, 'MM/YYYY'),
       288000,
       'VND',
       'other',
       'Zoom',
       'Co Ngoc xac nhan 16/09/2026: 288.000d/thang, bat dau 09/08/2025. Ngay tru tien hang thang la gia dinh theo ngay bat dau su dung.'
from generate_series(date '2025-08-09', date '2026-09-09', interval '1 month') as d;

-- Claude Pro: tu 20/01/2026 den ky gan nhat da qua (20/08/2026) = 8 ky.
-- Ky 20/09/2026 chua toi (hom nay 16/09/2026) nen khong ghi.
insert into public.expenses (expense_date, category, description, amount, currency, method, vendor, notes)
select d::date,
       'software',
       'Claude Pro - thang ' || to_char(d, 'MM/YYYY'),
       573980,
       'VND',
       'other',
       'Anthropic',
       'Co Ngoc xac nhan 16/09/2026: trung binh 22 USD/thang, bat dau 20/01/2026. Quy doi 22 USD x 26.090 d/USD (ty gia ban Vietcombank 10/09/2026) = 573.980 d. Chua cong phi giao dich ngoai te cua the.'
from generate_series(date '2026-01-20', date '2026-08-20', interval '1 month') as d;
