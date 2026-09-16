-- 0027_moc_bat_buoc_ghi_gio.sql
--
-- Founder chot ngay 16/09/2026:
--   "So buoi bao nhieu la toi deu thanh toan giao vien, tinh theo buoi."
--   "Khong ghi gio vao / gio ra chi duoc ap dung sau ke tu thang 9/2026,
--    truoc do duoc chap nhan."
--
-- VAN DE DANG CO
--   fn_generate_payable_lesson co mot cong chan cung (D5): buoi nao khong co
--   gio vao/gio ra, hoac diem danh chua du si so, thi XOA dong tinh luong va
--   thoat. Khong tao dong nao, khong bao gi.
--
--   Hau qua do duoc: 316 tren 461 buoi khong co dong tinh luong. Tat ca deu
--   truot cung mot dieu kien la khong ghi gio. Du lieu lich su nhap tu cac
--   sheet feedback cua lop, ma sheet chi ghi NGAY chu khong ghi GIO (xem D38).
--   Nghia la giao vien day 316 buoi that nhung he thong khong tra luong buoi nao.
--
-- MAU THUAN SAN CO TRONG CHINH MA NGUON
--   Ghi chu cot teacher_payable_lessons.has_evidence viet:
--     'false = buoi nay thieu bang chung timestamp. VAN TINH LUONG, chi gan co
--      cho Founder thay (D4).'
--   Nhung cong chan D5 lam nguoc lai: thieu bang chung thi khong tao dong nao.
--   D4 va D5 da mau thuan nhau tu truoc. Quyet dinh cua Founder hom nay giai
--   quyet theo huong D4.
--
-- CACH SUA
--   Dat moc trong bang settings thay vi viet cung trong ham, de Founder tu doi
--   duoc ngay ma khong can migration moi.
--
--   Tu moc tro di : giu nguyen cong chan cu. Thieu gio hoac thieu diem danh
--                   thi chua sinh dong tinh luong. Day la cong cu kiem soat,
--                   giu lai co chu dich.
--   Truoc moc     : chap nhan hien trang. Van sinh dong tinh luong, nhung
--                   has_evidence / has_video van ghi dung su that va notes ghi
--                   ro thieu gi, de Founder nhin thay chu khong bi giau.
--
-- LUU Y: day KHONG phai bo kiem soat chat luong. No chi noi rang khong the doi
-- hoi du lieu lich su phai co thu ma nguoi nhap chua bao gio duoc yeu cau ghi.

insert into public.settings (key, value, description)
values (
  'require_evidence_from',
  '"2026-09-01"'::jsonb,
  'Tu ngay nay tro di, buoi day phai co gio vao/gio ra VA diem danh du si so thi moi sinh dong tinh luong. Truoc ngay nay chap nhan hien trang vi du lieu nhap tu sheet khong co hai truong do. Doi ngay o day la doi duoc luat, khong can sua ma nguon.'
)
on conflict (key) do update set value = excluded.value, description = excluded.description;

create or replace function public.fn_generate_payable_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l            public.lessons;
  r            public.teaching_reports;
  v_students   int;
  v_attendance int;
  v_rate       numeric(14,2);
  v_source     text;
  v_duration   int;
  v_has_time   boolean;
  v_moc        date;
  v_bat_buoc   boolean;
  v_thieu      text;
begin
  select * into l from public.lessons where id = p_lesson_id;
  if not found or l.teacher_id is null then return; end if;

  if l.status <> 'completed' then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status in ('pending','excluded');
    return;
  end if;

  select * into r from public.teaching_reports where lesson_id = p_lesson_id;

  v_has_time := (r.id is not null and r.start_time is not null and r.end_time is not null)
             or (l.actual_start_at is not null and l.actual_end_at is not null);

  select count(*) into v_students
    from public.class_students cs
   where cs.class_id = l.class_id and cs.status = 'active';

  select count(*) into v_attendance
    from public.attendance a where a.lesson_id = p_lesson_id;

  select coalesce((value #>> '{}')::date, date '2026-09-01')
    into v_moc from public.settings where key = 'require_evidence_from';
  v_moc := coalesce(v_moc, date '2026-09-01');

  v_bat_buoc := l.lesson_date >= v_moc;

  -- Tu moc tro di: thieu bang chung thi chua sinh dong tinh luong (cong chan cu).
  if v_bat_buoc and (not v_has_time or v_attendance = 0 or v_attendance < v_students) then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status = 'pending';
    return;
  end if;

  if exists (select 1 from public.teacher_payable_lessons
              where lesson_id = p_lesson_id and status in ('included','paid')) then
    return;
  end if;

  -- Truoc moc: van tra luong, nhung ghi ro thieu gi.
  v_thieu := nullif(concat_ws('; ',
    case when not v_has_time   then 'khong ghi gio vao/gio ra' end,
    case when v_attendance = 0 then 'chua diem danh'
         when v_attendance < v_students then 'diem danh thieu nguoi' end), '');

  v_duration := coalesce(l.duration_minutes, 60);
  v_rate := public.fn_resolve_teacher_rate(l.teacher_id, v_duration, l.class_id, l.lesson_date);

  select coalesce(r2.scope, 'missing') into v_source
  from (
    select scope from public.teacher_rates
     where teacher_id = l.teacher_id
       and effective_from <= l.lesson_date
       and (effective_to is null or effective_to >= l.lesson_date)
       and ((scope = 'class' and class_id = l.class_id)
            or (scope = 'duration' and duration_minutes = v_duration)
            or scope = 'default')
     order by case scope when 'class' then 0 when 'duration' then 1 else 2 end
     limit 1
  ) r2;

  insert into public.teacher_payable_lessons (
    teacher_id, lesson_id, class_id, lesson_date, duration_minutes,
    rate_amount, amount, status, rate_source,
    has_evidence, has_video, qc_score, sent_to_parent, notes)
  values (
    l.teacher_id, p_lesson_id, l.class_id, l.lesson_date, v_duration,
    coalesce(v_rate, 0), coalesce(v_rate, 0), 'pending', coalesce(v_source, 'missing'),
    coalesce(r.qc_has_timestamp, false),
    coalesce(r.qc_has_video, false),
    r.qc_score,
    r.sent_to_parent_at is not null,
    nullif(concat_ws(' ',
      case when v_rate is null
           then 'Chua cau hinh don gia cho giao vien nay - can Founder bo sung.' end,
      case when v_thieu is not null
           then 'Buoi truoc moc ' || v_moc || ' nen van tinh luong du thieu: ' || v_thieu || '.' end
    ), ''))
  on conflict (lesson_id) do update
    set duration_minutes = excluded.duration_minutes,
        rate_amount      = excluded.rate_amount,
        amount           = excluded.amount,
        rate_source      = excluded.rate_source,
        has_evidence     = excluded.has_evidence,
        has_video        = excluded.has_video,
        qc_score         = excluded.qc_score,
        sent_to_parent   = excluded.sent_to_parent,
        notes            = excluded.notes,
        updated_at       = now()
  where public.teacher_payable_lessons.status = 'pending';
end;
$$;

comment on function public.fn_generate_payable_lesson(uuid) is
  'Sinh dong tinh luong cho mot buoi day. Tu ngay settings.require_evidence_from tro di thi bat buoc co gio vao/ra va diem danh du si so; truoc ngay do chap nhan hien trang va ghi ro thieu gi vao notes. Founder chot 16/09/2026.';
