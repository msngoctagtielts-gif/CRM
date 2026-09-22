-- 0055 — Ghi LÝ DO miễn phí, và sửa lại cách màn hình Mắt xích đọc con số.
--
-- ĐÍNH CHÍNH MỘT KẾT LUẬN SAI CỦA CHÍNH TRỢ LÝ (22/09/2026)
--   Migration 0051 và màn hình /mat-xich xếp 33 buổi vào nhóm "đứt ở chỗ có
--   tiền — đã trả lương 3.890.000đ nhưng không trừ học phí của ai", ngụ ý đó là
--   tiền rơi.
--
--   SAI. Kiểm lại từng buổi thì cả 33 buổi đều là buổi MIỄN PHÍ CÓ CHỦ Ý, có
--   ghi trong chính tài liệu nhập liệu của dự án:
--     · Luân & Tân — 14 buổi (7 mỗi bé), mục 2 báo cáo đối soát gia đình anh
--       Bùi Luyện; con số 7.480.000đ khớp đúng khoản anh chuyển 18/07/2026
--     · Thiên Ái   — kiểm tra đầu vào, học thử, 2 buổi cô Jai (mục 3 báo cáo)
--     · Hậu        — 4 buổi trước 29/05, báo cáo ghi rõ "Không tính kinh phí"
--     · Thảo       — 16/05 buổi đầu vào, và 07/07, 11/07, 17/07
--     · Toàn       — buổi kiểm tra đầu vào 30 phút (GIẢ ĐỊNH)
--     · Nhi 10/08  — "Buổi làm quen", tài liệu sai trình độ (GIẢ ĐỊNH)
--     · Kiên, Vy, Công Duy — Founder chốt 14/09/2026 miễn phí buổi 1
--
--   Và chính sách đã ghi rõ: miễn phí cho học viên KHÔNG làm giảm lương giáo
--   viên. Vậy chi phí đó là CÓ THẬT và CỐ Ý, không phải thất thoát.
--
-- LỖI THẬT NẰM Ở ĐÂU
--   Cờ is_billable = false không mang theo LÝ DO. Nhìn vào cơ sở dữ liệu không
--   phân biệt được "miễn phí có chủ ý" với "ai đó quên". Vì vậy màn hình Mắt
--   xích báo động 33/33 lần sai. Một cảnh báo sai 100% thì lần sau không ai tin.
--
--   Migration này cho cờ đó một lý do, điền lại cho các buổi đã có tài liệu, và
--   dạy màn hình Mắt xích phân biệt hai trường hợp.

alter table public.attendance
  add column if not exists ly_do_mien_phi text;

comment on column public.attendance.ly_do_mien_phi is
  'Vi sao buoi nay khong thu phi hoc vien. BAT BUOC khi is_billable = false. '
  'Null + is_billable = false nghia la CHUA AI GIAI TRINH — can Founder quyet.';

-- ---------------------------------------------------------------------------
-- Điền lại lý do, lấy nguyên văn từ tài liệu nhập liệu trong
-- supabase/data-imports/. KHÔNG suy diễn: buổi nào tài liệu không nói thì để
-- trống, và màn hình sẽ hỏi Founder.
-- ---------------------------------------------------------------------------
update public.attendance a
   set ly_do_mien_phi = 'Bay buoi mien phi moi be, ghi ro o muc 2 bao cao doi soat gia dinh anh Bui Luyen (14 buoi tong). Da doi chieu: 7.480.000d khop dung khoan chuyen 18/07/2026.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code in ('LUAN-SH', 'TAN-SH');

update public.attendance a
   set ly_do_mien_phi = 'Kiem tra dau vao, buoi hoc thu, va hai buoi co Jai — muc 3 bao cao Thien Ai.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code = 'THIENAI-KO';

update public.attendance a
   set ly_do_mien_phi = 'Bon buoi truoc moc 29/05/2026 — bao cao ghi ro "Khong tinh kinh phi".'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code = 'HAU-NH';

update public.attendance a
   set ly_do_mien_phi = case
         when l.lesson_date = date '2026-05-16'
           then 'Buoi kiem tra dau vao — bao cao chi Thao chot 26/07/2026.'
         else 'Buoi mien phi theo bao cao chi Thao chot 26/07/2026.'
       end
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code = 'THAO-PH';

update public.attendance a
   set ly_do_mien_phi = 'Buoi kiem tra dau vao 30 phut. GIA DINH cua tro ly khi nhap lieu 14/09/2026, CAN FOUNDER XAC NHAN.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code = 'TOAN-NH';

