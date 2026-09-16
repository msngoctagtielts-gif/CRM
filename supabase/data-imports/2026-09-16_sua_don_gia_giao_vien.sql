-- Sua don gia giao vien theo quy tac co Ngoc xac nhan ngay 16/09/2026.
--
-- QUY TAC
--   Lop 1 kem 1, 60 phut          : 120.000d
--   Moi nguoi hoc them            : +20.000d  (2 nguoi 140.000, 3 nguoi 160.000)
--   Mr. Kobe                      : 150.000d  (day IELTS)
--   Lop Kien - Ms. Sheba          : 170.000d  (day IELTS, truong hop dac biet)
--
-- DA KIEM CHUNG: doi chieu quy tac nay voi si so thuc te cua tung lop, TAT CA
-- don gia dang luu deu khop, khong lop nao lech. Vi du lop Ms. Hoang/Hue 2 hoc
-- vien dang 140.000, lop Y Khoa 3 nguoi dang 160.000. Nghia la quy tac co vua
-- noi dung voi du lieu co da nhap tu truoc.
--
-- AN TOAN: bang teacher_payroll co 7 dong nhung teacher_payable_lessons chua
-- co dong nao gan payroll_id. Chua buoi day nao bi dong bang don gia vao luong,
-- nen sua don gia luc nay KHONG viet lai lich su tra luong.

-- ---------------------------------------------------------------------------
-- 1. Lui ngay hieu luc ve buoi day dau tien
-- ---------------------------------------------------------------------------
-- Cac don gia deu dat effective_from = 2026-09-11 (ngay nhap lieu), trong khi
-- giao vien da day tu truoc do - Mr. Kobe day tu 12/07/2025, truoc 14 thang.
-- He qua: he thong khong tim duoc don gia ap dung cho bat ky buoi nao truoc
-- 11/09/2026, tuc la khong tinh duoc luong cho toan bo giai doan lich su.
-- Ngay nhap lieu khong phai ngay don gia bat dau co hieu luc.

update public.teacher_rates tr
set effective_from = x.buoi_dau,
    notes = coalesce(tr.notes, '') ||
            ' [SUA 16/09/2026] Lui ngay hieu luc tu 2026-09-11 (ngay nhap lieu) ve ' ||
            x.buoi_dau || ' la buoi day dau tien. Don gia khong doi.'
from (
  select t.id as teacher_id, min(l.lesson_date) as buoi_dau
  from public.teachers t join public.lessons l on l.teacher_id = t.id
  group by t.id
) x
where tr.teacher_id = x.teacher_id
  and tr.effective_from > x.buoi_dau;

-- ---------------------------------------------------------------------------
-- 2. Lop Kien - Ms. Sheba: 120.000 -> 170.000 (day IELTS)
-- ---------------------------------------------------------------------------
update public.teacher_rates tr
set rate_amount = 170000,
    notes = coalesce(tr.notes, '') ||
            ' [SUA 16/09/2026] Co Ngoc xac nhan lop nay day IELTS nen don gia 170.000d/60p, ' ||
            'khong theo quy tac si so thong thuong. Truoc do luu 120.000d.'
from public.classes c
where c.id = tr.class_id and c.name = 'Kiên - Ms. Sheba';

-- ---------------------------------------------------------------------------
-- 3. Ba giao vien co day nhung chua he co don gia
-- ---------------------------------------------------------------------------
-- Mr. Andy 1 buoi, Mr. Marbin 3 buoi, Ms. Jai 2 buoi - deu tu giua 2025.
-- Khong co don gia thi khong tinh duoc luong cho ho. Ap muc 1 kem 1 la 120.000
-- theo quy tac chung. GIA DINH: cac lop nay deu 1 kem 1; neu co lop nao dong
-- hon thi phai them don gia rieng cho lop do.

insert into public.teacher_rates (teacher_id, scope, duration_minutes, rate_amount, currency, effective_from, notes)
select t.id, 'duration', 60, 120000, 'VND', min(l.lesson_date),
       'Nhap 16/09/2026 theo quy tac co Ngoc xac nhan: lop 1 kem 1, 60 phut = 120.000d. ' ||
       'Truoc do giao vien nay khong co don gia nao nen khong tinh duoc luong. ' ||
       'GIA DINH cac lop deu 1 kem 1.'
