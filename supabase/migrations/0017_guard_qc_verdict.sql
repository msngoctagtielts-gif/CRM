-- =============================================================================
-- 0017_guard_qc_verdict.sql
--
-- Chặn giáo viên tự chấm "đủ sâu" cho chính báo cáo của mình.
--
-- Vì sao cần: hai cột qc_strengths_deep và qc_improvements_deep KHÔNG phải dữ
-- liệu giáo viên nhập — chúng là KẾT LUẬN CHẤM của Founder hoặc AI (D3). Chính
-- sách RLS reports_teacher_update cho phép giáo viên sửa mọi cột của báo cáo
-- chưa duyệt, nên nếu chỉ giấu hai ô này trên giao diện thì giáo viên vẫn có
-- thể gọi thẳng PostgREST để tự bật, tự nâng điểm QC lên 100 và làm tắt cảnh
-- báo chất lượng gửi Founder.
--
-- Không dùng quyền theo cột (column privileges) vì giáo viên vẫn cần UPDATE cả
-- dòng khi lưu báo cáo; một trigger BEFORE giữ nguyên giá trị cũ là cách gọn
-- nhất mà không làm hỏng luồng lưu.
-- =============================================================================

create or replace function public.tg_guard_qc_verdict()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- auth.uid() rỗng = tiến trình máy chủ (migration, service_role, cron) — các
  -- lối vào này đã nằm sau kiểm tra quyền ở tầng ứng dụng.
  if auth.uid() is null or public.is_founder() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.qc_strengths_deep    := null;
    new.qc_improvements_deep := null;
    new.qc_notes             := null;
  else
    new.qc_strengths_deep    := old.qc_strengths_deep;
    new.qc_improvements_deep := old.qc_improvements_deep;
    new.qc_notes             := old.qc_notes;
  end if;

  return new;
end;
$$;

comment on function public.tg_guard_qc_verdict() is
  'Giữ nguyên kết luận chấm chất lượng khi người ghi không phải Founder. Bốn tiêu chí còn lại máy tự kiểm từ dữ liệu nên không cần chặn.';

-- BEFORE, nên chạy trước trg_report_refresh (AFTER) — điểm QC luôn được tính
-- trên giá trị đã lọc, không bao giờ trên giá trị giáo viên tự bật.
drop trigger if exists trg_guard_qc_verdict on public.teaching_reports;
create trigger trg_guard_qc_verdict
  before insert or update on public.teaching_reports
  for each row execute function public.tg_guard_qc_verdict();

-- Hàm trigger không được gọi trực tiếp từ API.
revoke execute on function public.tg_guard_qc_verdict() from public;
revoke execute on function public.tg_guard_qc_verdict() from anon;
revoke execute on function public.tg_guard_qc_verdict() from authenticated;