update public.attendance a
   set ly_do_mien_phi = 'Buoi lam quen; sheet ghi ro dung tai lieu thieu nhi khong dung trinh do, giao vien khong giao bai tap. GIA DINH, CAN FOUNDER XAC NHAN.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code = 'NHI-PH';

update public.attendance a
   set ly_do_mien_phi = 'Founder chot ngay 14/09/2026: mien phi buoi 1.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code in ('KIEN-SH', 'VY-SH', 'DUY-SH');

update public.attendance a
   set ly_do_mien_phi = 'Lop nhom: chi mot hoc vien chiu phi theo hop dong, cac ban con lai di kem khong thu them. GIA DINH tu cach nhap lieu, CAN FOUNDER XAC NHAN.'
  from public.lessons l join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id and a.is_billable = false and a.ly_do_mien_phi is null
   and c.class_code in ('KHOA-PH', 'HOANG-PH');

-- ---------------------------------------------------------------------------
-- Hàm để Founder tự đổi một buổi thành miễn phí, hoặc thu phí trở lại.
--
-- Đổi sang THU PHÍ sẽ kích hoạt trigger trg_attendance_consume và trừ buổi của
-- học viên ngay. Vì vậy chặn khi kỳ đó đã phát hành phiếu học phí — bảng kê đã
-- gửi phụ huynh thì không được đổi số sau lưng.
-- ---------------------------------------------------------------------------
create or replace function public.fn_danh_dau_mien_phi(
  p_lesson_id uuid,
  p_mien_phi  boolean,
  p_ly_do     text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ngay date;
  v_phieu text;
  v_so int;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc doi trang thai thu phi cua buoi hoc.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Phai ghi ly do.' using errcode = '22023';
  end if;

  select l.lesson_date into v_ngay from public.lessons l where l.id = p_lesson_id;
  if v_ngay is null then
    raise exception 'Khong tim thay buoi hoc.' using errcode = 'P0002';
  end if;

  select ts.period_label into v_phieu
    from public.tuition_statements ts
    join public.class_students cs on cs.student_id = ts.student_id
    join public.lessons l2 on l2.class_id = cs.class_id and l2.id = p_lesson_id
   where ts.status in ('issued', 'paid')
     and v_ngay between ts.period_start and ts.period_end
   limit 1;

  if v_phieu is not null then
    raise exception 'Ky % da phat hanh phieu hoc phi. Doi bay gio la sua bang ke da gui phu huynh.', v_phieu
      using errcode = '23514';
  end if;

  update public.attendance
     set is_billable    = not p_mien_phi,
         ly_do_mien_phi = case when p_mien_phi then btrim(p_ly_do) else null end
   where lesson_id = p_lesson_id;

  get diagnostics v_so = row_count;
  if v_so = 0 then
    raise exception 'Buoi nay chua diem danh ai nen chua co gi de danh dau. Diem danh truoc.'
      using errcode = 'P0002';
  end if;

  perform public.fn_ghi_nhat_ky(
    'attendance', p_lesson_id, 'UPDATE',
    case when p_mien_phi then 'Danh dau mien phi: ' else 'Thu phi tro lai: ' end || btrim(p_ly_do),
    null, jsonb_build_object('lesson_id', p_lesson_id, 'mien_phi', p_mien_phi));

  return jsonb_build_object('ok', true, 'so_dong', v_so);
end;
$$;

revoke all on function public.fn_danh_dau_mien_phi(uuid, boolean, text) from public, anon;
grant execute on function public.fn_danh_dau_mien_phi(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Dựng lại view Mắt xích cho biết phân biệt ba trường hợp thay vì hai:
--   · đã trừ học phí            → mắt xích liền
--   · miễn phí CÓ lý do         → mắt xích liền, vì đó là quyết định đã ghi
--   · miễn phí KHÔNG có lý do   → cần Founder quyết, không phải "thất thoát"
-- ---------------------------------------------------------------------------
drop view if exists public.v_mat_xich_buoi_hoc;

create view public.v_mat_xich_buoi_hoc as
with tru as (
  select lesson_id,
         sum(recognized_amount) as tien_hoc_phi,
         count(*)               as so_hoc_vien_bi_tru
    from public.lesson_consumptions
   group by lesson_id
),
mp as (
  select a.lesson_id,
         bool_and(not a.is_billable)                                as mien_phi_toan_bo,
         bool_or(not a.is_billable and a.ly_do_mien_phi is null)    as co_mien_phi_khong_ly_do,
         max(a.ly_do_mien_phi)                                      as ly_do_mien_phi,
         count(*)                                                   as so_diem_danh
    from public.attendance a
   group by a.lesson_id
)
select l.id                                   as lesson_id,
       c.id                                   as class_id,
       c.class_code,
       c.name                                 as ten_lop,
       t.full_name                            as giao_vien,
       l.lesson_date,
       l.duration_minutes,

       true                                        as x1_co_buoi,
       (tr.id is not null)                         as x2_co_bao_cao,
       (coalesce(btrim(tr.lesson_content), '') <> '') as x3_co_noi_dung,
       (tr.qc_score is not null)                   as x4_da_cham_qc,
       (tr.phut_thuc_te is not null)               as x5_da_xac_minh,
       -- Miễn phí CÓ lý do cũng là một mắt xích liền: tiền không chạy, nhưng
       -- đã có người quyết và đã ghi lại vì sao.
       (tru.lesson_id is not null
        or (coalesce(mp.mien_phi_toan_bo, false) and not coalesce(mp.co_mien_phi_khong_ly_do, true)))
                                                   as x6_da_tru_hoc_phi,
       (tpl.lesson_id is not null)                 as x7_da_vao_luong,
       (tr.sent_to_parent_at is not null)          as x8_da_gui_ph,

       (case when tr.id is not null then 1 else 0 end
      + case when coalesce(btrim(tr.lesson_content), '') <> '' then 1 else 0 end
      + case when tr.qc_score is not null then 1 else 0 end
      + case when tr.phut_thuc_te is not null then 1 else 0 end
      + case when tru.lesson_id is not null
               or (coalesce(mp.mien_phi_toan_bo, false) and not coalesce(mp.co_mien_phi_khong_ly_do, true))
             then 1 else 0 end
      + case when tpl.lesson_id is not null then 1 else 0 end
      + case when tr.sent_to_parent_at is not null then 1 else 0 end
      + 1)                                    as so_mat_xich_dat,

       coalesce(mp.mien_phi_toan_bo, false)    as mien_phi,
       mp.ly_do_mien_phi,

       case
         when coalesce(mp.so_diem_danh, 0) = 0                    then 'Chưa điểm danh ai'
         when coalesce(mp.co_mien_phi_khong_ly_do, false)         then 'Miễn phí nhưng chưa ghi lý do'
         when tr.id is null                                       then 'Thiếu báo cáo'
         when coalesce(btrim(tr.lesson_content), '') = ''         then 'Báo cáo trống nội dung'
         when tru.lesson_id is null and not coalesce(mp.mien_phi_toan_bo, false)
                                                                  then 'Chưa trừ học phí'
         when tpl.lesson_id is null                               then 'Chưa vào lương'
         when tr.qc_score is null                                 then 'Chưa chấm chất lượng'
         when tr.sent_to_parent_at is null                        then 'Chưa gửi phụ huynh'
         when tr.phut_thuc_te is null                             then 'Chưa xác minh video'
         else null
       end                                    as diem_dut,

       case
         when coalesce(mp.so_diem_danh, 0) = 0                    then 'tien'
         when tpl.lesson_id is not null and tr.id is null         then 'tien'
         when tru.lesson_id is null and not coalesce(mp.mien_phi_toan_bo, false)
                                                                  then 'tien'
         when coalesce(mp.co_mien_phi_khong_ly_do, false)         then 'can_quyet'
         when tr.id is null                                       then 'bang_chung'
         when coalesce(btrim(tr.lesson_content), '') = ''         then 'bang_chung'
         when tr.sent_to_parent_at is null                        then 'phu_huynh'
         when tr.phut_thuc_te is null                             then 'xac_minh'
         else 'du'
       end                                    as muc_do,

       tpl.amount                             as tien_tra_giao_vien,
       tru.tien_hoc_phi,
       tru.so_hoc_vien_bi_tru,
       tr.id                                  as report_id,
       tr.status::text                        as trang_thai_bao_cao
  from public.lessons l
  join public.classes c                 on c.id = l.class_id
  left join public.teachers t           on t.id = l.teacher_id
  left join public.teaching_reports tr  on tr.lesson_id = l.id
  left join tru                         on tru.lesson_id = l.id
  left join mp                          on mp.lesson_id = l.id
  left join public.teacher_payable_lessons tpl on tpl.lesson_id = l.id
 where l.status = 'completed'
   and public.is_founder();

comment on view public.v_mat_xich_buoi_hoc is
  'Do do kin cua chuoi Buoi hoc -> Bao cao -> QC -> Xac minh -> Hoc phi -> Luong -> Phu huynh. '
  'Buoi mien phi CO ghi ly do duoc tinh la mat xich lien. CHI FOUNDER.';

revoke all on public.v_mat_xich_buoi_hoc from authenticated, anon;
grant select on public.v_mat_xich_buoi_hoc to authenticated;
