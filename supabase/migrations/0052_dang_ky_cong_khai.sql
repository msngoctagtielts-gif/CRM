-- 0052 — ĐĂNG KÝ TỪ WEBSITE CÔNG KHAI.
--
-- Trang web công khai (thư mục web/) cho người lạ để lại thông tin. Người lạ
-- KHÔNG có tài khoản, nên họ chạy bằng vai `anon`. Mà `anon` đã bị 0011 thu hồi
-- sạch quyền trên mọi bảng — đúng như vậy, và migration này không mở lại.
--
-- Cách duy nhất người lạ ghi được vào cơ sở dữ liệu là gọi một hàm
-- SECURITY DEFINER đã đóng khung sẵn: hàm tự quyết `status`, tự quyết `source`,
-- tự sinh `lead_code`. Người gọi không đặt được các cột đó, kể cả khi họ tự
-- dựng request bằng tay ngoài trình duyệt.
--
-- Ba thứ phải có vì đây là điểm ghi công khai đầu tiên của hệ thống:
--   1. Chặn spam    — mỗi IP tối đa 5 lượt/giờ.
--   2. Chống trùng  — cùng số điện thoại trong 24 giờ thì gộp, không đẻ lead mới.
--                     Người ta bấm hai lần là chuyện thường; cô Ngọc gọi lại hai
--                     lần cho cùng một người mới là chuyện dở.
--   3. Không lưu IP thô. Chỉ lưu bản băm có muối. Đủ để đếm, không đủ để truy ra ai.
--
-- CÒN THIẾU, đã ghi vào TODO.md P3: `ho_so_thau_hieu` chưa nằm trong danh sách
-- bảng của `fn_tao_ban_sao_luu()` ở 0035. `leads` thì đã có, nên mất dữ liệu ở
-- đây chỉ mất phần chân dung chứ không mất người đăng ký. Thêm vào khi sửa 0035
-- lần tới, đừng chép cả hàm 100 dòng sang đây chỉ để thêm một chuỗi.