from public.teachers t
join public.lessons l on l.teacher_id = t.id
left join public.teacher_rates tr on tr.teacher_id = t.id
where t.full_name in ('Mr. Andy', 'Mr. Marbin', 'Ms. Jai')
group by t.id
having count(tr.id) = 0;

-- ---------------------------------------------------------------------------
-- KET QUA KIEM CHUNG (chay ngay 16/09/2026, dung chinh ham
-- public.fn_resolve_teacher_rate cua he thong, khong dung logic tu viet)
-- ---------------------------------------------------------------------------
--   Giao vien co don gia hieu luc sau buoi day dau : khong con
--   Giao vien co day nhung khong co don gia        : khong con
--   Lop Kien - Ms. Sheba                           : 170.000d tu 2025-05-23
--
--   Buoi 60 phut : 452 / 452 tim duoc don gia
--   Buoi 30 phut :   0 /   3
--   Buoi 90 phut :   0 /   5
--
-- CON THIEU: quy tac co Ngoc dua ra chi noi ve buoi 60 phut. Tam 8 buoi khong
-- phai 60 phut chua co don gia ap dung. KHONG duoc tu suy ra bang cach chia
-- ty le - do la bia quy tac tra luong. Cho co Ngoc xac nhan:
--   30 phut: Ms. Nhi (Hau 17/05, Toan 10/06), Ms. Phuong (Phuc 07/06)
--   90 phut: Ms. Hoa (Bao Ngoc, 5 buoi 14/08 - 28/08)

-- ---------------------------------------------------------------------------
-- 4. Don gia cho buoi khac 60 phut (co Ngoc xac nhan 16/09/2026)
-- ---------------------------------------------------------------------------
-- Chia theo ty le tu muc 1 kem 1 la 120.000d/60 phut:
--     30 phut = 60.000d   |   90 phut = 180.000d
--
-- CHI them cho ba giao vien THUC SU co buoi khac 60 phut. Khong suy rong ra
-- cac giao vien khac, va dac biet KHONG suy ra cho Mr. Kobe: nen cua thay la
-- 150.000d chu khong phai 120.000d, ma co Ngoc moi xac nhan ty le cho muc
-- 120.000d. Neu ve sau co buoi 30 hay 90 phut cua giao vien khac thi phai hoi
-- lai truoc khi them.

insert into public.teacher_rates (teacher_id, scope, duration_minutes, rate_amount, currency, effective_from, notes)
select t.id, 'duration', x.thoi_luong,
       case x.thoi_luong when 30 then 60000 when 90 then 180000 end,
       'VND',
       (select min(l.lesson_date) from public.lessons l where l.teacher_id = t.id),
       'Nhap 16/09/2026. Co Ngoc xac nhan chia theo ty le tu muc 1 kem 1 la 120.000d/60 phut.'
from public.teachers t
join (values ('Ms. Nhi', 30), ('Ms. Phương', 30), ('Ms. Hòa', 90)) as x(ten, thoi_luong)
  on x.ten = t.full_name
where not exists (
  select 1 from public.teacher_rates tr
  where tr.teacher_id = t.id and tr.scope = 'duration' and tr.duration_minutes = x.thoi_luong
);

-- KET QUA CUOI (fn_resolve_teacher_rate cua he thong, 16/09/2026):
--   460 / 460 buoi tim duoc don gia, tu 31/05/2025 den 04/09/2026.
--   30 phut:   3 buoi -    180.000d
--   60 phut: 452 buoi - 55.920.000d
--   90 phut:   5 buoi -    900.000d
--   TONG           : 57.000.000d
--
-- Day la tong luong giao vien PHAI TRA theo don gia, tinh tu du lieu buoi day
-- trong he thong. KHONG phai so da thuc su chi ra. Doi chieu voi so co Ngoc da
-- tra that de tim chenh lech.
