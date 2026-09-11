# TODO.md — việc tiếp theo, theo thứ tự ưu tiên

**Cập nhật:** 10/09/2026

---

## P0 — Chặn việc đưa vào sử dụng thật

Phải xong trước khi bất kỳ ai nhập dữ liệu thật vào hệ thống.

- [x] ~~Quyết định về Supabase project~~ → đã dùng project mới `zyzxqthlgrunkxohvhku`
      (Singapore). Project cũ ở Sydney không bị chạm tới.
- [x] ~~Áp migration~~ → 16/16 đã áp, đối chiếu schema khớp tuyệt đối
- [x] ~~Kiểm tra Advisors~~ → đã vá lỗ hổng quyền gọi hàm (0015, 0016)
- [x] ~~**NÂNG LÊN GÓI PRO**~~ → Founder chưa có ngân sách. Đã làm phương án miễn phí
      thay thế, xem `docs/FREE_TIER.md`:
      - `.github/workflows/keepalive.yml` — truy vấn mỗi ngày để project không bị
        tạm dừng
      - `.github/workflows/backup.yml` — dump + mã hoá AES-256 mỗi đêm, giữ 90 ngày
      - `scripts/backup/{dump,restore}.sh` — **đã kiểm thật**: dump rồi phục hồi
        sang CSDL trắng, mọi số liệu khớp tuyệt đối
      - ⚠ Rủi ro còn lại không bù được: **cửa sổ mất dữ liệu tối đa 24 giờ**
- [ ] ⛔ **Đặt 4 secret trên GitHub** để hai workflow trên chạy được:
      `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL` (chuỗi **Session
      pooler**, không phải kết nối trực tiếp), `BACKUP_PASSPHRASE`.
      Hướng dẫn: `docs/FREE_TIER.md` mục 6
- [x] ~~**Tạo tài khoản Founder**~~ → đã tạo `ms.ngocenliteenglish@gmail.com`, email đã
      xác nhận, `role_code = 'founder'`. **Mật khẩu hiện tại là tạm — đổi ngay lần đăng
      nhập đầu tiên.**
- [x] ~~**Nhập 21 lớp**~~ → đã nhập: 6 giáo viên, 20 học viên, 20 lớp, 36 dòng lịch học,
      20 hợp đồng, 21 mốc đơn giá. Script: `scripts/migration/import_danh_sach_lop.sql`,
      kiểm trên cụm tạm trước khi áp, số liệu khớp tuyệt đối
- [ ] ⛔ **Đối soát 14 dòng ở trang `/review`** TRƯỚC khi sinh buổi học. Tôi cố ý CHƯA
      sinh buổi nào: 4 lớp có giờ kết thúc do tôi tạm ghi 60 phút và 1 lớp không rõ
      sáng/chiều — sinh buổi trên giờ sai sẽ tạo bản ghi lương sai
- [ ] ⛔ **Điền lịch cho 5 lớp**: LINH-PH, KIEN-SH, VY-SH, NHI-PH, THIENAI-KO (ô lịch
      trong sheet trống, tôi không bịa)
- [x] ~~Chọn nơi chạy app~~ → **Netlify Free**, đã cấu hình `netlify.toml`.
      KHÔNG dùng Vercel Hobby: điều khoản cấm dùng thương mại và họ có quyền tắt
      project không báo trước. KHÔNG dùng Cloudflare Workers free: giới hạn 10ms
      CPU mỗi request, không đủ render Next.js. Xem `docs/DEPLOY.md`
- [x] ~~Tạo project Netlify và đặt biến môi trường~~ → project `mnee-management` đã tạo
      qua Netlify MCP, đã đặt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `NEXT_PUBLIC_TIMEZONE`, `CRON_SECRET`; đã tắt bắt buộc đăng nhập SSO Netlify
- [ ] ⛔ **Nối repo GitHub trong Netlify** (3 cú bấm) — Netlify MCP không có operation
      nối repo, và sandbox phát triển chặn host Netlify nên tôi không tải mã lên được.
      Hướng dẫn: `docs/DEPLOY.md` mục 3
- [ ] ⛔ **Đặt `SUPABASE_SERVICE_ROLE_KEY`** trên Netlify — tôi không lấy được khoá này,
      Supabase MCP chỉ cấp khoá công khai. Thiếu thì chỉ nút "Quét lại ngay" và route
      cron không chạy