-- -----------------------------------------------------------------------------
-- Hồ sơ "thấu hiểu người học" — kết quả bài tự đánh giá trên web
-- -----------------------------------------------------------------------------
create table if not exists public.ho_so_thau_hieu (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references public.leads (id) on delete cascade,
  ma_chan_dung  text not null,
  cau_tra_loi   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

comment on table public.ho_so_thau_hieu is
  'Bài tự đánh giá trên web công khai. Đây là thông tin người học TỰ KHAI, '
  'không phải kết quả kiểm tra trình độ — không dùng để xếp lớp. '
  'Xếp lớp vẫn đi qua placement_tests.';
comment on column public.ho_so_thau_hieu.ma_chan_dung is
  'ngai_noi | so_sai | ban_ron | mat_goc | ielts_gap | phu_huynh';

create index if not exists idx_ho_so_thau_hieu_lead
  on public.ho_so_thau_hieu (lead_id);

-- -----------------------------------------------------------------------------
-- Nhật ký chống spam
-- -----------------------------------------------------------------------------
create table if not exists public.dang_ky_nhat_ky (
  id         bigserial primary key,
  ip_bam     text not null,
  created_at timestamptz not null default now()
);

comment on table public.dang_ky_nhat_ky is
  'Chỉ để đếm số lượt theo IP đã băm. Không lưu IP thô, không nối được với lead.';

create index if not exists idx_dang_ky_nhat_ky_ip
  on public.dang_ky_nhat_ky (ip_bam, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS: hai bảng mới đi theo đúng khuôn của 0011 — Founder toàn quyền, còn lại không.
-- -----------------------------------------------------------------------------
alter table public.ho_so_thau_hieu  enable row level security;
alter table public.dang_ky_nhat_ky  enable row level security;

drop policy if exists ho_so_thau_hieu_founder_all on public.ho_so_thau_hieu;
create policy ho_so_thau_hieu_founder_all on public.ho_so_thau_hieu
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists dang_ky_nhat_ky_founder_read on public.dang_ky_nhat_ky;
create policy dang_ky_nhat_ky_founder_read on public.dang_ky_nhat_ky
  for select using (public.is_founder());

revoke all on public.ho_so_thau_hieu, public.dang_ky_nhat_ky from anon;
grant select, insert, update, delete on public.ho_so_thau_hieu to authenticated;
grant select on public.dang_ky_nhat_ky to authenticated;

-- -----------------------------------------------------------------------------
-- Chuẩn hoá số điện thoại Việt Nam
-- -----------------------------------------------------------------------------
create or replace function public.chuan_hoa_dien_thoai(p_so text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_so, ''), '[^0-9+]', '', 'g');
  -- +84xxxxxxxxx và 84xxxxxxxxx đều về dạng 0xxxxxxxxx
  if v like '+84%' then v := '0' || substring(v from 4); end if;
  if v like '84%' and length(v) >= 10 then v := '0' || substring(v from 3); end if;
  if v !~ '^0[0-9]{8,10}$' then return null; end if;
  return v;
end; $$;

comment on function public.chuan_hoa_dien_thoai(text) is
  'Trả về dạng 0xxxxxxxxx, hoặc NULL nếu không phải số điện thoại Việt Nam hợp lệ.';

-- -----------------------------------------------------------------------------
-- Điểm ghi công khai DUY NHẤT
-- -----------------------------------------------------------------------------
create or replace function public.dang_ky_tu_van(
  p_ho_ten       text,
  p_dien_thoai   text,
  p_email        text    default null,
  p_tuoi         int     default null,
  p_muc_tieu     text    default null,
  p_ma_chan_dung text    default null,
  p_cau_tra_loi  jsonb   default '{}'::jsonb,
  p_nguon        text    default 'website',
  p_ip_bam       text    default ''
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten    text;
  v_so     text;
  v_email  text;
  v_nguon  text;
  v_dem    int;
  v_lead   public.leads%rowtype;
  v_ghi_chu text;
begin
  -- 1. Làm sạch đầu vào ------------------------------------------------------
  v_ten := nullif(btrim(coalesce(p_ho_ten, '')), '');
  if v_ten is null or length(v_ten) < 2 then
    raise exception 'THIEU_HO_TEN';
  end if;
  v_ten := left(v_ten, 120);

  v_so := public.chuan_hoa_dien_thoai(p_dien_thoai);
  if v_so is null then
    raise exception 'SAI_DIEN_THOAI';
  end if;

  v_email := nullif(btrim(lower(coalesce(p_email, ''))), '');
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' then
    v_email := null;   -- email sai định dạng thì bỏ, không chặn cả lượt đăng ký
  end if;

  -- Nguồn do máy chủ quyết định, không tin chuỗi client gửi lên.
  v_nguon := case coalesce(p_nguon, '')
               when 'thau_hieu' then 'website:thau-hieu'
               when 'dang_ky'   then 'website:dang-ky'
               when 'kien_thuc' then 'website:kien-thuc'
               else 'website'
             end;

  -- 2. Chặn spam theo IP đã băm ---------------------------------------------
  if coalesce(p_ip_bam, '') <> '' then
    select count(*) into v_dem
      from public.dang_ky_nhat_ky
     where ip_bam = p_ip_bam
       and created_at > now() - interval '1 hour';
    if v_dem >= 5 then
      raise exception 'QUA_NHIEU_LUOT';
    end if;
    insert into public.dang_ky_nhat_ky (ip_bam) values (p_ip_bam);
  end if;

  -- 3. Trùng số trong 24 giờ thì gộp vào lead cũ ----------------------------
  select * into v_lead
    from public.leads
   where phone = v_so
     and created_at > now() - interval '24 hours'
   order by created_at desc
   limit 1;

  if found then
    insert into public.lead_activities (lead_id, activity_type, content)
    values (v_lead.id, 'note',
            format('Gửi lại biểu mẫu trên web (%s) lúc %s.',
                   v_nguon, to_char(now() at time zone 'Asia/Ho_Chi_Minh',
                                    'HH24:MI DD/MM/YYYY')));
    if p_ma_chan_dung is not null then
      insert into public.ho_so_thau_hieu (lead_id, ma_chan_dung, cau_tra_loi)
      values (v_lead.id, p_ma_chan_dung, coalesce(p_cau_tra_loi, '{}'::jsonb));
    end if;
    return v_lead.lead_code;
  end if;

  -- 4. Lead mới --------------------------------------------------------------
  v_ghi_chu := concat_ws(E'\n',
    'Đăng ký từ website công khai.',
    case when p_muc_tieu is not null
         then 'Mục tiêu tự khai: ' || left(btrim(p_muc_tieu), 500) end,
    case when p_ma_chan_dung is not null
         then 'Chân dung người học: ' || p_ma_chan_dung end);

  insert into public.leads (full_name, phone, email, age, goal, source, status, notes)
  values (v_ten, v_so, v_email,
          case when p_tuoi between 1 and 120 then p_tuoi end,
          nullif(left(btrim(coalesce(p_muc_tieu, '')), 500), ''),
          v_nguon, 'new', v_ghi_chu)
  returning * into v_lead;

  if p_ma_chan_dung is not null then
    insert into public.ho_so_thau_hieu (lead_id, ma_chan_dung, cau_tra_loi)
    values (v_lead.id, p_ma_chan_dung, coalesce(p_cau_tra_loi, '{}'::jsonb));
  end if;

  return v_lead.lead_code;
end; $$;

comment on function public.dang_ky_tu_van is
  'Điểm ghi công khai duy nhất. Người lạ chỉ tạo được lead ở trạng thái new; '
  'không đặt được status, assigned_to hay bất cứ cột nào khác.';

-- Mặc định của PostgreSQL là cấp execute cho PUBLIC. Thu hồi rồi cấp lại đúng
-- hai vai cần dùng, để về sau thêm vai mới không vô tình mở cửa.
revoke all on function public.dang_ky_tu_van(text,text,text,int,text,text,jsonb,text,text) from public;
grant usage on schema public to anon;
grant execute on function public.dang_ky_tu_van(text,text,text,int,text,text,jsonb,text,text)
  to anon, authenticated;
grant execute on function public.chuan_hoa_dien_thoai(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- View cho màn hình tuyển sinh
-- -----------------------------------------------------------------------------
-- security_invoker = on: view chạy bằng quyền NGƯỜI GỌI, nên RLS của bảng
-- leads vẫn có hiệu lực. Thiếu dòng này thì view chạy bằng quyền chủ sở hữu và
-- bỏ qua RLS — đúng cái bẫy mà 0010 đã ghi chú.
create or replace view public.v_tuyen_sinh
with (security_invoker = on) as
select l.id,
       l.lead_code,
       l.full_name,
       l.phone,
       l.email,
       l.age,
       l.goal,
       l.source,
       l.status,
       l.notes,
       l.next_follow_up_at,
       l.created_at,
       h.ma_chan_dung,
       h.cau_tra_loi,
       (select count(*) from public.lead_activities a where a.lead_id = l.id)
         as so_lan_lien_he
  from public.leads l
  left join lateral (
       select ma_chan_dung, cau_tra_loi
         from public.ho_so_thau_hieu s
        where s.lead_id = l.id
        order by created_at desc
        limit 1
  ) h on true;

comment on view public.v_tuyen_sinh is
  'Danh sách tuyển sinh cho màn /tuyen-sinh. Đi qua RLS của leads nên chỉ '
  'Founder đọc được.';

-- Supabase cấp sẵn quyền cho `anon` trên mọi bảng/view mới qua default
-- privileges. Thu hồi lại cho chắc — view này đọc dữ liệu liên hệ của người thật.
revoke all on public.v_tuyen_sinh from anon;
grant select on public.v_tuyen_sinh to authenticated;
