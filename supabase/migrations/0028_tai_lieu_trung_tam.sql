-- 0028_tai_lieu_trung_tam.sql
--
-- Kho hồ sơ trung tâm ngay trong hệ thống.
--
-- Cô Ngọc: "khi mà học viên cần tôi có thể gửi liền cho họ mà không phải tìm
-- kiếm ở nhiều nơi mất thời gian".
--
-- Bảng này KHÔNG chứa nội dung tài liệu. Nó chứa ĐƯỜNG DẪN tới tài liệu, vì
-- tài liệu thật đang nằm ở Google Drive, Notion, website. Chép nội dung vào đây
-- sẽ tạo ra bản thứ hai, rồi hai bản lệch nhau — đúng cái bệnh đang phải chữa.
-- Một tài liệu, một đường dẫn, một nơi để tìm.

do $$ begin
  create type document_category as enum
    ('thoa_thuan','hoc_phi_lo_trinh','website','chinh_sach','bieu_mau','khac');
exception when duplicate_object then null; end $$;

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    document_category not null default 'khac',

  -- Ai được gửi tài liệu này. Dùng mảng vì một tài liệu thường gửi cho nhiều
  -- nhóm: thoả thuận học viên gửi cả học viên lẫn phụ huynh.
  audiences   text[] not null default '{}',

  -- Bảy giai đoạn tư vấn cô Ngọc đã vẽ. NULL = không thuộc giai đoạn nào.
  stage       int check (stage between 1 and 7),

  url         text,
  notes       text,
  status      record_status not null default 'active',
  sort_order  int not null default 100,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.users (id),

  constraint chk_documents_audiences check (
    audiences <@ array['hoc_vien','phu_huynh','giao_vien','noi_bo']::text[]
  )
);

comment on table public.documents is
  'Kho đường dẫn hồ sơ trung tâm. Không chứa nội dung tài liệu, chỉ chứa link.';
comment on column public.documents.audiences is
  'hoc_vien | phu_huynh | giao_vien | noi_bo. Giáo viên chỉ đọc được dòng có giao_vien.';
-- record_status chỉ có 'active' và 'archived', không có trạng thái "nháp". Nên
-- KHÔNG ràng buộc "active thì phải có link": làm vậy sẽ ép hồ sơ chưa có phải
-- mang nhãn 'archived', đọc ra là "tài liệu cũ" trong khi thực tế là "chưa làm".
comment on column public.documents.url is
  'Đường dẫn gửi cho học viên. NULL hoặc rỗng = chưa có tài liệu, màn hình hiện "Cần bổ sung".';
comment on column public.documents.stage is
  'Giai đoạn 1-7 trong quy trình tư vấn Founder đã vẽ. NULL = không gắn giai đoạn.';

create index if not exists idx_documents_sap_xep
  on public.documents (status, category, sort_order);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Founder toàn quyền. Giáo viên CHỈ đọc, và chỉ những dòng ghi rõ gửi cho giáo
-- viên. Bảng học phí và thoả thuận học viên không thuộc việc của giáo viên.
alter table public.documents enable row level security;

drop policy if exists documents_founder_all on public.documents;
create policy documents_founder_all on public.documents
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists documents_teacher_read on public.documents;
create policy documents_teacher_read on public.documents
  for select using (
    public.is_teacher()
    and status = 'active'
    and 'giao_vien' = any (audiences)
  );