- [ ] ⛔ **Đặt `GOOGLE_AI_API_KEY` mới** trên Netlify — cố ý không đặt khoá cũ vì đã lộ
- [ ] ⛔ **Đặt Site URL trong Supabase** sau khi có địa chỉ Netlify, nếu không link
      xác nhận email và đặt lại mật khẩu sẽ trỏ về localhost
- [ ] **Kiểm thử end-to-end trên Supabase thật** — toàn bộ mục 5 "Chưa kiểm thử"
      trong `IMPLEMENTATION_STATUS.md`: đăng nhập, tạo học viên, tạo lớp, sinh buổi,
      nộp báo cáo, ghi nhận thanh toán, xem dashboard
- [ ] **Bật Leaked Password Protection** trong Supabase → Authentication. Advisor báo
      WARN mới sau khi có tài khoản thật: Supabase đối chiếu mật khẩu với
      HaveIBeenPwned để chặn mật khẩu đã bị lộ. Đáng bật vì sắp tới giáo viên tự đặt
      mật khẩu. Không đổi được qua MCP nên cô bấm trong Studio
- [ ] Xem xét chuyển extension `citext` ra khỏi schema `public` (Advisor báo WARN).
      Tôi chưa làm vì việc này có thể làm hỏng các cột dùng kiểu citext trên một
      CSDL đang chạy — cần kiểm thử riêng trước.
- [ ] **Lên lịch quét cảnh báo mỗi giờ** — pg_cron hoặc n8n gọi
      `POST /api/cron/scan-reports`. *Không có bước này thì cảnh báo 10 giờ
      không bao giờ tự phát sinh.*
- [ ] **Xác nhận giả định A1–A13** còn lại trong `PROJECT_PLAN.md` mục 6
      (A1–A12 về tiền tệ, múi giờ, lớp nhóm; A13 về việc gửi phụ huynh có cần người duyệt)
- [ ] **Điền dữ liệu còn thiếu** của 21 lớp — danh sách ở cuối `DECISIONS.md`:
      6 lớp chưa có lịch học, 3 lớp thiếu giờ kết thúc, 1 lớp không rõ sáng/chiều,
      hình thức đóng của Bảo Ngọc, tình trạng của Công Duy, ai đứng tên đóng lớp Y Khoa
- [ ] **Bật sao lưu** (gói Pro tự sao lưu hằng ngày; gói Free cần `supabase db dump` định kỳ)

## P1 — Đồng bộ giao diện với mô hình nghiệp vụ mới

*CSDL đã xong và đã kiểm thử; đây là phần giao diện còn thiếu. Xem `DECISIONS.md`.*

- [x] **Form báo cáo giảng dạy theo 6 tiêu chí** (D3) — đã thêm ô trích nguyên văn lời
      học viên, timestamp đối chiếu, điểm mạnh, phần cần cải thiện, mẫu câu cho
      homework; điểm QC hiện ngay khi gõ, kèm danh sách tiêu chí còn thiếu
- [x] **Bỏ mọi con số hạn nộp viết cứng** (D2) — đọc từ bảng `settings` qua
      `src/lib/settings.ts`, đổi trong CSDL là mọi màn hình đổi theo
- [x] **Nút "Đánh dấu đã gửi phụ huynh"** và **nút duyệt báo cáo** cho Founder (A13)
- [x] **Ô chọn hình thức đóng** trong form hợp đồng (D1): gói trả trước / cuối tháng — form
      hỏi khác nhau theo từng hình thức, không ép mọi hợp đồng thành gói trả trước
- [x] **Nhập nhiều mốc đơn giá** theo ngày hiệu lực (D11) — form "Đổi đơn giá học phí"
      đóng mốc cũ và mở mốc mới, có kiểm thử chống chồng khoảng / khoảng trống
- [x] **Ô người đại diện đóng** cho lớp nhóm (D13, D14) — chọn học viên khác, người ngoài
      đã có hồ sơ, hoặc tạo hồ sơ người đóng mới ngay trong form
- [x] **Trang phiếu học phí tháng** (D1): lập phiếu → chốt → ghi nhận thu, có kiểm thử
      vòng đời đầy đủ tới đúng con số 2.370.000 ₫ của chứng từ thật
