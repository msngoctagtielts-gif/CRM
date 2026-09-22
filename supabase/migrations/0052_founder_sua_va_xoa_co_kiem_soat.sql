-- 0052 — Cho Founder SỬA và XOÁ, nhưng có chặn và có nhật ký.
--
-- Trước migration này hệ thống chỉ biết THÊM. Cô Ngọc ghi sai một buổi học thì
-- phải nhắn trợ lý chạy SQL. Đó là phụ thuộc không chấp nhận được cho một trung
-- tâm đang chạy thật.
--
-- VÌ SAO KHÔNG MỞ THẲNG QUYỀN XOÁ TRÊN BẢNG
--   Đã kiểm: khoá ngoại tới lessons đều là ON DELETE CASCADE. Một lệnh
--   `delete from lessons` sẽ âm thầm kéo theo:
--     · teacher_payable_lessons  → tổng lương tháng đổi, kể cả tháng đã trả
--     · lesson_consumptions      → số buổi còn lại của học viên tự tăng lên
--     · teaching_reports         → mất luôn nhận xét giáo viên đã viết
--     · recordings, attendance, homework
--   Không ai được báo. Đó đúng là kiểu "đổi tiền mà không ai duyệt" mà hệ thống
--   này phải chống. Nên quyền xoá đi qua HÀM CÓ CHẶN, không đi thẳng vào bảng.
--
-- BA NGUYÊN TẮC CHUNG CHO CẢ SÁU HÀM DƯỚI ĐÂY
--   1. Chỉ Founder. Kiểm bằng is_founder(), không tin giao diện.
--   2. BẮT BUỘC có lý do. Không lý do thì không sửa được. Ba tháng sau nhìn lại
--      nhật ký mà không biết vì sao đã sửa thì nhật ký vô dụng.
--   3. Chụp lại bản cũ vào audit_logs TRƯỚC khi đổi. Bảng audit_logs đã có sẵn
--      từ migration 0001 nhưng chưa từng được ghi — bắt đầu dùng từ đây.

-- ---------------------------------------------------------------------------
-- Ghi nhật ký. Gọi nội bộ, không cấp quyền cho ai gọi trực tiếp.
-- ---------------------------------------------------------------------------
create or replace function public.fn_ghi_nhat_ky(
  p_bang     text,
  p_ban_ghi  uuid,
  p_hanh_dong text,
  p_cu       jsonb,
  p_moi      jsonb
) returns void
language sql
security definer
set search_path to 'public'
as $$
  insert into public.audit_logs (table_name, record_id, action, actor_id, old_data, new_data)
  values (p_bang, p_ban_ghi, p_hanh_dong, auth.uid(), p_cu, p_moi);
$$;

revoke all on function public.fn_ghi_nhat_ky(text, uuid, text, jsonb, jsonb) from public, authenticated, anon;

