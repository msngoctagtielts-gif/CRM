-- 0056 — Chỗ ghi kết quả xác minh video, thay cho script chạy tay.
--
-- BỎ MỘT ĐƯỜNG SONG SONG DO CHÍNH TRỢ LÝ TẠO RA
--   Ngày 20/09/2026 trợ lý viết scripts/phan-tich-video/phan-tich.mjs để nhờ
--   Gemini đọc video. Lúc đó trợ lý KHÔNG BIẾT phần mềm đã có sẵn tích hợp
--   Gemini từ trước (src/lib/ai/provider.ts, nút "soạn nháp nhận xét bằng AI").
--
--   Hậu quả của hai đường song song:
--     · hai biến môi trường khác nhau (GEMINI_API_KEY và GOOGLE_AI_API_KEY)
--     · hai tên model khác nhau (gemini-2.5-flash và gemini-3.6-flash)
--     · Founder phải cấu hình hai nơi, và phải mở máy chạy lệnh mới xác minh
--       được một buổi
--   Từ nay chỉ còn MỘT đường: nút bấm ngay trên màn hình báo cáo, dùng đúng
--   khoá GOOGLE_AI_API_KEY đã có.
--
-- VÌ SAO GHI QUA HÀM CHỨ KHÔNG UPDATE THẲNG
--   Đây là chỗ máy ghi vào hồ sơ giảng dạy. Ba ràng buộc phải luôn đúng, và
--   phải đúng ngay cả khi sau này có ai gọi từ nơi khác:
--     1. KHÔNG ghi đè lên chữ giáo viên đã viết — chỉ điền vào ô còn trống
--     2. KHÔNG đụng vào duration_minutes; lương và học phí vẫn tính theo số
--        giáo viên khai, độ lệch để Founder NHÌN THẤY mà quyết
--     3. Ghi nhật ký, đánh dấu nguồn là máy đọc

create or replace function public.fn_ghi_xac_minh(
  p_lesson_id        uuid,
  p_phut_thuc_te     int,
  p_thoi_gian_hv_noi int,
  p_khong_khi_lop    text,
  p_gian_doan        jsonb,
  p_nguon            text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_report_id uuid;
  v_khai      int;
begin
  if not public.is_founder() then
    raise exception 'Chi Founder duoc ghi ket qua xac minh.' using errcode = '42501';
  end if;

  select tr.id, l.duration_minutes
    into v_report_id, v_khai
    from public.lessons l
    left join public.teaching_reports tr on tr.lesson_id = l.id
   where l.id = p_lesson_id;

  if v_khai is null then
    raise exception 'Khong tim thay buoi hoc.' using errcode = 'P0002';
  end if;
  if v_report_id is null then
    raise exception 'Buoi nay chua co bao cao nen chua co cho ghi ket qua. Tao bao cao truoc.'
      using errcode = 'P0002';
  end if;

  update public.teaching_reports
     set phut_thuc_te     = coalesce(p_phut_thuc_te, phut_thuc_te),
         thoi_gian_hv_noi = coalesce(p_thoi_gian_hv_noi, thoi_gian_hv_noi),
         -- coalesce theo HƯỚNG NGƯỢC LẠI: chữ đang có được giữ, máy chỉ điền
         -- vào ô trống. Giáo viên viết rồi thì máy không được xoá đi.
         khong_khi_lop    = coalesce(nullif(btrim(khong_khi_lop), ''), p_khong_khi_lop),
         gian_doan        = coalesce(gian_doan, p_gian_doan),
         nguon_xac_minh   = coalesce(p_nguon, 'gemini'),
         xac_minh_luc     = now(),
         updated_at       = now()
   where id = v_report_id;

  perform public.fn_ghi_nhat_ky(
    'teaching_reports', v_report_id, 'UPDATE',
    'May doc video ghi ket qua xac minh (nguon: ' || coalesce(p_nguon, 'gemini') || ')',
    null,
    jsonb_build_object('lesson_id', p_lesson_id,
                       'phut_khai', v_khai,
                       'phut_thuc_te', p_phut_thuc_te,
                       'thoi_gian_hv_noi', p_thoi_gian_hv_noi));

  return jsonb_build_object(
    'ok', true,
    'phut_khai', v_khai,
    'phut_thuc_te', p_phut_thuc_te,
    'lech_phut', case when p_phut_thuc_te is null then null else p_phut_thuc_te - v_khai end);
end;
$$;

revoke all on function public.fn_ghi_xac_minh(uuid, int, int, text, jsonb, text) from public, anon;
grant execute on function public.fn_ghi_xac_minh(uuid, int, int, text, jsonb, text) to authenticated;
