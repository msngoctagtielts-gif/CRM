-- 0025_expenses_da_tien_te.sql
--
-- Bang expenses co cot `currency` nhung view v_expenses_daily lai lam
-- `sum(amount)` khong nhom theo cot do. Mot dong 20 USD se bi cong thang vao
-- tong VND, cho ra con so chi phi sai gan 26.000 lan cho dong do. Chua man hinh
-- nao doc view nay nen sua bay gio la luc re nhat.
--
-- Bo sung `currency` vao cach nhom. Ai doc view se buoc phai thay co nhieu tien
-- te, thay vi nhan mot con so tron lan ma khong biet.

-- `create or replace` khong chen duoc cot vao giua: Postgres bao
-- "cannot change name of view column total to currency". Phai drop roi tao lai.
drop view if exists public.v_expenses_daily;

create view public.v_expenses_daily
with (security_invoker = on) as
select expense_date as day,
       category,
       currency,
       sum(amount) as total
from public.expenses
group by expense_date, category, currency;

comment on view public.v_expenses_daily is
  'Chi phi theo ngay, tach theo danh muc VA tien te. Khong duoc cong total giua
   hai dong khac currency. Quy doi ngoai te phai lam o tang bao cao, dung ty gia
   ghi ro ngay ap dung.';