-- ---------------------------------------------------------------------------
-- 1. SỬA BUỔI HỌC
--
-- Chặn khi buổi đã bị khoá vào bảng lương (status included/paid) hoặc bảng
-- lương tháng đó đã duyệt/đã trả. Sửa một buổi đã trả lương là sửa số tiền của
-- giáo viên sau khi họ đã nhận — việc đó phải đi qua phiếu điều chỉnh lương,
-- không phải sửa lén con số gốc.
--
-- CHI TIẾT DỄ SAI: trigger tg_lessons_derive tính lại duration_minutes từ
-- actual_start_at/actual_end_at khi cả hai có mặt. Nên nếu buổi đã ghi giờ thật,
-- đổi thời lượng phải dời actual_end_at theo, không thì giá trị mới bị ghi đè
-- ngay trong cùng lệnh update và Founder tưởng mình sửa hụt.
-- ---------------------------------------------------------------------------
create or replace function public.fn_sua_buoi_hoc(
  p_lesson_id        uuid,
  p_lesson_date      date,
  p_duration_minutes int,
  p_teacher_id       uuid,
  p_status           text,
  p_ly_do            text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cu      public.lessons;
  v_khoa    text;
  v_moi     jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc sua buoi hoc.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do sua.' using errcode = '22023';
  end if;

  select * into v_cu from public.lessons where id = p_lesson_id;
  if not found then
    raise exception 'Khong tim thay buoi hoc.' using errcode = 'P0002';
  end if;

  select case
           when tpl.status = 'paid' then 'Buoi nay da tra luong.'
           when tpl.status = 'included' then 'Buoi nay da chot vao bang luong.'
           when pr.status in ('approved','paid') then 'Bang luong thang do da duyet.'
         end
    into v_khoa
    from public.teacher_payable_lessons tpl
    left join public.teacher_payroll pr on pr.id = tpl.payroll_id
   where tpl.lesson_id = p_lesson_id;

  if v_khoa is not null then
    raise exception '% Sua so buoi nay phai qua phieu dieu chinh luong.', v_khoa
      using errcode = '23514';
  end if;

  update public.lessons
     set lesson_date      = coalesce(p_lesson_date, lesson_date),
         duration_minutes = coalesce(p_duration_minutes, duration_minutes),
         teacher_id       = coalesce(p_teacher_id, teacher_id),
         status           = coalesce(p_status::public.lesson_status, status),
         -- Dời giờ kết thúc theo thời lượng mới, nếu buổi đã ghi giờ thật.
         actual_end_at    = case
                              when p_duration_minutes is not null
                               and actual_start_at is not null
                               and actual_end_at is not null
                              then actual_start_at + make_interval(mins => p_duration_minutes)
                              else actual_end_at
                            end,
         updated_at       = now()
   where id = p_lesson_id;

  select to_jsonb(l) into v_moi from public.lessons l where l.id = p_lesson_id;

  perform public.fn_ghi_nhat_ky(
    'lessons', p_lesson_id, 'sua: ' || btrim(p_ly_do), to_jsonb(v_cu), v_moi);

  return jsonb_build_object('ok', true, 'lesson_id', p_lesson_id);
end;
$$;

revoke all on function public.fn_sua_buoi_hoc(uuid, date, int, uuid, text, text) from public, anon;
grant execute on function public.fn_sua_buoi_hoc(uuid, date, int, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. XOÁ BUỔI HỌC
--
-- Chụp TOÀN BỘ những gì sắp mất vào nhật ký trước khi xoá — buổi, báo cáo, các
-- dòng trừ học phí, dòng lương, link video. Xoá nhầm thì còn đọc lại được để
-- dựng tay; không chụp thì mất hẳn.
-- ---------------------------------------------------------------------------
create or replace function public.fn_xoa_buoi_hoc(
  p_lesson_id uuid,
  p_ly_do     text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_khoa  text;
  v_anh   jsonb;
  v_tom   jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc xoa buoi hoc.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do xoa.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.lessons where id = p_lesson_id) then
    raise exception 'Khong tim thay buoi hoc.' using errcode = 'P0002';
  end if;

  select case
           when tpl.status = 'paid' then 'Buoi nay da tra luong cho giao vien.'
           when tpl.status = 'included' then 'Buoi nay da chot vao bang luong.'
           when pr.status in ('approved','paid') then 'Bang luong thang do da duyet.'
         end
    into v_khoa
    from public.teacher_payable_lessons tpl
    left join public.teacher_payroll pr on pr.id = tpl.payroll_id
   where tpl.lesson_id = p_lesson_id;

  if v_khoa is not null then
    raise exception '% Khong xoa duoc. Doi trang thai buoi thanh cancelled, hoac dung phieu dieu chinh luong.', v_khoa
      using errcode = '23514';
  end if;

  select jsonb_build_object(
           'lesson',       (select to_jsonb(l) from public.lessons l where l.id = p_lesson_id),
           'report',       (select to_jsonb(tr) from public.teaching_reports tr where tr.lesson_id = p_lesson_id),
           'consumptions', (select coalesce(jsonb_agg(to_jsonb(lc)), '[]'::jsonb)
                              from public.lesson_consumptions lc where lc.lesson_id = p_lesson_id),
           'payable',      (select to_jsonb(tpl) from public.teacher_payable_lessons tpl where tpl.lesson_id = p_lesson_id),
           'attendance',   (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
                              from public.attendance a where a.lesson_id = p_lesson_id),
           'recordings',   (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                              from public.recordings r where r.lesson_id = p_lesson_id),
           'homework',     (select coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb)
                              from public.homework h where h.lesson_id = p_lesson_id))
    into v_anh;

  select jsonb_build_object(
           'so_dong_tru_hoc_phi', jsonb_array_length(v_anh->'consumptions'),
           'co_bao_cao',          (v_anh->'report') is not null and v_anh->'report' <> 'null'::jsonb,
           'co_dong_luong',       (v_anh->'payable') is not null and v_anh->'payable' <> 'null'::jsonb,
           'so_video',            jsonb_array_length(v_anh->'recordings'))
    into v_tom;

  -- zoom_sessions là NO ACTION nên phải gỡ tay, không thì lệnh xoá bị chặn.
  update public.zoom_sessions set lesson_id = null where lesson_id = p_lesson_id;

  perform public.fn_ghi_nhat_ky(
    'lessons', p_lesson_id, 'xoa: ' || btrim(p_ly_do), v_anh, null);

  delete from public.lessons where id = p_lesson_id;

  return jsonb_build_object('ok', true, 'da_xoa_kem', v_tom);
end;
$$;

revoke all on function public.fn_xoa_buoi_hoc(uuid, text) from public, anon;
grant execute on function public.fn_xoa_buoi_hoc(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. SỬA PHIẾU THU
--
-- Chặn khi phiếu đã gắn vào một phiếu học phí tháng đã phát hành. Sửa số tiền
-- sau khi đã gửi bảng kê cho phụ huynh là làm bảng kê nói dối.
-- ---------------------------------------------------------------------------
create or replace function public.fn_sua_phieu_thu(
  p_payment_id   uuid,
  p_payment_date date,
  p_amount       numeric,
  p_reference    text,
  p_notes        text,
  p_ly_do        text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cu  public.payments;
  v_moi jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc sua phieu thu.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do sua.' using errcode = '22023';
  end if;

  select * into v_cu from public.payments where id = p_payment_id;
  if not found then
    raise exception 'Khong tim thay phieu thu.' using errcode = 'P0002';
  end if;

  if v_cu.statement_id is not null then
    raise exception 'Phieu thu nay da nam trong mot phieu hoc phi thang da phat hanh. Huy phieu hoc phi do truoc.'
      using errcode = '23514';
  end if;

  if p_amount is not null and p_amount <= 0 then
    raise exception 'So tien phai lon hon 0.' using errcode = '22023';
  end if;

  update public.payments
     set payment_date = coalesce(p_payment_date, payment_date),
         amount       = coalesce(p_amount, amount),
         reference    = coalesce(p_reference, reference),
         notes        = coalesce(p_notes, notes),
         updated_at   = now()
   where id = p_payment_id;

  select to_jsonb(p) into v_moi from public.payments p where p.id = p_payment_id;

  perform public.fn_ghi_nhat_ky(
    'payments', p_payment_id, 'sua: ' || btrim(p_ly_do), to_jsonb(v_cu), v_moi);

  return jsonb_build_object('ok', true, 'payment_id', p_payment_id);
end;
$$;

revoke all on function public.fn_sua_phieu_thu(uuid, date, numeric, text, text, text) from public, anon;
grant execute on function public.fn_sua_phieu_thu(uuid, date, numeric, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. HUỶ PHIẾU THU — KHÔNG xoá cứng.
--
-- Bản ghi tiền không bao giờ được biến mất. Một phiếu thu đã tồn tại là bằng
-- chứng có người đã gõ nó vào; nếu sai thì phải thấy được là đã sai và ai huỷ.
-- Xoá cứng làm sổ sách khớp một cách giả tạo.
-- ---------------------------------------------------------------------------
create or replace function public.fn_huy_phieu_thu(
  p_payment_id uuid,
  p_ly_do      text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cu  public.payments;
  v_moi jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc huy phieu thu.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do huy.' using errcode = '22023';
  end if;

  select * into v_cu from public.payments where id = p_payment_id;
  if not found then
    raise exception 'Khong tim thay phieu thu.' using errcode = 'P0002';
  end if;
  if v_cu.status = 'cancelled' then
    raise exception 'Phieu thu nay da huy roi.' using errcode = '23514';
  end if;
  if v_cu.statement_id is not null then
    raise exception 'Phieu thu nay da nam trong mot phieu hoc phi thang da phat hanh.'
      using errcode = '23514';
  end if;

  update public.payments
     set status      = 'cancelled',
         notes       = concat_ws(E'\n', notes, 'Huy ngay ' || to_char(now(), 'DD/MM/YYYY') || ': ' || btrim(p_ly_do)),
         updated_at  = now()
   where id = p_payment_id;

  select to_jsonb(p) into v_moi from public.payments p where p.id = p_payment_id;

  perform public.fn_ghi_nhat_ky(
    'payments', p_payment_id, 'huy: ' || btrim(p_ly_do), to_jsonb(v_cu), v_moi);

  return jsonb_build_object('ok', true, 'payment_id', p_payment_id);
end;
$$;

revoke all on function public.fn_huy_phieu_thu(uuid, text) from public, anon;
grant execute on function public.fn_huy_phieu_thu(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. SỬA LỚP  —  6. SỬA GIÁO VIÊN
--
-- Hai bảng này không có nút xoá, và đó là cố ý. Lớp và giáo viên đều gắn với
-- lịch sử dạy và lịch sử lương. Xoá là mất lịch sử. Nghỉ dạy thì đổi trạng thái
-- thành inactive; lớp kết thúc thì đổi status — số liệu cũ vẫn còn nguyên.
-- ---------------------------------------------------------------------------
create or replace function public.fn_sua_lop(
  p_class_id   uuid,
  p_name       text,
  p_class_code text,
  p_teacher_id uuid,
  p_status     text,
  p_meeting_url text,
  p_notes      text,
  p_ly_do      text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cu  public.classes;
  v_moi jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc sua lop.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do sua.' using errcode = '22023';
  end if;

  select * into v_cu from public.classes where id = p_class_id;
  if not found then
    raise exception 'Khong tim thay lop.' using errcode = 'P0002';
  end if;

  update public.classes
     set name        = coalesce(nullif(btrim(p_name), ''), name),
         class_code  = coalesce(nullif(btrim(p_class_code), ''), class_code),
         teacher_id  = coalesce(p_teacher_id, teacher_id),
         status      = coalesce(p_status::public.class_status, status),
         meeting_url = coalesce(p_meeting_url, meeting_url),
         notes       = coalesce(p_notes, notes),
         updated_at  = now()
   where id = p_class_id;

  select to_jsonb(c) into v_moi from public.classes c where c.id = p_class_id;

  perform public.fn_ghi_nhat_ky(
    'classes', p_class_id, 'sua: ' || btrim(p_ly_do), to_jsonb(v_cu), v_moi);

  return jsonb_build_object('ok', true, 'class_id', p_class_id);
end;
$$;

revoke all on function public.fn_sua_lop(uuid, text, text, uuid, text, text, text, text) from public, anon;
grant execute on function public.fn_sua_lop(uuid, text, text, uuid, text, text, text, text) to authenticated;

create or replace function public.fn_sua_giao_vien(
  p_teacher_id uuid,
  p_full_name  text,
  p_display_name text,
  p_email      text,
  p_phone      text,
  p_status     text,
  p_notes      text,
  p_ly_do      text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cu  public.teachers;
  v_moi jsonb;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc sua ho so giao vien.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do sua.' using errcode = '22023';
  end if;

  select * into v_cu from public.teachers where id = p_teacher_id;
  if not found then
    raise exception 'Khong tim thay giao vien.' using errcode = 'P0002';
  end if;

  update public.teachers
     set full_name    = coalesce(nullif(btrim(p_full_name), ''), full_name),
         display_name = coalesce(p_display_name, display_name),
         email        = coalesce(nullif(btrim(p_email), '')::citext, email),
         phone        = coalesce(p_phone, phone),
         status       = coalesce(p_status::public.record_status, status),
         notes        = coalesce(p_notes, notes),
         updated_at   = now()
   where id = p_teacher_id;

  select to_jsonb(t) into v_moi from public.teachers t where t.id = p_teacher_id;

  perform public.fn_ghi_nhat_ky(
    'teachers', p_teacher_id, 'sua: ' || btrim(p_ly_do), to_jsonb(v_cu), v_moi);

  return jsonb_build_object('ok', true, 'teacher_id', p_teacher_id);
end;
$$;

revoke all on function public.fn_sua_giao_vien(uuid, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.fn_sua_giao_vien(uuid, text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- View đọc nhật ký cho màn hình "Nhật ký thay đổi". CHỈ FOUNDER.
-- ---------------------------------------------------------------------------
drop view if exists public.v_nhat_ky_thay_doi;

create view public.v_nhat_ky_thay_doi as
select a.id,
       a.created_at,
       a.table_name,
       a.record_id,
       a.action,
       u.full_name as nguoi_sua,
       a.old_data,
       a.new_data
  from public.audit_logs a
  left join public.users u on u.id = a.actor_id
 where public.is_founder()
 order by a.created_at desc;

comment on view public.v_nhat_ky_thay_doi is
  'Nhat ky moi lan Founder sua hoac xoa du lieu. CHI FOUNDER.';

revoke all on public.v_nhat_ky_thay_doi from authenticated, anon;
grant select on public.v_nhat_ky_thay_doi to authenticated;
