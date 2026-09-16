-- Sinh lai toan bo dong tinh luong cho du lieu truoc thang 9/2026.
--
-- Founder chot 16/09/2026: "so buoi bao nhieu la toi deu thanh toan giao vien,
-- tinh theo buoi", va "khong ghi gio vao/gio ra chi duoc ap dung tu thang
-- 9/2026, truoc do duoc chap nhan".
--
-- Migration 0027 da sua ham fn_generate_payable_lesson de doc moc
-- settings.require_evidence_from (= 2026-09-01). Nhung ham chi chay khi bao cao
-- thay doi, nen 316 buoi cu van khong co dong tinh luong. Phai chay lai tay.

select public.fn_generate_payable_lesson(l.id)
from public.lessons l
join public.teachers t on t.id = l.teacher_id
where t.full_name not like 'ZZ%';

-- ---------------------------------------------------------------------------
-- Sua 11 dong ghi 0d cua Ms. Nhi (lop Hau)
-- ---------------------------------------------------------------------------
-- 11 dong nay o trang thai 'paid' voi ghi chu "Da tra ngoai he thong". Chung
-- duoc tao TRUOC khi cau hinh don gia cho Ms. Nhi, nen rate_source = 'missing'
-- va amount = 0. Vi status la 'paid' nen menh de `on conflict do update ...
-- where status = 'pending'` khong cham toi - dung nguyen tac khong viet lai
-- lich su da tra, nhung hau qua la so 0 nam lai trong so.
--
-- 0d KHONG phai so tien that. Ghi chu khong ghi so tien da tra. Dung lai theo
-- quy tac Founder: 11 buoi x 120.000d = 1.320.000d.
-- Ghi ro trong notes day la so DUNG LAI, khong phai so doc tu chung tu.

update public.teacher_payable_lessons p
set rate_amount = public.fn_resolve_teacher_rate(p.teacher_id, p.duration_minutes, p.class_id, p.lesson_date),
    amount      = public.fn_resolve_teacher_rate(p.teacher_id, p.duration_minutes, p.class_id, p.lesson_date),
    rate_source = 'duration',
    notes = coalesce(p.notes,'') || ' [SUA 16/09/2026] Dong nay ghi 0d vi luc tao chua cau hinh don gia cho Ms. Nhi, KHONG phai vi buoi nay tra 0d. Dung lai theo quy tac Founder. Day la so DUNG LAI, khong phai so ghi nhan tu chung tu thanh toan.'
where p.amount = 0
  and p.status = 'paid'
  and public.fn_resolve_teacher_rate(p.teacher_id, p.duration_minutes, p.class_id, p.lesson_date) is not null;

-- ---------------------------------------------------------------------------
-- KET QUA (kiem chung 16/09/2026)
-- ---------------------------------------------------------------------------
--   Truoc: 145 / 461 buoi co dong tinh luong. 316 buoi khong duoc tra dong nao.
--   Sau  : 460 / 460 buoi (khong tinh 1 buoi thu nghiem ZZ).
--
-- CON MOT KHOAN CHUA CHOT - CHO FOUNDER QUYET
--   Ms. Sheba, lop Kien - Ms. Sheba, 2 buoi, trang thai 'paid'.
--   Dang luu 120.000d/buoi. Don gia IELTS 170.000d moi duoc chot hom nay.
--   Chenh 100.000d. Khong biet thuc te da tra 120.000 hay 170.000.
--   KHONG tu sua vi day la tien da tra cho nguoi lao dong.
