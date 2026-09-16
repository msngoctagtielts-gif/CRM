-- 0026_siet_quyen_fn_nhap_feedback.sql
--
-- LOI TRONG MIGRATION 0024 CUA CHINH TOI.
--
-- 0024 viet:
--     revoke all on function public.fn_nhap_feedback(text, jsonb) from public;
--     grant execute on function public.fn_nhap_feedback(text, jsonb)
--       to authenticated, service_role;
--
-- `revoke ... from public` KHONG go duoc quyen da cap rieng cho tung vai tro.
-- Supabase co `alter default privileges` tu dong cap EXECUTE cho `anon` va
-- `authenticated` tren moi ham moi trong schema public. Lenh revoke cua toi
-- khong cham toi nhung quyen do.
--
-- Ket qua thuc te doc tu pg_proc.proacl ngay 16/09/2026:
--     anon=X, authenticated=X, service_role=X, postgres=X
-- Tuc la NGUOI CHUA DANG NHAP goi duoc endpoint /rest/v1/rpc/fn_nhap_feedback.
--
-- Muc do thiet hai: ham la SECURITY INVOKER nen RLS van ap dung cho nguoi goi.
-- Vai tro `anon` khong co policy ghi nao nen gan nhu chac chan khong ghi duoc
-- gi. Nhung do la TUYEN PHONG THU THU HAI cuu, khong phai thiet ke dung. Mot
-- endpoint ghi du lieu khong duoc phep mo cho nguoi chua dang nhap, va khong
-- duoc dua vao RLS de bu cho quyen cap sai.
--
-- Ham nay chi dung de NAP DU LIEU LICH SU hang loat, chay bang service_role.
-- Khong giao dien nao goi no. Vi vay chi service_role duoc chay.

revoke execute on function public.fn_nhap_feedback(text, jsonb) from public;
revoke execute on function public.fn_nhap_feedback(text, jsonb) from anon;
revoke execute on function public.fn_nhap_feedback(text, jsonb) from authenticated;
grant  execute on function public.fn_nhap_feedback(text, jsonb) to service_role;

-- Co dinh search_path. Khong co dong nay, nguoi goi doi search_path cua phien
-- lam viec thi cac ten bang khong ghi ro schema trong ham se tro sang bang gia.
alter function public.fn_nhap_feedback(text, jsonb) set search_path = public, pg_temp;
