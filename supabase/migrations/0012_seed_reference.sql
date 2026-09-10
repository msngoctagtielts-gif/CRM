-- =============================================================================
-- 0012_seed_reference.sql
-- Reference data only (programmes, CEFR levels, sample tuition packages).
-- NO fake students / payments / teachers: this is a production system.
--
-- The programme list is a STARTING POINT based on CEFR and needs Founder
-- confirmation (see PROJECT_PLAN.md "Cần Founder trả lời", item 3).
-- =============================================================================

insert into public.programs (code, name_vi, name_en, target_audience, sort_order) values
  ('KIDS',    'Tiếng Anh Thiếu nhi',        'Young Learners English', 'Trẻ 5-11 tuổi', 1),
  ('TEENS',   'Tiếng Anh Thiếu niên',       'Teens English',          'Học sinh 12-17 tuổi', 2),
  ('ADULT',   'Tiếng Anh Giao tiếp Người lớn', 'Adult Communication', 'Người đi làm', 3),
  ('IELTS',   'Luyện thi IELTS',            'IELTS Preparation',      'Học sinh & người đi làm', 4),
  ('BUSINESS','Tiếng Anh Doanh nghiệp',     'Business English',       'Chuyên viên, quản lý', 5)
on conflict (code) do nothing;

insert into public.levels (code, name_vi, name_en, cefr_code, sort_order) values
  ('PRE_A1', 'Khởi đầu',     'Starter',      'Pre-A1', 1),
  ('A1',     'Sơ cấp',       'Beginner',     'A1',     2),
  ('A2',     'Cơ bản',       'Elementary',   'A2',     3),
  ('B1',     'Trung cấp',    'Intermediate', 'B1',     4),
  ('B2',     'Trung cao cấp','Upper-Int.',   'B2',     5),
  ('C1',     'Cao cấp',      'Advanced',     'C1',     6),
  ('C2',     'Thành thạo',   'Proficient',   'C2',     7)
on conflict (code) do nothing;

-- Sample packages. default_price_per_lesson is only a suggestion in the UI —
-- the contract price always comes from student_enrollments.price_per_lesson.
insert into public.tuition_packages
  (code, name, class_type, duration_minutes, lesson_count, default_price_per_lesson, description)
values
  ('1O1-60-12', 'Gói 12 buổi 1-1 (60 phút)', 'one_to_one', 60, 12, 250000,
   'Giá mặc định gợi ý — đơn giá thực tế theo từng hợp đồng học viên'),
  ('1O1-60-24', 'Gói 24 buổi 1-1 (60 phút)', 'one_to_one', 60, 24, 250000,
   'Giá mặc định gợi ý — đơn giá thực tế theo từng hợp đồng học viên'),
  ('1O2-60-12', 'Gói 12 buổi 1-2 (60 phút)', 'one_to_two', 60, 12, 190000,
   'Giá mặc định gợi ý — đơn giá thực tế theo từng hợp đồng học viên'),
  ('GRP-60-24', 'Gói 24 buổi nhóm nhỏ (60 phút)', 'small_group', 60, 24, 150000,
   'Giá mặc định gợi ý — đơn giá thực tế theo từng hợp đồng học viên')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Promote the first Founder account.
-- Run manually AFTER creating the account in Supabase Auth:
--
--   update public.users set role_code = 'founder'
--    where email = 'ms.ngocenliteenglish@gmail.com';
--
-- Left as a comment on purpose: a migration must not silently grant full
-- financial access to an address that may not exist yet.
-- -----------------------------------------------------------------------------
