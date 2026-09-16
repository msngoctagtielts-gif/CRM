-- ---------------------------------------------------------------------------
-- 0024 · fn_nhap_feedback — nạp feedback lịch sử từ Google Sheets của từng lớp
-- ---------------------------------------------------------------------------
-- Vì sao cần hàm này:
--   Trước tháng 9/2026, giáo viên ghi nội dung buổi học vào Google Sheets riêng
--   của mỗi lớp, không nhập vào hệ thống. Cô Ngọc yêu cầu "hoàn thiện các tháng
--   trước tháng 9". Nếu viết INSERT thủ công cho từng buổi thì mỗi lần gọi phải
--   gửi lại toàn bộ câu lệnh; gói thành một hàm thì mỗi lần chỉ gửi dữ liệu.
--
-- Nguyên tắc an toàn (xem DECISIONS.md D41):
--   • Ghép buổi theo NGÀY, không theo "số buổi" ghi trong sheet — số buổi trong
--     sheet đếm lại từ đầu mỗi khi đổi giáo trình nên không tin được.
--   • KHÔNG ghi đè: topic chỉ điền khi đang trống, báo cáo chỉ thêm khi buổi
--     chưa có báo cáo, video chỉ thêm khi URL đó chưa tồn tại. Chạy lại hàm
--     nhiều lần cho cùng một dữ liệu không sinh bản ghi trùng.
--   • KHÔNG nhập giờ bắt đầu/kết thúc. Lương các tháng trước tháng 9 đã chốt
--     ngoài hệ thống (D38); nhập giờ vào đây sẽ làm bảng lương tính lại và lệch
--     với số cô đã trả thật.
--   • security invoker (mặc định): người gọi chỉ ghi được những gì RLS của
--     chính họ cho phép. Không dùng security definer để tránh mở đường vòng.
--
-- Đầu vào p_du_lieu: mảng JSON, mỗi phần tử là một buổi học
--   { ngay, chu_de, noi_dung, diem_manh, cai_thien, bai_tap, ghi_chu,
--     muc_do, thai_do, nhan_goc, trang_thai, video: [url, ...] }
--   nhan_goc giữ nguyên chữ giáo viên viết ("Mức độ tiếp thu: Tốt · ..."),
--   còn muc_do/thai_do là mã chuẩn hoá theo VỊ TRÍ trên thang đánh giá.
-- ---------------------------------------------------------------------------

create or replace function public.fn_nhap_feedback(p_ten_lop text, p_du_lieu jsonb)
returns table(buoi_ghep_duoc bigint, bao_cao_moi bigint, danh_gia_moi bigint, video_moi bigint)
language plpgsql
as $function$
begin
  return query
  with d as (
    select * from jsonb_to_recordset(p_du_lieu)
      as t(ngay date, chu_de text, noi_dung text, diem_manh text, cai_thien text,
           bai_tap text, ghi_chu text, muc_do text, thai_do text, nhan_goc text,
           trang_thai text, video jsonb)
  ),
  b as (
    select d.*, l.id as lesson_id, l.class_id, l.teacher_id
      from d join classes c on c.name = p_ten_lop
             join lessons l on l.class_id = c.id and l.lesson_date = d.ngay
  ),
  sua_topic as (
    update lessons l set topic = b.chu_de from b
     where l.id = b.lesson_id and b.chu_de is not null
       and (l.topic is null or l.topic = '')
    returning 1
  ),
  them_bao_cao as (
    insert into teaching_reports
      (lesson_id, class_id, teacher_id, report_date, lesson_content,
       strengths, improvements, homework_summary, qc_notes, status, authored_by)
    select b.lesson_id, b.class_id, b.teacher_id, b.ngay, b.noi_dung,
           b.diem_manh, b.cai_thien, b.bai_tap, b.ghi_chu,
           b.trang_thai::report_status, 'teacher'
      from b
     where not exists (select 1 from teaching_reports t where t.lesson_id = b.lesson_id)
    returning id, lesson_id
  ),
  them_hoc_vien as (
    insert into teaching_report_students
      (report_id, student_id, performance, attitude, comments)
    select r.id, cs.student_id, b.muc_do, b.thai_do, b.nhan_goc
      from them_bao_cao r
      join b on b.lesson_id = r.lesson_id
      join class_students cs on cs.class_id = b.class_id and cs.status = 'active'
     where b.muc_do is not null or b.thai_do is not null or b.nhan_goc is not null
    returning 1
  ),
  them_video as (
    insert into recordings (lesson_id, class_id, url, provider, title, visible_to_parent)
    select b.lesson_id, b.class_id, v.url, 'sheet_feedback',
           case when jsonb_array_length(b.video) > 1 then 'Phần ' || v.i::text end, true
      from b cross join lateral (
        select value #>> '{}' as url, ordinality as i
          from jsonb_array_elements(b.video) with ordinality
      ) v
     where not exists (select 1 from recordings x
                        where x.lesson_id = b.lesson_id and x.url = v.url)
    returning 1
  )
  select (select count(*) from b),
         (select count(*) from them_bao_cao),
         (select count(*) from them_hoc_vien),
         (select count(*) from them_video);
end;
$function$;

revoke all on function public.fn_nhap_feedback(text, jsonb) from public;
grant execute on function public.fn_nhap_feedback(text, jsonb) to authenticated, service_role;
