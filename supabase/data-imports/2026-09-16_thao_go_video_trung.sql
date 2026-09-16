-- Go link video trung giua buoi 42 (14/08, Ms. Phuong) va buoi 46 (28/08, GV Trang)
-- lop Thao - Ms. Phuong.
--
-- BOI CANH
--   Ca hai dong trong SHEET GOC cung tro toi https://youtu.be/iJuhOhJOcGI.
--   Ban trung nam san trong sheet, khong phai loi nhap lieu cua he thong.
--   Ca hai buoi deu day Speak Now 1 Unit 14 nen noi dung khong phan biet duoc
--   ai so huu video. YouTube bi chan o moi truong chay nen khong mo video
--   kiem tra ngay quay duoc.
--
-- QUYET DINH CUA FOUNDER (co Ngoc, 16/09/2026)
--   Go link video khoi buoi 42 tren sheet goc; video thuoc buoi 46.
--   Buoi 42 VAN TINH hoc phi va luong binh thuong, chi la khong con ban ghi
--   doi chung.
--
--   Ghi ro: day la QUYET DINH DIEU HANH, khong phai ket luan tu bang chung.
--   Chua ai mo video de xac minh ngay quay. Neu ve sau mo duoc va thay video
--   thuoc buoi 14/08 thi phai dao nguoc lai.
--
-- KHONG dong toi bang lessons hay teaching_reports: so buoi giu nguyen 46,
-- so bao cao giu nguyen 45. Chi xoa mot dong recordings.

delete from public.recordings r
using public.lessons l, public.classes c
where r.lesson_id = l.id
  and l.class_id = c.id
  and c.name like 'Thảo%'
  and l.lesson_date = date '2026-08-14';

update public.lessons l
set notes = coalesce(l.notes, '') ||
  ' [GIẢI QUYẾT 16/09/2026] Founder quyết định: gỡ link video khỏi buổi này trên sheet gốc, video https://youtu.be/iJuhOhJOcGI thuộc về buổi 28/08 (GV Trang). Buổi 14/08 VẪN TÍNH học phí và lương bình thường, chỉ là không còn bản ghi đối chứng. Đây là quyết định của Founder, KHÔNG phải kết luận từ bằng chứng — chưa ai mở video để xác minh ngày quay.'
from public.classes c
where c.id = l.class_id and c.name like 'Thảo%' and l.lesson_date = date '2026-08-14';

update public.lessons l
set notes = coalesce(l.notes, '') ||
  ' [GIẢI QUYẾT 16/09/2026] Founder quyết định video https://youtu.be/iJuhOhJOcGI thuộc buổi này; link đã được gỡ khỏi buổi 14/08 trên sheet gốc. Đây là quyết định của Founder, KHÔNG phải kết luận từ bằng chứng.'
from public.classes c
where c.id = l.class_id and c.name like 'Thảo%' and l.lesson_date = date '2026-08-28';

-- Ket qua sau khi chay (da kiem chung 16/09/2026):
--   Ms. Phuong            19 buoi / 18 bao cao / 16 video
--   Nguyen Thi Le Trang   27 buoi / 27 bao cao / 23 video
--   Tong                  46 buoi / 45 bao cao / 39 video  (truoc do 40 video)