- [x] **Trang "Cần đối soát"** đọc từ `v_data_review` (D8) — có nút đánh dấu đã đối soát
- [x] **Cảnh báo học vượt / sắp hết buổi** trên dashboard (D7) — ngưỡng đọc từ `settings`
- [x] Gọi thêm `fn_alert_missing_lesson_time`, `fn_alert_lesson_balance`,
      `fn_alert_not_sent_to_parent` trong `/api/cron/scan-reports`
- [x] **Trang bảng lương** (D4, D5) — `/payroll`: tính theo tháng, điều chỉnh, duyệt rồi
      mới trả; giáo viên chỉ thấy lương của chính mình (có kiểm thử RLS)
- [x] **Nối AI viết feedback** (D6) — dùng **Google Gemini gói miễn phí**; nút "AI viết
      nháp" trong form báo cáo; giữ bước người bấm gửi phụ huynh (giả định A13).
      Chặn bịa trích dẫn ở hai lớp, có 11 kiểm thử đơn vị (`npm run test:unit`)
- [x] **Chạy thử AI với khoá thật** (10/09/2026) — phát hiện và vá 2 lỗi chỉ lộ ra
      khi gọi thật: `gemini-2.0-flash` đã bị Google khai tử, và thinking token của
      Gemini 3.x ăn hết hạn mức output làm JSON đứt ngang
- [ ] ⛔ **Đổi khoá Google AI Studio** — khoá hiện tại đã bị dán vào khung chat nên
      coi như lộ. Vào https://aistudio.google.com/apikey xoá khoá cũ, tạo khoá mới,
      và từ nay chỉ đặt thẳng vào biến môi trường

## P1c — Nhịp vận hành theo tháng (Founder yêu cầu 11/09/2026)

Chốt sổ ngày cuối tháng · trả lương từ mùng 1 đến mùng 3 · nhắc và thu học phí ·
xem tình hình trung tâm.

- [x] **Trang `/month-end` "Chốt tháng"** — gom bốn việc vào một màn hình, xếp
      đúng thứ tự phải làm
- [x] **Tính lương cả tháng cho tất cả giáo viên bằng một nút** — trước đó phải
      bấm từng người, sáu lần, dễ sót một người và người đó bị trả chậm
- [x] **Danh sách cần nhắc học phí** gộp cả hai hình thức đóng: gói trả trước sắp
      hết buổi, và hợp đồng cuối tháng chưa lập phiếu hoặc chưa thu đủ
- [ ] **Nhắc tự động vào mùng 1** — hiện phải tự nhớ mở trang. Có thể thêm vào
      `keepalive.yml` một job chạy ngày 1 hằng tháng gửi nhắc
- [ ] **Soạn sẵn tin nhắn nhắc học phí** để Founder copy gửi Zalo, thay vì tự gõ
      lại từng người

## P1b — Hoàn thiện Giai đoạn 1

- [ ] Trang **sửa hồ sơ học viên** (`/students/[id]/edit`) — server action `updateStudent` đã có, thiếu giao diện
- [ ] **Liên kết tài khoản giáo viên** từ giao diện (gán `teachers.user_id`), thay cho việc chạy SQL tay
- [ ] Trang **sửa / huỷ lớp học**, đánh dấu học viên rời lớp
- [ ] **Huỷ và dời buổi học** từ giao diện (CSDL đã hỗ trợ `cancelled`, `rescheduled`, `is_makeup`)
- [ ] **Sửa / hoàn tiền thanh toán** (CSDL đã có `refunded`, `cancelled`)
- [ ] Phân trang cho danh sách học viên và buổi học (hiện giới hạn 300/400 dòng)
- [ ] Kiểm tra hiển thị thật trên điện thoại và iPad, chụp màn hình đối chiếu
- [ ] Rà soát khả năng tiếp cận: thứ tự tiêu đề, nhãn cho trình đọc màn hình, tương phản màu

## P2 — Giai đoạn 2 (Lương & báo cáo tài chính)

*Logic CSDL đã xong và đã kiểm thử. Chỉ còn giao diện.*

- [ ] Trang **bảng lương giáo viên**: chọn kỳ → `fn_build_payroll()` → xem buổi đã dạy → duyệt → đánh dấu đã trả
- [ ] Thêm **điều chỉnh lương** (thưởng/trừ) từ giao diện
- [ ] Trang **lương của tôi** cho giáo viên (RLS đã cho đọc dòng của chính mình)
- [ ] **Tự sinh chi phí** `teacher_salary` khi kỳ lương chuyển `paid`, gắn `payroll_id` để không đếm hai lần
- [ ] Trang **quản lý hợp đồng học phí** đầy đủ: sửa, tạm dừng, gia hạn, hết hạn
- [ ] **Báo cáo tài chính**: P&L theo tháng, dòng tiền, đối chiếu doanh thu ghi nhận ↔ tiền mặt
- [ ] Cảnh báo **học viên gần hết buổi** (còn ≤ 2 buổi)
- [ ] Cảnh báo **hợp đồng chưa thanh toán** quá X ngày

## P3 — Giai đoạn 3 (Lead CRM)

- [ ] Bảng pipeline lead dạng kéo-thả theo 8 trạng thái
- [ ] Biểu mẫu lead + nhật ký liên hệ
- [ ] Nhập kết quả kiểm tra đầu vào, tự gợi ý cấp độ CEFR
- [ ] Lên lịch và ghi nhận kết quả học thử
- [ ] **Chuyển lead → học viên** một bước (tạo `students` + `student_parents` + `student_enrollments`)
- [ ] Báo cáo tỷ lệ chuyển đổi theo nguồn

## P4 — Giai đoạn 4 (Tự động hoá & di trú)

- [ ] Nhắc giáo viên nộp báo cáo qua Zalo/Telegram trước khi hết hạn 10 giờ
- [ ] Nhắc phụ huynh đóng học phí
- [ ] Gửi báo cáo tuần cho Founder
- [ ] **Script di trú Google Sheets** — cần một bản xuất mẫu từ Founder trước
- [ ] Đối chiếu sau di trú: số buổi còn lại và công nợ phải khớp bản tính tay

## P5 — Giai đoạn 5 (Cổng phụ huynh)

- [ ] Đăng nhập cho phụ huynh (cấp quyền `parent` trong RLS)
- [ ] Trang tiến độ học tập của con
- [ ] Xem recording (tôn trọng `recordings.visible_to_parent`)
- [ ] Báo cáo tiến bộ định kỳ
- [ ] Phân tích bằng AI trên dữ liệu báo cáo giảng dạy

---

## Nợ kỹ thuật đã biết

| # | Vấn đề | Ảnh hưởng | Ghi chú |
|---|---|---|---|
| 1 | `scripts/gen-types.py` là giải pháp tạm thay cho `supabase gen types` | Thấp | Khi có Docker thì dùng `npm run db:types`; cả hai cho kết quả tương đương |
| 2 | Múi giờ UTC+7 được gắn cố định trong `src/lib/time.ts` và `src/lib/period.ts` | Thấp | Đúng với Việt Nam (không có giờ mùa hè). Phải thay bằng thư viện múi giờ nếu mở rộng ra nước khác |
| 3 | Chưa có kiểm thử tự động cho tầng ứng dụng | Trung bình | Logic nghiệp vụ đã được phủ ở tầng SQL; nên thêm Playwright cho luồng báo cáo giảng dạy |
| 4 | Dashboard tính tổng trong JavaScript, không phải SQL | Thấp | Phù hợp quy mô trung tâm nhỏ. Khi dữ liệu lớn, chuyển sang view tổng hợp |
| 5 | Chưa có quốc tế hoá thật, chỉ có từ điển nhãn `src/lib/labels.ts` | Thấp | Mọi chuỗi hiển thị đã tập trung một chỗ, thêm tiếng Anh là thêm một từ điển song song |
| 6 | Không có giới hạn tần suất cho `/api/cron/*` | Thấp | Đã bảo vệ bằng secret; thêm rate limit nếu endpoint bị dò |
| 7 | `npm audit` còn báo lỗ hổng `postcss` (transitive trong Next) | Thấp | Chưa có bản vá từ thượng nguồn. Chỉ ảnh hưởng lúc build trên CSS của chính dự án, không xử lý dữ liệu người dùng. Theo dõi bản Next mới |

---

## Ghi chú bảo mật phụ thuộc

`next` đã được nâng lên **15.5.25** để vá **CVE-2025-66478** (bản 15.1.3 ban đầu
có lỗ hổng). Chạy `npm audit --omit=dev` định kỳ và nâng `next` khi có bản vá cho
cảnh báo `postcss` còn lại.
