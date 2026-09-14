# DECISIONS.md — Quyết định nghiệp vụ đã được Founder xác nhận

Mỗi dòng dưới đây là một quy tắc **đã được Founder chốt**, không phải giả định.
Khi code và tài liệu khác xung đột với file này, file này đúng.

Giả định chưa xác nhận vẫn nằm ở `PROJECT_PLAN.md` mục 6.

---

## 10/09/2026 — Vòng 1: mô hình nghiệp vụ

| # | Quyết định | Ảnh hưởng |
|---|---|---|
| D1 | **Giữ cả hai hình thức đóng học phí**: "Cuối tháng" (trả sau, đối soát cuối tháng) và "Gói 10 buổi" (trả trước) | `student_enrollments.billing_mode`; thêm bảng `tuition_statements` cho kỳ đối soát tháng |
| D2 | **Hạn nộp báo cáo 24 giờ** (không phải 10 giờ như bản mô tả ban đầu), đúng tham số `GIO_TRE_BAO_CAO` đang dùng | `settings.report_deadline_hours = 24` |
| D3 | **Báo cáo "đủ" chấm theo 6 tiêu chí + điểm QC 0–100, ngưỡng đạt 60**: có video · có timestamp đối chiếu · có trích nguyên văn lời học viên · điểm mạnh đủ sâu · phần cần cải thiện đủ sâu · homework có mẫu câu | Thêm các cột QC vào `teaching_reports`; `qc_score` tính tự động |
| D4 | **Lương vẫn tính dù báo cáo thiếu video/bài tập/nhận xét** — chỉ gắn cờ để Founder thấy | `fn_generate_payable_lesson` bỏ điều kiện báo cáo đủ |
| D5 | **Điều kiện CỨNG để tính lương: giáo viên phải ghi ngày + giờ dạy + tên.** Thiếu thì báo động đỏ ghi thẳng cho giáo viên kèm cảnh báo "không cung cấp thì không tính lương" | Chỉ cần `start_time`/`end_time`; thiếu thì không sinh buổi tính lương và tạo cảnh báo gửi riêng giáo viên đó |
| D6 | **Khi giáo viên đưa link video/record, AI tự viết và điền vào feedback** | Thêm `authored_by` để biết nội dung do giáo viên hay AI viết |
| D7 | **Cho học vượt số tiền đã đóng.** Số buổi còn lại được phép âm, hệ thống tự ghi công nợ và cảnh báo KHẨN | `fn_pick_enrollment` bỏ điều kiện `remaining > 0` |
| D8 | **Nhập dữ liệu cũ nguyên trạng, đánh dấu dòng nghi vấn** để Founder sửa trong hệ thống mới. Không tự đoán số tiền | Thêm `needs_review` + `review_note`; view `v_data_review` |
| D9 | **Tạo Supabase project mới**, không dùng project cũ `yevsupsuelpbodwawfyw`. Dùng gói Free để làm tiếp, **nâng Pro trước khi nhập dữ liệu thật** (gói Free tự tạm dừng khi không dùng và không sao lưu hằng ngày) | ✅ Đã có project `zyzxqthlgrunkxohvhku` (Singapore), 16 migration đã áp |

## 10/09/2026 — Vòng 2: đối soát dữ liệu sheet "CRM ( 10/9)"

| # | Quyết định | Chi tiết |
|---|---|---|
| D10 | **Thảo: 250.000 ₫/buổi** (không phải 249.000 trong danh sách lớp) | Theo bảng giá, căn cứ "Founder chốt 13/08/2026", chứng từ 3 lần × 2.500.000 = 30 buổi |
| D11 | **Bé Ngân: 179.000 ₫ đến 31/08/2026, rồi 190.000 ₫ từ 01/09/2026** | Sửa ô lỗi 1.790.009.190 ₫. Chứng từ: 716.000 = 4 buổi, 1.432.000 = 8 buổi. ⇒ **đơn giá học phí phải có ngày hiệu lực**, không phải một số cố định |
| D12 | **THIENAI-KO (Thiên Ái – Mr. Kobe): tạm ngưng** | Dòng 11 và 21 trùng mã lớp và trùng sheet feedback ⇒ nhập thành một lớp, trạng thái tạm ngưng |
| D13 | **Y Khoa là lớp nhóm 3 người: tách thành 3 học viên riêng** (Ms. Min, Mr. Max, Mr. John) để điểm danh và nhận xét từng người, nhưng **học phí gắn vào một hợp đồng do một người đại diện đóng** | 360.000 ₫/buổi cho cả nhóm − 150.000 ₫/tháng |
| D14 | **Người đóng học phí lớp Y Khoa là Hoàng Uyên — vợ anh Max**, và chị không phải học viên của lớp | Thêm `payer_parent_id` vào hợp đồng (migration 0014). Ràng buộc chỉ cho phép một người đứng tên đóng |

## 10/09/2026 — Đã dựng cơ sở dữ liệu thật

**Supabase project:** `zyzxqthlgrunkxohvhku` · vùng **ap-southeast-1 (Singapore)** ·
PostgreSQL 17.6 · gói Free (0 ₫/tháng)

- 17 migration đã áp, đối chiếu **khớp tuyệt đối** với bản kiểm thử cục bộ trên cả
  12 chỉ số, gồm 4 mã băm MD5 phủ cột+kiểu, tên hàm, tên policy và giá trị enum
- 35 bảng · 10 view · 69 policy RLS · 18 enum · 100 trigger
- Tham số vận hành đã đúng: hạn báo cáo **24 giờ**, ngưỡng QC **60**, KPI **20 buổi/tháng**

> ⚠ Vẫn là gói Free: **tự tạm dừng khi không dùng một thời gian và không có sao lưu
> hằng ngày**. Phải nâng lên Pro **trước khi** nhập dữ liệu học viên thật.

## 10/09/2026 — Sự cố bảo mật đã phát hiện và vá

Supabase Security Advisor báo sau khi áp migration: PostgreSQL mặc định cấp
`EXECUTE` cho `PUBLIC` trên mọi hàm mới. Các migration trước có cấp quyền cho
`authenticated` nhưng **không thu hồi quyền mặc định**, nên vai trò `anon` —
người **chưa đăng nhập**, dùng khoá công khai vốn nằm sẵn trong trình duyệt — gọi
được cả **39 hàm SECURITY DEFINER** qua `/rest/v1/rpc/...`

Hậu quả nếu không vá:

| Hàm | Ai cũng gọi được để làm gì |
|---|---|
| `fn_resolve_teacher_rate` | Đọc **đơn giá lương** của giáo viên |
| `fn_resolve_tuition_rate` | Đọc **đơn giá học phí** của học viên |
| `fn_enrollment_payer_name` | Đọc **tên người đóng tiền** |
| `fn_consume_lesson` | **Buộc ghi nhận doanh thu** cho một buổi học |
| `fn_generate_payable_lesson`, `fn_recalc_payroll` | Can thiệp **bảng lương** |
| `fn_refresh_report_status`, `fn_score_report_qc` | Đổi **trạng thái báo cáo** |

**Đã vá (migration 0015 và 0016):**

1. Thu hồi sạch `EXECUTE` khỏi `PUBLIC`, `anon`, `authenticated`; đặt lại
   default privileges để hàm tạo về sau không tự động mở ra nữa
2. Cấp lại đúng 17 hàm cần thiết cho `authenticated` (hàm dùng trong RLS và view)
3. Hàm quét và sinh cảnh báo: **chỉ service role**. Nút "Quét lại ngay" của
   Founder đi qua server action đã kiểm quyền rồi dùng service role
4. Hai hàm học phí chuyển sang **SECURITY INVOKER** — giáo viên gọi thẳng vẫn
   nhận `NULL` vì phải chịu RLS
5. Cố định `search_path` cho 11 hàm còn thiếu

Advisor sau khi vá: **không còn cảnh báo nào cho `anon`**. 11 hàm còn lại chỉ
trả về thông tin về chính người gọi, hoặc tự kiểm `is_founder()` bên trong.

Bộ kiểm thử có thêm mục 12 chứng minh: `anon` bị chặn cả 7 hàm thử gọi, giáo viên
bị chặn 3 hàm và nhận `NULL` từ 2 hàm học phí, nhưng RLS và trigger vẫn chạy đúng.

## 10/09/2026 — Chặn giáo viên tự chấm chất lượng (migration 0017)

Phát hiện khi làm form báo cáo mới: policy `reports_teacher_update` cho giáo viên
sửa **mọi cột** của báo cáo chưa duyệt. Trong đó có `qc_strengths_deep` và
`qc_improvements_deep` — hai tiêu chí lẽ ra do Founder hoặc AI chấm (D3). Giấu ô
trên giao diện là chưa đủ: giáo viên vẫn gọi thẳng PostgREST được để tự bật cả hai,
đưa điểm QC từ 67 lên 100 và làm **tắt cảnh báo chất lượng gửi Founder**.

Đã vá bằng trigger `trg_guard_qc_verdict`: khi người ghi không phải Founder, ba cột
`qc_strengths_deep`, `qc_improvements_deep`, `qc_notes` giữ nguyên giá trị cũ; mọi
nội dung khác của báo cáo vẫn lưu bình thường. Bộ kiểm thử có thêm mục 13 chứng
minh cả hai chiều: giáo viên bật không ăn thua, Founder bật thì có hiệu lực.

## 10/09/2026 — Chọn Google Gemini cho phần AI viết nhận xét (D6)

Founder yêu cầu: dùng Google AI Studio hoặc bất kỳ cách nào, **miễn là miễn phí**.

Đã chọn **Google Gemini** (`gemini-2.0-flash`) vì Google AI Studio cấp khoá API
miễn phí **không cần thẻ**, và hạn mức miễn phí (khoảng 15 lượt/phút, 1.500
lượt/ngày) xa hơn nhiều so với vài chục buổi mỗi tuần của trung tâm. Phần chạm
mạng gói riêng trong `src/lib/ai/provider.ts` nên đổi nhà cung cấp về sau chỉ sửa
một file.

**Không dùng** các cổng "gọi AI không cần khoá" đang lưu hành: chúng vi phạm điều
khoản của nhà cung cấp, có thể tắt bất cứ lúc nào, và đẩy dữ liệu học viên qua
một bên thứ ba không rõ danh tính.

### Giới hạn phải biết trước: AI không xem được recording trên Google Drive

Gemini đọc trực tiếp được video YouTube, nhưng **không mở được link Google Drive**
vì đó là file riêng tư cần đăng nhập. Trung tâm đang lưu recording trên Drive, nên
phần lớn buổi học rơi vào trường hợp này.

Khi không có nguồn nghe được, hệ thống **để trống trích nguyên văn lời học viên và
timestamp** thay vì để AI điền cho đủ điểm. Trích nguyên văn là một trong 6 tiêu
chí chấm chất lượng nên có áp lực bịa; một câu tiếng Anh bịa ra rồi gửi phụ huynh
như thể con họ đã nói là hỏng lòng tin. Chặn ở hai lớp: prompt cấm bịa, và máy chủ
xoá trích dẫn/timestamp nếu model vẫn cố điền (`enforceNoFabrication`). Lớp thứ
hai mới là lớp bảo đảm — dặn một mô hình ngôn ngữ không phải là bảo đảm.

Cách để có đủ 6 tiêu chí: giáo viên dán bản ghi lời thoại vào form.

### Dữ liệu gửi ra ngoài

Chỉ gửi tên gọi (không gửi họ tên đầy đủ), tuổi, tên lớp, ngày học, nội dung buổi
học, ghi chú giáo viên và transcript nếu có. Không gửi số điện thoại, thông tin
phụ huynh, hay bất kỳ số liệu học phí/lương/doanh thu nào. Chi tiết và cách tắt
hẳn: `docs/AI_SETUP.md`.

### Đã gọi thử thật (10/09/2026)

Founder cấp khoá, đã chạy thử cả hai trường hợp và **đều đúng**: recording trên
Drive thì để trống trích dẫn; có bản ghi lời thoại thì trích đúng câu thật học
viên nói, kể cả câu sai ngữ pháp.

Hai lỗi chỉ lộ ra khi gọi thật, đã vá:

1. `gemini-2.0-flash` **đã bị Google khai tử** (404). Đổi mặc định sang
   `gemini-3.6-flash`. Không dùng bí danh `gemini-flash-latest` vì lúc kiểm nó
   trả 503 quá tải và bí danh có thể đổi model bên dưới mà mình không biết.
2. **Thinking token tính vào `maxOutputTokens`.** Gemini 3.x suy nghĩ trước khi
   trả lời; đo thật 620 token prompt sinh ~1.550 token suy nghĩ để viết ~330
   token nội dung. Hạn mức 2.048 là sát mép, có lần JSON đứt ngang và giáo viên
   mất cả bản nháp. Nâng lên 8.192, báo lỗi riêng khi bị cắt, thử lại một lần
   khi quá tải.

### ⚠ Khoá hiện tại coi như đã lộ

Khoá được dán vào khung chat nên đã nằm trong lịch sử hội thoại. Cần vào
<https://aistudio.google.com/apikey> **xoá khoá cũ và tạo khoá mới**, rồi chỉ đặt
thẳng vào biến môi trường. Khoá chưa bao giờ được ghi vào Git.

## 10/09/2026 — Chạy thật trên gói Free thay vì nâng Pro

Founder chưa có ngân sách nâng Pro (~25 USD/tháng). Trước đó tôi đã khuyến nghị
phải nâng Pro trước khi nhập dữ liệu thật; khuyến nghị đó vẫn đúng về mặt kỹ
thuật, nhưng **không nâng vẫn chạy thật được** nếu bù hai thứ mà Pro cho sẵn.

| Thiếu gì ở gói Free | Bù bằng gì, miễn phí |
|---|---|
| Project tạm dừng sau 7 ngày ít hoạt động | `.github/workflows/keepalive.yml` — một truy vấn mỗi ngày |
| Không có sao lưu hằng ngày, không tải được bản sao lưu | `.github/workflows/backup.yml` — `pg_dump` + mã hoá AES-256 mỗi đêm, giữ 90 ngày |

Dung lượng 500 MB không phải vấn đề: toàn bộ dữ liệu kiểm thử nén lại chỉ 72 KB.

### Đã kiểm thật quy trình phục hồi

Một bản sao lưu không phục hồi được thì không phải bản sao lưu. Đã dump từ CSDL
có đủ 35 bảng và dữ liệu, phục hồi sang CSDL trắng khác, đối chiếu: **mọi số liệu
khớp tuyệt đối** (kể cả tổng doanh thu 4.598.000 ₫), đủ 35 bảng, 10 view, 69
policy RLS, 106 khoá ngoại. Mật khẩu sai thì không giải mã được.

Hai lỗi phát hiện khi kiểm và đã vá:

1. `pg_dump --schema=public` **không ghi câu `CREATE EXTENSION`** — thiếu `citext`
   ở đích là bảng không tạo được, lần thử đầu hỏng 142 câu lệnh. Nay danh sách
   extension được đọc từ CSDL và lưu kèm.
2. **Thứ tự nạp sai.** `public.users` có khoá ngoại tới `auth.users`, phải nạp tài
   khoản đăng nhập trước. Nạp ngược thì bảng phục hồi xong nhưng **mất khoá
   ngoại** — lỗi âm thầm, nhiều tháng sau mới lộ.

Ngoài ra: kết nối trực tiếp `db.<ref>.supabase.co` **chỉ có IPv6**, mà máy chạy
GitHub Actions chỉ có IPv4 — bắt buộc dùng chuỗi Session pooler.

### ⚠ Rủi ro chấp nhận một cách có ý thức

**Cửa sổ mất dữ liệu tối đa 24 giờ.** Sao lưu chạy mỗi đêm; CSDL hỏng lúc 4h
chiều thì mọi thứ nhập từ 1h30 sáng hôm đó mất hẳn. Pro + PITR thu hẹp còn vài
giây. Với trung tâm, mất một ngày nhập liệu là nhập lại được — khó chịu, không
phải thảm hoạ. Muốn giảm còn 12 giờ thì thêm một mốc chạy buổi trưa, vẫn 0 đồng.

Nên nâng Pro khi: có người ngoài Founder phụ thuộc hệ thống để làm việc, hoặc
CSDL vượt 400 MB, hoặc đã từng xoá nhầm dữ liệu thật.

### Về "dùng Claude miễn phí"

Anthropic **không có gói API miễn phí** cho Claude. Claude Code (công cụ đang
dựng hệ thống này) cũng không gọi được từ trong ứng dụng. Nên phần AI của hệ
thống dùng Gemini; Claude chỉ tham gia ở khâu phát triển.

## 10/09/2026 — Chọn Netlify Free làm nơi chạy app

Founder yêu cầu hiệu quả nhưng không phát sinh phí, được kết hợp bất kỳ công cụ
mở. Đã tra điều kiện thật của từng bên thay vì suy đoán.

| Nơi chạy | Giá | Dùng thương mại | Chạy được Next.js? |
|---|---|---|---|
| **Netlify Free** | **0 ₫** | ✅ cho phép | ✅ |
| Cloudflare Workers Free | 0 ₫ | ✅ | ❌ **10ms CPU/request** — không đủ render |
| Cloudflare Workers Paid | ~5 USD/th | ✅ | ✅ |
| Vercel Hobby | 0 ₫ | ❌ **cấm** | ✅ |

**Loại Vercel Hobby** dù miễn phí: điều khoản giới hạn gói này cho *"personal or
non-commercial use"*, và định nghĩa thương mại bao gồm dự án thuộc pháp nhân kinh
doanh. Vercel ghi rõ **có quyền tắt project không báo trước**. Không đáng đánh
cược hệ thống vận hành của trung tâm.

**Loại Cloudflare Workers** ở thời điểm này: gói free giới hạn **10ms CPU mỗi
request**, mà render một trang Next.js thường tốn 10–20ms trở lên. Cloudflare là
lựa chọn tốt khi nào chấp nhận trả ~5 USD/tháng — vẫn rẻ hơn Supabase Pro.

**Không dùng Cloudflare D1 thay Supabase.** D1 là SQLite: không có RLS, không có
plpgsql, không có Auth. Ranh giới bảo mật của hệ thống nằm ở 69 policy RLS — chính
thứ chặn giáo viên xem lương đồng nghiệp và lợi nhuận trung tâm. Chuyển sang D1 là
viết lại toàn bộ phần đó bằng mã ứng dụng: nhiều tháng làm việc, bảo mật yếu hơn,
để tiết kiệm 0 đồng vì Supabase free vốn đã 0 đồng.

**Không dùng Google Sheets làm cơ sở dữ liệu.** Hai lý do từ chính dữ liệu của
trung tâm: (1) Sheets không có ranh giới quyền thật — ai sửa được file là xem được
hết qua API hoặc chỉ cần copy file, kể cả bảng lương và lợi nhuận, trái đúng yêu
cầu cứng ở mục IV; (2) không có ràng buộc dữ liệu — ô đơn giá Bé Ngân trong sheet
gốc là `1.790.009.190 ₫`, một lỗi gõ Sheets không thể chặn. **Vẫn giữ Sheets** làm
nguồn nhập liệu ban đầu và nơi xuất báo cáo tháng.

### Cạm bẫy của gói Free Netlify — đã xử lý

Hạn mức **cứng** 300 credit/tháng; hết là site tạm dừng tới tháng sau. Mỗi deploy
production tốn 15 credit, dùng chung pool với băng thông (20 credit/GB) — tức
khoảng 20 lần deploy, và deploy nhiều thì hết băng thông.

`netlify/should-skip-build.sh` chỉ cho build khi có thay đổi thật sự ảnh hưởng app;
sửa tài liệu, migration SQL hay script sao lưu thì bỏ qua. Đã kiểm 7 tình huống,
đạt cả 7. `netlify.toml` cũng tắt deploy xem trước và deploy nhánh.

### Đã kiểm được đến đâu

Chạy `netlify build` thật: Next.js build xong 19 route trong 33,7 giây, Functions
bundling đóng gói xong `___netlify-server-handler`. Bước Edge Functions lỗi 403 vì
**sandbox phát triển chặn `deno.land`** (xác nhận: `CONNECT tunnel failed, response
403`), không phải lỗi cấu hình.

Lần chạy này cũng lộ ra hai thiếu sót đã vá: `netlify build` sinh thư mục
`.netlify/` nặng ~119 MB mà `.gitignore` và ESLint chưa biết — thiếu thì commit cả
mã sinh tự động vào repo và lint báo 6 lỗi giả.

**Chưa kiểm được** vì cần tài khoản Netlify thật: lần deploy đầu tiên, và
`src/middleware.ts` chạy dưới dạng Edge Function trên Deno.

## 11/09/2026 — Đã tạo tài khoản Founder và nhập 21 lớp

**Tài khoản Founder:** `ms.ngocenliteenglish@gmail.com`, email đã xác nhận,
`role_code = 'founder'`. Mật khẩu do Postgres sinh ngẫu nhiên (120 bit), **là mật
khẩu tạm** — phải đổi ở lần đăng nhập đầu tiên.

**Đã nhập từ sheet "CRM ( 10/9)"** bằng `scripts/migration/import_danh_sach_lop.sql`:

| | Số lượng |
|---|---|
| Giáo viên | 6 |
| Học viên | 20 (lớp nhóm Y Khoa tách thành 3 người) |
| Lớp học | 20 (THIENAI-KO xuất hiện 2 dòng trong sheet ⇒ 1 lớp) |
| Dòng lịch học | 36 |
| Hợp đồng học phí | 20 (11 gói trả trước, 8 cuối tháng, 1 chưa xác định) |
| Mốc đơn giá học phí | 21 (Bé Ngân có 2 mốc theo D11) |
| Đơn giá lương | 8 (6 theo giáo viên + 2 riêng theo lớp của Ms. Phương) |
| **Dòng cần đối soát** | **14** |

Quy trình: viết script → **kiểm trên cụm PostgreSQL tạm** → đối chiếu → mới áp lên
dữ liệu thật. Mọi con số trên dữ liệu thật **khớp tuyệt đối** với bản kiểm, gồm cả
Bé Ngân 179.000 ₫ (20/08) và 190.000 ₫ (05/09), Hoàng Uyên đứng tên đóng lớp Y Khoa,
Thảo 250.000 ₫ theo D10, và ba mức lương khác nhau của Ms. Phương (120.000 / 140.000
/ 160.000). Script có chốt chặn nên chạy lần hai bị từ chối.

### Cố ý CHƯA sinh buổi học nào

Bốn lớp có giờ kết thúc do tôi **tạm ghi 60 phút** (PHUC-PH, NGOC-HO, HANG-PH) và
một lớp **không rõ sáng hay chiều** (TAN-SH, Chủ nhật "4:30-5:30"). Sinh buổi học
trên giờ sai sẽ tạo bản ghi lương sai và doanh thu sai — sửa sau tốn hơn nhiều lần.
Đúng thứ tự là: Founder đối soát 14 dòng ở `/review` → sửa → rồi mới sinh buổi.

### Không bịa dữ liệu thiếu

Năm lớp có ô lịch trống trong sheet (LINH-PH, KIEN-SH, VY-SH, NHI-PH, THIENAI-KO)
⇒ để trống, gắn cờ đối soát. Level trong sheet mịn hơn bậc CEFR của hệ thống
(Pre A2, A1+, A2+, B1+) ⇒ làm tròn về bậc gần nhất nhưng **giữ nguyên văn** chuỗi
gốc trong `students.learning_notes`. Chương trình học (KIDS/TEENS/ADULT) **để
trống** trừ hai lớp IELTS ghi rõ trong dữ liệu — đoán chương trình từ tên người là
bịa quy tắc nghiệp vụ.

---

## Còn thiếu để hoàn tất việc nhập dữ liệu

Những mục này chỉ cần tra cứu, không cần quyết định lớn:

### Lịch học chưa có (6 lớp)
`LINH-PH` (Ms. Linh) · `KIEN-SH` (Kiên) · `VY-SH` (Vy) · `NHI-PH` (Nhi) · `THIENAI-KO` (Thiên Ái)

### Thiếu giờ kết thúc (3 lớp) — tạm hiểu là 60 phút, cần xác nhận
| Lớp | Ô gốc | Tôi hiểu là |
|---|---|---|
| `PHUC-PH` | `CN 10h15` | Chủ nhật 10:15–11:15 |
| `NGOC-HO` | `T3, T5, T7 6pm` | Thứ Ba/Năm/Bảy 18:00–19:00 |
| `HANG-PH` | `T3, T5, T6 2pm` | Thứ Ba/Năm/Sáu 14:00–15:00 |

### Không rõ sáng hay chiều (1 lớp)
`TAN-SH` — `T7 9:30-10:30 & CN 4:30-5:30`. Buổi Chủ nhật là **16:30–17:30** hay **04:30–05:30**?

### Khác
- `NGOC-HO` (Bảo Ngọc): hình thức đóng ghi **"Chưa xác định"** — Cuối tháng hay Gói?
- **Công Duy**: có trong bảng giá (chưa có học phí) nhưng không có lớp nào trong file mới. Còn học không?
- **Ms. Tuyết (Golf)**: trạng thái "đang đợi", chưa có mã lớp ⇒ tôi nhập thành *lead*, không phải học viên
- **Nâng Supabase lên gói Pro** trước khi nhập dữ liệu thật (gói Free tự tạm dừng, không sao lưu)
- **Số dư mở đầu**: bảng giá chỉ có mốc "đã đóng đủ đến ngày" cho 2 người (Bé Ngân 31/08/2026, Y Khoa 31/07/2026). 16 học viên còn lại cần lấy từ tab "LỊCH SỬ THANH TOÁN" — tôi sẽ tự đọc, không cần cô làm gì

---

## 14/09/2026 — Vòng 3: học phí quy đổi theo thời lượng buổi học

| Mã | Quyết định | Hệ quả kỹ thuật |
|---|---|---|
| D15 | **Đơn giá chuẩn là buổi 60 PHÚT.** Buổi 30 hoặc 90 phút quy đổi theo tỉ lệ từ chính đơn giá gốc đó: 30 phút = 0,5 lần · 90 phút = 1,5 lần | Migration 0018 sửa `fn_consume_lesson`: nhân cả `lessons_deducted` lẫn `recognized_amount` với `duration_minutes / 60` |

### Vì sao phải sửa mã, không chỉ sửa dữ liệu

`fn_consume_lesson` bản cũ ghi nhận doanh thu bằng đúng đơn giá, **bất kể buổi
dài bao nhiêu**:

```sql
lessons_deducted = 1;  recognized_amount = v_price;
```

Buổi 90 phút bị tính bằng giá buổi 60 phút — thu thiếu nửa tiếng. Buổi 30 phút
bị tính đủ giá — thu thừa của phụ huynh.

Cách vá tạm là tạo một dòng đơn giá riêng cho buổi 90 phút. Đã thử và **bỏ**:
lần sau có buổi 45 phút hay buổi bù 30 phút thì lại phải tạo thêm dòng, và nếu
quên thì hệ thống âm thầm tính sai. Quy tắc nằm trong hàm thì áp cho mọi buổi.

### Quy tắc này trung tâm đã áp dụng sẵn ngoài hệ thống

- Bé **Vũ Hoàng Phúc**, buổi 30 phút ngày 07/06/2026 (lớp Ms. Phương): tính
  **95.000 đ** = 190.000 × 0,5 — ghi trong báo cáo học phí T6–T7/2026.
- **Bảo Ngọc**, 5 buổi 90 phút tháng 8/2026: thu **1.868.000 đ**, trong khi
  249.000 × 1,5 × 5 = **1.867.500 đ**. Trung tâm **thu dư 500 đ** do làm tròn.

### Đã kiểm thử trên cơ sở dữ liệu thật

Tạo ba buổi thử cho lớp Bảo Ngọc (đơn giá gốc 249.000 đ) trong một transaction
rồi rollback:

| Thời lượng | Số buổi trừ | Tiền ghi nhận |
|---|---:|---:|
| 30 phút | 0,50 | 124.500 đ |
| 60 phút | 1,00 | 249.000 đ |
| 90 phút | 1,50 | 373.500 đ |

Sau rollback: `lessons`, `attendance`, `lesson_consumptions` đều về 0 dòng.

`price_per_lesson` vẫn lưu **đơn giá gốc 60 phút**, không nhân sẵn — nhìn vào
một dòng dữ liệu vẫn biết giá chuẩn là bao nhiêu và tỉ lệ quy đổi từ đâu ra.

---

## D16 — Nhập lịch sử buổi học từ báo cáo PDF: 5 lớp, 152 buổi (14/09/2026)

**Bối cảnh.** Cô Ngọc phản ánh: *"không thấy lịch sử các lớp?"*. Đúng — bảng
`lessons` trống hoàn toàn, nên mọi con số học phí trên hệ thống đều bằng 0.
Nguồn duy nhất về buổi đã dạy là các báo cáo PDF trung tâm gửi phụ huynh.

**Đã nhập.**

| Lớp | Buổi | Học phí phát sinh | Đối chiếu báo cáo |
|---|---:|---:|---|
| Vũ Hoàng Ngọc Diệp (Ms. Phương + Ms. Rose) | 44 | 8.360.000 đ | T6+T7 5.700.000 ✓ · T8 2.660.000 ✓ |
| Vũ Hoàng Phúc (Ms. Phương + Ms. Sheba) | 28 | 5.225.000 đ | T6+T7 3.895.000 ✓ · T8 1.330.000 ✓ |
| Thiên Ái (Mr. Kobe) | 26 | 6.160.000 đ | còn thiếu 280.000 ✓ |
| Toàn (Ms. Nhi) | 26 | 6.225.000 đ | báo cáo không chốt tiền |
| Hậu (Ms. Nhi) | 14 | 2.490.000 đ | báo cáo không chốt tiền |

**Không ghi giờ dạy thực tế.** Các báo cáo chỉ ghi NGÀY. `actual_start_at` và
`actual_end_at` để trống vì đó là sự thật. Hệ quả có lợi: `fn_generate_payable_lesson`
đòi có giờ thực tế mới sinh dòng trả lương, nên **0 dòng lương** được sinh ra cho
cả 152 buổi — lương tháng 5 đến tháng 8 trung tâm đã trả ngoài hệ thống rồi.
Đã kiểm chứng bằng truy vấn `teacher_payable_lessons`: 0 dòng.

**Ba việc phải làm đúng thứ tự**, nếu không hệ thống ghi nhận sai:

1. Nhập buổi với `status = 'scheduled'`. Trigger doanh thu chỉ chạy khi trạng
   thái **đổi** sang `completed` — nhập thẳng `completed` sẽ không sinh gì.
2. Sửa `is_billable = false` cho buổi miễn phí **sau khi** insert điểm danh.
   Trigger `tg_attendance_defaults` ghi đè cột này lúc INSERT.
3. Rồi mới `update ... status = 'completed'`.

**Lùi ngày hiệu lực đơn giá.** Cả ba học viên Thiên Ái / Toàn / Hậu có đơn giá
ghi hiệu lực từ 01/09/2026, trong khi lịch sử học bắt đầu từ 31/05/2025.
`fn_resolve_tuition_rate` sẽ không tìm thấy đơn giá và ghi nhận doanh thu = 0.
Đã lùi `effective_from` về ngày buổi đầu tiên của từng người. Không thêm dòng
đơn giá mới vì **không có bằng chứng nào** cho thấy giá đã từng đổi.

**Mở lại 3 hợp đồng đang `paused`.** `fn_pick_enrollment` chỉ chọn hợp đồng
`active`; để `paused` thì buổi nhập vào không sinh doanh thu. Cả ba hợp đồng đều
chưa chốt — còn công nợ hoặc còn buổi chưa đối soát.

**Ba giáo viên mới trong dữ liệu.** Báo cáo Thiên Ái có Mr. Andy (1 buổi),
Mr. Marbin (3 buổi), Ms. Jai (2 buổi) — chưa có trong hệ thống. Đã tạo với
`status = 'archived'` và `needs_review = true`: mới chỉ có **tên gọi**, chưa có
họ tên đầy đủ, liên hệ hay đơn giá.

### Giả định phải được cô Ngọc xác nhận

| # | Chỗ chưa chắc | Đã giả định gì | Ảnh hưởng tiền |
|---|---|---|---|
| 1 | Buổi kiểm tra đầu vào 30 phút của **Toàn** (10/06/2026) có thu phí không? Báo cáo không nói. | Đặt **không thu phí**, theo tiền lệ của Hậu (cùng Ms. Nhi, cùng chương trình, cùng giai đoạn — báo cáo ghi rõ miễn phí). Tiền lệ ngược: buổi 30 phút của Phúc **có** thu 95.000 đ. | 124.500 đ |
| 2 | ~~Đơn giá thật của **Toàn**~~ **ĐÃ CHỐT 14/09/2026: 250.000 đ.** | Đã sửa. 25 buổi × 250.000 = 6.250.000 đ; đã đóng 5.000.000 đ = đúng 20 buổi; còn thiếu 1.250.000 đ = đúng 5 buổi. Số ra tròn, xác nhận đơn giá đúng. **Sheet gốc vẫn ghi 249.000 đ — cô sửa lại sheet.** | đã xử lý |
| 3 | Số buổi **Toàn** đã mua | Suy ra **20 buổi** = 2 đợt × 10 buổi | quyết định số dư |
| 4 | **Hậu** đã đóng bao nhiêu | **Chưa có chứng từ nào.** Đã chuyển hợp đồng sang `undetermined` và **xoá** con số "10 buổi đã mua" đang lưu — không có chứng từ thì không ghi nhận tiền. | 2.490.000 đ đang treo |
| 5 | Ngày cấn trừ 1 buổi của học viên "Đăng" cho **Thiên Ái** | Lấy ngày lập báo cáo 14/07/2026 | 0 đ (chỉ lệch ngày) |

### Đã giải được: Đặng Thái Chung đóng cho ai

Trước đó chưa quy được hai lần chuyển 2.500.000 đ ngày 14/06 và 11/07/2026 về
học viên nào — Toàn và Hậu đều là học viên Ms. Nhi cùng đơn giá.

Báo cáo *"Báo cáo học tập và số buổi Toàn sau 03-07-2026"* (lập 08/09/2026),
mục 5, ghi: **"Đã ghi nhận 2 đợt đóng: 14/06/2026 và 11/07/2026"** — trùng khít
ngày với hai lần chuyển của Đặng Thái Chung. Đây là bằng chứng từ chính báo cáo
của trung tâm, không phải suy đoán từ số tiền.

### Còn thiếu chứng từ

- Báo cáo nhóm Y Khoa **tháng 5** (cho khoản 2.010.000 đ đóng 05/06/2026)
- Ảnh chuyển khoản Y Khoa **tháng 7** (2.370.000 đ — đang `needs_review = true`)
- Feedback cô Lệ Trang **T6–T7**
- Chứng từ thanh toán của **Hậu**

---

## D17 — Nguồn sự thật là sheet feedback, không phải báo cáo PDF (14/09/2026)

**Cô Ngọc nói rõ:** *"trong feedback là tất cả các lớp đã diễn ra thời gian vừa
qua tôi đã thanh toán lương dựa vào số buổi học viên đã học trong feedback"*.

Hai hệ quả:

1. **Sheet feedback của từng lớp là nguồn gốc**, báo cáo PDF chỉ là bản tổng hợp
   gửi phụ huynh. File `CRM (10/9)` có cột **ID sheet feedback** trỏ tới sheet
   riêng của từng lớp — đó mới là nơi giáo viên ghi từng buổi.
2. **Lương của mọi buổi trong feedback đã trả rồi.** Khi nhập các buổi này vào
   hệ thống, dòng lương sinh ra phải đánh `status = 'paid'` ngay, kèm ghi chú
   "đã trả ngoài hệ thống", nếu không hệ thống sẽ báo nợ lương không có thật.

### Khác biệt quan trọng với 5 lớp đã nhập

Năm lớp nhập từ PDF **không có giờ dạy** nên không sinh dòng lương nào. Các sheet
feedback **có giờ bắt đầu và giờ kết thúc thật**, nên sẽ sinh dòng lương. Đây là
dữ liệu tốt hơn — giữ được, chỉ cần đánh dấu đã trả.

### Quy mô còn lại

Mười lớp chưa có buổi nào trong hệ thống, cộng một lớp chưa tồn tại (Công Duy):

| Lớp | Số buổi trong feedback | Giáo viên xuất hiện |
|---|---:|---|
| LUAN-SH (Bùi Thành Luân) | 41 | Benjamin, Ms. Grace, Ms. Rith, Ms. Sheba |
| TAN-SH (Bùi Thiên Tân) | 55 | Ms. Phương, Ms. Sheba |
| TUYET-SH (Ms. Tuyết) | 21 | Teacher Allen, Ms. Wen, Ms. Sheba |
| NGAN-PH (Bé Ngân) | 14 | Ms. Phương |
| HOANG-PH (Hoàng & Huệ) | 15 | Ms. Phương |
| HANG-PH, LINH-PH, KIEN-SH, VY-SH, NHI-PH | chưa đọc | |
| Công Duy | chưa đọc | Ms. Sheba |

### Vấn đề chất lượng dữ liệu đã phát hiện

- **Tám giáo viên chưa có trong hệ thống**: Benjamin, Ms. Grace, Ms. Rith,
  Teacher Allen, Ms. Wen, Marie, Ms. Kim, và Mr. Andy / Mr. Marbin / Ms. Jai
  (đã tạo ở D16). Cùng một người viết nhiều cách: "Ms. Sheba" / "Teacher Sheba",
  "Ms. Phương" / "Ms Phuong" / "Teacher Phương".
- **Số buổi bị nhảy cóc**: lớp Tân thiếu buổi 50 và 54; lớp Luân nhảy từ 38
  sang 45, 46, 48.
- **Ngày không có năm**: lớp Ngân có dòng ghi "21/6", "25/6", "24/7".
- **Ngày nghi sai thứ tự**: lớp Tân buổi 56 và 57 ghi 08/01/2026 và 08/02/2026,
  nằm ngay sau buổi 55 ngày 28/07/2026 — nhiều khả năng là 01/08 và 02/08 bị
  gõ ngược. **Chưa sửa, cần cô xác nhận.**
- **Học phí bé Ngân trong sheet ghi 1.790.009.190 đ** — lỗi gõ. Tab khác của
  cùng file ghi 179.000 đ. Chưa nhập con số nào cho đến khi cô xác nhận.
- **Ba học viên có trong tab học phí nhưng không có trong danh sách lớp**:
  C Khang, Khôi (có hoa hồng giới thiệu 50.000 đ/buổi), Uyên.
- **Bảng điều hành trong Google Sheet đang lỗi**: các ô KPI hiện `#ERROR!`,
  "Tổng số buổi đã dạy tháng" hiện **46143** (là số sê-ri ngày, không phải số
  buổi). Đây chính là lý do cần hệ thống riêng.

### Rủi ro vận hành do chính sheet ghi lại

Ghi chú trong sheet lớp Hoàng & Huệ: video buổi học nằm trên kênh YouTube
**cá nhân của giáo viên**, không thuộc tài khoản trung tâm — mất quyền truy cập
nếu giáo viên nghỉ. Nên chuyển bản lưu về Drive của trung tâm.

---

## D18 — Nhập 146 buổi của 5 lớp từ sheet feedback (14/09/2026)

Nối tiếp D17. Đây là lần đầu nhập buổi học **có giờ dạy thật**, nên cũng là lần
đầu hệ thống sinh dòng trả lương.

| Lớp | Buổi | Có giờ dạy | Học phí phát sinh |
|---|---:|---:|---:|
| Bùi Thiên Tân | 55 | 51 | 11.968.350 đ |
| Bùi Thành Luân | 41 | 30 | 8.979.000 đ |
| Ms. Tuyết | 21 | 15 | 5.187.492 đ |
| Ms. Hoàng & Ms. Huệ | 15 | 0 | 3.900.000 đ |
| Bé Ngân | 14 | 14 | 2.517.000 đ |

Lương sinh ra: **110 dòng, 13.200.000 đ, tất cả đánh `paid`**. Cô Ngọc đã trả
theo số buổi trong chính sheet feedback này rồi; để `pending` thì hệ thống sẽ
báo một khoản nợ lương không có thật.

Ba mươi sáu buổi không có giờ trong sheet nên không sinh dòng lương. Đó là
**thiếu dữ liệu, không phải buổi không được trả** — cô đã trả đủ ngoài hệ thống.

### Quyết định của Founder ngày 14/09/2026

| Câu hỏi | Trả lời |
|---|---|
| Lớp Tân buổi 56, 57 ghi 08/01 và 08/02 | Là **tháng 8**: 01/08 và 02/08/2026 |
| Học phí bé Ngân (sheet ghi 1.790.009.190 đ) | **179.000 đ** |
| C Khang, Khôi, Uyên | **Không nhập** |
| Lớp Hoàng & Huệ | **Lớp nhóm** hai học viên |
| Benjamin, Ms. Grace, Ms. Rith, Teacher Allen, Ms. Wen, Marie | **Đã nghỉ việc** |

### Đơn giá lương gắn với LỚP, không gắn với người

Sáu giáo viên đã nghỉ nên không có bảng lương riêng. Dùng đúng mô hình của
chính sheet: *"Lương giáo viên tự tính theo số buổi giáo viên báo cáo và mức
pay/60 phút trong CLASS LIST"* — tức đơn giá thuộc về **lớp**. Bảng
`teacher_rates` có sẵn `scope = 'class'` cho việc này. Kết quả: 110/110 dòng
lương có `rate_source = 'class'`, không dòng nào thiếu đơn giá.

### Lớp Hoàng & Huệ: tách đôi, không tính tiền hai lần

Bản ghi cũ gộp hai người thành một học viên tên *"Ms. Hoàng/Huê"*. Đã tách:
Ms. Hoàng giữ hợp đồng, Ms. Huệ điểm danh với `is_billable = false` — đúng mô
hình nhóm Y Khoa, vì 260.000 đ là giá **cả nhóm**. Kiểm chứng: Hoàng 3.900.000 đ,
Huệ 0 đ.

Theo sheet, Huệ chỉ bắt đầu từ buổi 21/05/2026; ba buổi 05/05, 07/05 và 17/05
chỉ ghi "Ms Hoàng". Nên Huệ có 12 lượt điểm danh trên 15 buổi.

### Con số nợ lớn đang hiện KHÔNG phải nợ thật

Tân 11,97 triệu, Luân 8,98 triệu, Tuyết 5,19 triệu, Hoàng 3,9 triệu, Ngân
2,52 triệu — đây là **chưa nhập thanh toán**, không phải phụ huynh chưa đóng.
Tab SYS_THANHTOAN có ghi tiền của Luân và Tân nhưng **các dòng bị trùng lặp**:
cùng một mã tham chiếu xuất hiện ở nhiều ngày khác nhau (ví dụ đợt 1 của Luân
2.200.000 đ ghi ở cả 21/10/2025, 12/6/2025 và 19/8/2026). Chưa nhập dòng nào
cho đến khi cô xác nhận đâu là giao dịch thật.

Thêm một điểm lệch: hai đợt đầu của Luân và Tân ghi **220.000 đ/buổi**, trong
khi CLASS LIST ghi **219.000 đ**.

### Năm lớp còn lại chưa nhập được

Ms. Hằng, Ms. Linh, Kiên, Vy, Nhi, và Công Duy (chưa có trong hệ thống).

Riêng **Ms. Hằng** đã đọc và **không nhập được**: sheet có hai bảng mâu thuẫn
nhau. Bảng một đánh số buổi 1-5 (19/6, 25/6, 30/6, 6/7, 15/7); bảng hai đánh số
1-22 từ 18/3/2025. Ngày 6/7 vừa là buổi 4 ở bảng một vừa là buổi 22 ở bảng hai;
ngày 15/7 vừa là buổi 5 vừa là buổi 19. Chín dòng (buổi 13-21) bị lặp nguyên
văn. Không thể biết học viên đã học bao nhiêu buổi nếu không có cô xác nhận.

---

## D19 — Năm lớp cuối, và lời giải cho "sheet Ms. Hằng tự mâu thuẫn" (14/09/2026)

### Bảng 22 buổi gây nhầm lẫn là của Ms. Hằng, bị sao chép lẫn sang sheet khác

Ở D17 tôi báo sheet Ms. Hằng tự mâu thuẫn và không nhập được. Nguyên nhân đã rõ.
Sheet của **Ms. Linh** có ghi chú của chính trung tâm:

> *"Đã sửa tiêu đề Sheet từ 'Hằng' thành 'MS. LINH' để tránh nhầm học viên."*

Bảng 22 buổi từ 18/3/2025 (tiêu đề `STUDENT: Ms HẰNG`) nằm lẫn trong **năm**
sheet khác nhau: Linh, Kiên, Vy, Nhi và Duy. Nó không mâu thuẫn với gì cả — nó
chỉ đứng nhầm chỗ. Ms. Linh thật ra chỉ có **4 buổi**, không phải 22.

Founder chốt: **bỏ qua lớp Ms. Hằng**.

### Đã nhập

| Lớp | Buổi | Tính phí | Học phí | Lương |
|---|---:|---:|---:|---:|
| Vy (Ms. Sheba) | 8 | 8 | 2.240.000 đ | 960.000 đ |
| Nhi (Ms. Phương) | 6 | 5 | 1.250.000 đ | 720.000 đ |
| Ms. Linh (Ms. Phương) | 4 | 4 | 876.000 đ | 480.000 đ |
| Công Duy (Ms. Sheba) | 3 | 3 | 630.000 đ | 360.000 đ |
| Kiên (Ms. Sheba) | 2 | 2 | 600.000 đ | 240.000 đ |

**Công Duy chưa hề có trong hệ thống** — đã tạo học viên, lớp, hợp đồng và đơn
giá từ dòng 21 sheet CLASS LIST. Sheet ghi *"Lớp 1 kèm 2"* nhưng chỉ có một tên
học viên, nên đánh `needs_review`.

### Quyết định của Founder ngày 14/09/2026 (đợt hai)

| Câu hỏi | Trả lời |
|---|---|
| Lớp Tân buổi 56, 57 | Tháng 8 → 01/08 và 02/08/2026 |
| Học phí bé Ngân | 179.000 đ |
| C Khang, Khôi, Uyên | Không nhập |
| Lớp Hoàng & Huệ | Lớp nhóm |
| Sáu giáo viên lạ | Đã nghỉ việc |
| Lớp Toàn | **Test demo và buổi 1 đều không thu phí** |
| Lớp Ms. Hằng | Bỏ qua |

### Lớp Toàn tính lại, số ra tròn

Trước: 25 buổi tính phí. Sau khi bỏ thêm buổi 1 (15/06, *Lesson 1 – Where are
you from?*): **24 buổi × 250.000 = 6.000.000 đ**. Đã đóng 5.000.000 đ = đúng
20 buổi. Còn thiếu 1.000.000 đ = đúng 4 buổi.

### Giả định còn phải xác nhận

Buổi **10/08/2026 của Nhi** đã đánh **không thu phí**. Căn cứ: sheet ghi rõ
*"Buổi làm quen"*, dùng tài liệu thiếu nhi không đúng trình độ (học viên 13
tuổi), giáo viên không giao bài tập, và từ 12/08 mới chuyển sang giáo trình
trung tâm. Áp quy tắc Founder vừa chốt cho lớp Toàn. **Nếu sai, chỉ cần đổi lại
một cờ.**

Ngược lại, buổi đầu của **Ms. Linh (28/07)**, **Kiên (03/08)**, **Vy (04/08)**
và **Công Duy (24/08)** đều **có thu phí** — sheet ghi nội dung bài học thật,
không có nhãn demo hay làm quen nào.

### Chưa nhập

- Dòng **08/09/2026 của lớp Vy**: không có giáo viên, không có giờ, chỉ có một
  link Zoom Clip. Chưa đủ căn cứ để coi là một buổi học.

### Tình trạng sau đợt nhập này

**390 buổi** trong hệ thống. **133 dòng lương, 15.960.000 đ, tất cả `paid`**,
không dòng nào thiếu đơn giá.

### Vấn đề vận hành các sheet tự ghi lại

- **Lớp Vy**: 6 trong 8 buổi tháng 8 chỉ lưu trên **Zoom Clips** (không phải tài
  khoản trung tâm), không lấy được phụ đề nên không chấm theo bằng chứng được.
  Sáu trong tám buổi cùng ghi một bài *Speak Now 2 – Lesson 1*. Học viên báo sẽ
  thi IELTS ngày 01/12/2026.
- **Lớp Nhi**: sheet ghi nhận hai việc cần Founder xử lý — giáo viên kể chuyện
  ngoài lề không phù hợp với học viên 13 tuổi (buổi 14/08), và một lỗi chữa bài
  cần đính chính (*"look forward to + V-ing"* mới đúng, giáo viên sửa thành
  động từ nguyên mẫu là sai).
- **Lớp Ms. Linh**: buổi 20/08 có khoảng 15 phút cuối chuyển sang việc riêng của
  giáo viên, trong đó học viên thành người tư vấn ngược cho giáo viên.

---

## D20 — Miễn phí buổi 1 cho Kiên, Vy và Công Duy (14/09/2026)

Founder chốt thêm ba lớp nữa miễn phí buổi đầu.

| Lớp | Buổi 1 | Học phí trước | Học phí sau |
|---|---|---:|---:|
| Vy | 04/08/2026 | 2.240.000 đ | **1.960.000 đ** |
| Công Duy | 24/08/2026 | 630.000 đ | **420.000 đ** |
| Kiên | 03/08/2026 | 600.000 đ | **300.000 đ** |

### Miễn phí cho học viên không làm giảm lương giáo viên

Dòng lương của ba buổi này giữ nguyên và vẫn ở trạng thái `paid`. Giáo viên đã
dạy đủ buổi; việc trung tâm không thu tiền học viên là quyết định kinh doanh,
không phải lý do trừ lương. Hệ thống tách hai bên đúng như vậy: `is_billable`
trên bảng điểm danh chỉ chi phối doanh thu, còn dòng lương sinh từ giờ dạy thật
trên bảng buổi học.

### Quy tắc "miễn phí buổi 1" hiện áp cho những lớp nào

| Lớp | Buổi không thu phí | Căn cứ |
|---|---|---|
| Toàn | Test demo 10/06 + buổi 1 ngày 15/06 | Founder chốt |
| Kiên | Buổi 1 ngày 03/08 | Founder chốt |
| Vy | Buổi 1 ngày 04/08 | Founder chốt |
| Công Duy | Buổi 1 ngày 24/08 | Founder chốt |
| Nhi | Buổi 10/08 | **Suy ra** — sheet ghi "Buổi làm quen"; chờ Founder xác nhận |
| Hậu | 4 buổi trước 29/05 | Báo cáo PDF ghi rõ "Không tính kinh phí" |
| Thiên Ái | Placement, demo, 2 buổi cô Jai | Báo cáo PDF mục 3 |
| Thảo | Buổi đầu vào 16/05 + 3 buổi đầu với cô Phương | Báo cáo PDF |

**Ms. Linh vẫn tính phí cả 4 buổi** — Founder không nêu lớp này trong danh sách
miễn phí. Nếu buổi 28/07 cũng được miễn thì học phí giảm từ 876.000 đ xuống
657.000 đ.

---

## D21 — Báo cáo gửi gia đình anh Luyện sửa lại ba điều tôi đã làm sai (14/09/2026)

Báo cáo **"MNEE_GiaDinh_Luan-Tan-MsLinh_BaoCaoHocTap_HocPhi"** kỳ 14/07–30/08/2026
là chứng từ **đã gửi phụ huynh**, nên có giá trị cao hơn sheet feedback và cao
hơn tab SYS_THANHTOAN nội bộ. Nó sửa lại ba điều:

### 1. Đơn giá là 219.000 đ, không phải 220.000

Trước đó tôi suy ra 220.000 từ cách tab SYS_THANHTOAN phân bổ giao dịch
7.480.000 đ (2.640.000 ÷ 12 = 4.840.000 ÷ 22 = 220.000). Phép tính đó đúng
nhưng **nguồn sai**: báo cáo gửi gia đình ghi rõ **219.000 đ** cho cả ba học
viên. Đã trả lại 219.000.

### 2. Tôi đọc sai ngày ba buổi của lớp Luân

Cùng loại lỗi dd/mm mà Founder đã chỉ ra ở lớp Tân. Sheet ghi 08/01 và 08/02
thật ra là **01/08 và 02/08**; 09/08 bị tôi đọc thành 09/09. Báo cáo xác nhận
Luân có học đúng 01/08, 02/08 và 09/08.

### 3. Sheet feedback thiếu buổi

Báo cáo liệt kê 15 buổi cho mỗi bé trong kỳ 14/07–30/08 mà sheet không có.

**Xác nhận rất mạnh:** sau khi xoá phần nhập sai, hệ thống còn **Luân 38 buổi**
và **Tân 49 buổi** — đúng bằng mốc báo cáo ghi (*"Tân buổi 49 ngày 04/07/2026"*;
buổi 39 của Luân là buổi kế tiếp, ngày 07/07/2026).

### Founder chốt: buổi 04/08/2026 Luân không học

Đã bỏ. Luân còn **14 buổi = 3.066.000 đ**, không phải 15 buổi = 3.285.000 đ.

### Ms. Linh là người trong gia đình anh Luyện

Điều này giải thích nội dung chuyển khoản *"a LUYEN chuyen tien hoc chi Linh"*.
Ba người cùng một báo cáo, cùng một người đóng tiền.

---

## D22 — Đối chiếu tiền anh Bùi Văn Luyện: KHÔNG khớp, thiếu 2.592.000 đ

### A. Kỳ 14/07 – 30/08/2026 (anh Luyện chưa đóng — Founder xác nhận)

| Học viên | Báo cáo | Hệ thống | Lệch |
|---|---|---|---:|
| Bùi Thành Luân | 15 buổi · 3.285.000 đ | 14 buổi · 3.066.000 đ | −219.000 đ |
| Bùi Thiên Tân | 15 buổi · 3.285.000 đ | 15 buổi · 3.208.350 đ | −76.650 đ |
| Ms. Linh | 4 buổi · 876.000 đ | 4 buổi · 876.000 đ | **0 — khớp** |
| **Tổng** | **7.446.000 đ** | **7.150.350 đ** | |

Lệch của Luân là do Founder chốt bỏ buổi 04/08.

**Lệch 76.650 đ của Tân là một xung đột quy tắc thật, cần Founder chọn.** Bốn
buổi tháng 7 của Tân chỉ dạy 53–56 phút (17/07 55′, 19/07 56′, 21/07 55′,
28/07 53′). Báo cáo tính đủ 219.000 đ mỗi buổi; hệ thống quy đổi theo thời
lượng đúng quy tắc **D15** Founder đã chốt. Hai cách không thể cùng đúng.

### B. Phần trước kỳ báo cáo — không khớp

Báo cáo ghi mốc đã thanh toán: Luân hết buổi 39, Tân hết buổi 49.

| | |
|---|---:|
| Luân 39 buổi × 219.000 | 8.541.000 đ |
| Tân 49 buổi × 219.000 | 10.731.000 đ |
| **Phải đã thu** | **19.272.000 đ** |
| Tiền có ảnh chuyển khoản | 16.680.000 đ |
| **Thiếu chứng từ** | **2.592.000 đ** |

Ba ảnh chuyển khoản đã có:

| Ngày | Số tiền | Nội dung |
|---|---:|---|
| 07/10/2025 | 7.000.000 đ | BUI VAN LUYEN chuyen tien |
| 29/12/2025 | 2.200.000 đ | a LUYEN chuyen tien **hoc chi Linh** |
| 18/07/2026 | 7.480.000 đ | Bui Luyen chuyen khoan nhanh qua Zalo |

### Hai chỗ không khớp với tab SYS_THANHTOAN

1. **7.000.000 đ ngày 07/10/2025.** Tab ghi đợt 1 là hai khoản 2.200.000 đ vào
   ngày **21/10/2025** (tổng 4.400.000). Lệch 2.600.000 đ và lệch 14 ngày.
   Đã chia đôi 3.500.000 đ mỗi bé — **đây là giả định**, ảnh chuyển khoản không
   ghi tên học viên.
2. **2.200.000 đ ngày 29/12/2025.** Nội dung ghi *"hoc chi Linh"* nên đã ghi cho
   Ms. Linh. Nhưng lớp Ms. Linh chỉ bắt đầu 28/07/2026 — **7 tháng sau** ngày
   chuyển. Nếu khoản này thật sự là của Tân và Luân thì phần thiếu chứng từ của
   hai bé là **4.792.000 đ**.

### Số dư hiện tại

| Học viên | Học phí | Đã đóng | Số dư |
|---|---:|---:|---:|
| Bùi Thiên Tân | 13.939.350 đ | 8.340.000 đ | **−5.599.350 đ** |
| Bùi Thành Luân | 11.607.000 đ | 6.140.000 đ | **−5.467.000 đ** |
| Ms. Linh | 876.000 đ | 2.200.000 đ | +1.324.000 đ |

---

## D23 — Chốt lại: khoản 29/12/2025 không phải học phí (14/09/2026)

Founder chốt: giao dịch **2.200.000 đ ngày 29/12/2025** là anh Luyện chuyển tiền
**riêng cho chị Linh**, không phải học phí. Đã xoá khỏi sổ thu.

### Đối chiếu gia đình anh Bùi Văn Luyện sau khi chốt

| | |
|---|---:|
| Luân 39 buổi × 219.000 (mốc báo cáo ghi đã thanh toán) | 8.541.000 đ |
| Tân 49 buổi × 219.000 (mốc báo cáo ghi đã thanh toán) | 10.731.000 đ |
| **Phải đã thu trước kỳ 14/07** | **19.272.000 đ** |
| Đã thu có ảnh chuyển khoản (07/10/2025 + 18/07/2026) | 14.480.000 đ |
| **Thiếu chứng từ** | **4.792.000 đ** |

### Số dư ba học viên

| Học viên | Buổi | Học phí | Đã đóng | Số dư |
|---|---:|---:|---:|---:|
| Bùi Thiên Tân | 64 | 13.939.350 đ | 8.340.000 đ | **−5.599.350 đ** |
| Bùi Thành Luân | 53 | 11.607.000 đ | 6.140.000 đ | **−5.467.000 đ** |
| Ms. Linh | 4 | 876.000 đ | 0 đ | **−876.000 đ** |
| **Tổng** | | **26.422.350 đ** | **14.480.000 đ** | **−11.942.350 đ** |

Khoản 11.942.350 đ này gồm hai phần:
- **7.150.350 đ** — kỳ 14/07–30/08/2026 anh Luyện chưa đóng (Founder xác nhận)
- **4.792.000 đ** — phần trước đó thiếu chứng từ chuyển khoản

---

## Tình trạng hệ thống, chốt ngày 14/09/2026

| | |
|---|---:|
| Buổi học trong hệ thống | **411** |
| Doanh thu ghi nhận | **92.412.342 đ** |
| Đã thu (có chứng từ) | **62.976.000 đ** |
| Công nợ | **31.246.842 đ** (13 học viên) |
| Số dư trả trước | 1.810.500 đ (3 học viên) |
| Lương giáo viên | 15.960.000 đ — **toàn bộ đã đánh dấu đã trả** |

**Phần lớn con số 31 triệu công nợ là do chưa nhập thanh toán, không phải phụ
huynh chưa đóng.** Chỉ những khoản sau là công nợ đã được đối chiếu bằng chứng
từ thật:

| Học viên | Công nợ thật | Căn cứ |
|---|---:|---|
| Toàn | 1.000.000 đ | 24 buổi × 250.000 − 2 đợt 2.500.000 |
| Thiên Ái | 280.000 đ | báo cáo PDF kết luận đúng số này |
| Gia đình anh Luyện (Tân + Luân + Ms. Linh) | 7.150.350 đ | kỳ 14/07–30/08 chưa đóng |

Các khoản còn lại (Tuyết, Hoàng, Ngân, Hậu, Vy, Nhi, Công Duy, Kiên, và
4.792.000 đ phần cũ của gia đình anh Luyện) **chưa có chứng từ thanh toán**,
cần Founder cung cấp trước khi coi là nợ thật.

---

## D24 — Bốn buổi ngắn của Tân vẫn tính đủ 60 phút (14/09/2026)

Founder chốt: bốn buổi tháng 7 của Tân chỉ dạy 53–56 phút nhưng **vẫn tính đủ
60 phút**. Founder bỏ qua lần này và sẽ nhắc giáo viên.

Đây là **ngoại lệ có chủ đích cho bốn buổi này**, không huỷ quy tắc D15. Buổi
50 phút ngày 25/09/2025 của **Ms. Tuyết** vẫn đang quy đổi theo D15 (lệch
41.500 đ) — Founder chưa nêu lớp này.

| Buổi | Giờ thật trong sheet | Thực dạy | Tính phí |
|---|---|---:|---:|
| 17/07/2026 | 20:00–20:55 | 55 phút | 60 phút |
| 19/07/2026 | 14:29–15:25 | 56 phút | 60 phút |
| 21/07/2026 | 09:30–10:25 | 55 phút | 60 phút |
| 28/07/2026 | 15:02–15:55 | 53 phút | 60 phút |

### Không thể chỉ sửa `duration_minutes`

Trigger **`tg_lessons_derive`** luôn tính lại cột đó từ giờ dạy thật:

```sql
if new.actual_start_at is not null and new.actual_end_at is not null then
  new.duration_minutes := round(epoch(actual_end_at - actual_start_at) / 60)
```

Lệnh sửa `duration_minutes` bị ghi đè ngay trong cùng câu UPDATE. Phải kéo
`actual_end_at` về đủ 60 phút. **Giờ kết thúc thật đã được ghi vào cột `notes`
của từng buổi** để không mất bằng chứng — sau này cần đối chiếu thời lượng thực
dạy vẫn tra được.

Thiết kế của trigger là đúng: thời lượng phải sinh ra từ giờ dạy thật, không
được gõ tay. Ngoại lệ này là quyết định kinh doanh của Founder, nên ghi lại rõ
thay vì nới lỏng trigger.

### Kỳ 14/07 – 30/08/2026 sau khi chốt — khớp đúng báo cáo

| Học viên | Báo cáo | Hệ thống | |
|---|---|---|---|
| Bùi Thành Luân | 15 buổi · 3.285.000 đ | 14 buổi · 3.066.000 đ | trừ đúng buổi 04/08 Founder chốt không học |
| Bùi Thiên Tân | 15 buổi · 3.285.000 đ | 15 buổi · **3.285.000 đ** | **khớp** |
| Ms. Linh | 4 buổi · 876.000 đ | 4 buổi · **876.000 đ** | **khớp** |
| **Tổng** | 7.446.000 đ | **7.227.000 đ** | = 7.446.000 − 219.000 |

### Số dư gia đình anh Luyện

| Học viên | Buổi | Học phí | Đã đóng | Số dư |
|---|---:|---:|---:|---:|
| Bùi Thiên Tân | 64 | 14.016.000 đ | 8.340.000 đ | **−5.676.000 đ** |
| Bùi Thành Luân | 53 | 11.607.000 đ | 6.140.000 đ | **−5.467.000 đ** |
| Ms. Linh | 4 | 876.000 đ | 0 đ | **−876.000 đ** |
| **Tổng** | | **26.499.000 đ** | **14.480.000 đ** | **−12.019.000 đ** |

Tách làm hai:
- **7.227.000 đ** — kỳ 14/07–30/08/2026 chưa đóng (Founder xác nhận)
- **4.792.000 đ** — phần trước đó thiếu chứng từ chuyển khoản

7.227.000 + 4.792.000 = 12.019.000 đ — khớp.

---

## D25 — Báo cáo đối soát 17/07/2026 giải hết chỗ lệch; khoản "thiếu 4.792.000 đ" là tôi sai

Báo cáo **"Báo cáo lịch sử buổi học và quá trình Luân và Tân"**, chốt dữ liệu
17/07/2026, cho hai thông tin tôi chưa hề có. Vì thiếu chúng nên tôi đã báo sai
rằng gia đình thiếu chứng từ 4.792.000 đ. **Không có khoản thiếu nào.**

### 1. Mười bốn buổi miễn phí

| Học viên | Buổi không thu phí |
|---|---|
| Luân | 11/10/2025 · 28/12/2025 · 03/01/2026 · 04/01/2026 · 10/01/2026 · 11/01/2026 · buổi làm quen cô Sheba 23/05/2026 |
| Tân | 11/10/2025 (đầu vào) · 5 buổi tặng 20/12/2025 · 27/12/2025 · 03/01/2026 · 04/01/2026 · 11/01/2026 · buổi làm quen cô Sheba 24/05/2026 |

### 2. Bốn đợt thanh toán, mỗi đợt 2.200.000 đ

| Học viên | Đợt | Ngày | Số buổi |
|---|---|---|---:|
| Luân | 1 | 22/10/2025 | 10 |
| Luân | 2 | 07/12/2025 | 10 |
| Tân | 1 | tháng 10/2025 | 10 |
| Tân | 2 | 07/12/2025 | 10 |

### Bảng đối soát của báo cáo khớp tuyệt đối

| | Buổi ghi nhận | Đã trả | Miễn phí | Cần đối soát | Thành tiền |
|---|---:|---:|---:|---:|---:|
| Luân | 39 | 20 | 7 | 12 | 2.640.000 đ |
| Tân | 49 | 20 | 7 | 22 | 4.840.000 đ |
| **Tổng** | **88** | **40** | **14** | **34** | **7.480.000 đ** |

7.480.000 đ **đúng bằng** số tiền anh Bùi Luyện chuyển ngày 18/07/2026.

### Hai mức đơn giá theo thời kỳ, không phải mâu thuẫn

Báo cáo 17/07/2026 ghi **220.000 đ**; báo cáo gia đình kỳ 14/07–30/08/2026 ghi
**219.000 đ**. Đây là hai mức giá ở hai thời kỳ, và bảng `tuition_rates` có sẵn
`effective_from`/`effective_to` cho đúng việc này:

- **220.000 đ** — đến 13/07/2026
- **219.000 đ** — từ 14/07/2026

Cả hai đều kiểm chứng được: ở mức 220.000 thì 12 và 22 buổi cần đối soát ra đúng
2.640.000 và 4.840.000; ở mức 219.000 thì kỳ mới ra đúng 3.066.000 và 3.285.000.

### Kết quả sau khi sửa

| Học viên | Buổi | Miễn phí | Tính phí | Học phí đến 13/07 | Đã đóng | Số dư mốc đó |
|---|---:|---:|---:|---:|---:|---:|
| Bùi Thành Luân | 53 | 7 | 46 | 7.040.000 đ | 7.040.000 đ | **0** |
| Bùi Thiên Tân | 64 | 7 | 57 | 9.240.000 đ | 9.240.000 đ | **0** |

**Toàn bộ phần trước 14/07/2026 đã thanh toán đủ đến từng đồng.**

Công nợ thật của gia đình chỉ còn kỳ 14/07–30/08/2026:

| Học viên | Còn nợ |
|---|---:|
| Bùi Thiên Tân | 3.285.000 đ |
| Bùi Thành Luân | 3.066.000 đ |
| Ms. Linh | 876.000 đ |
| **Tổng** | **7.227.000 đ** |

### Còn một câu hỏi chưa trả lời được

Ảnh chuyển khoản **7.000.000 đ ngày 07/10/2025** ("BUI VAN LUYEN chuyen tien",
mã 5280BFTVG2M4H46K) **không khớp với bất kỳ đợt nào** trong báo cáo — đợt 1 của
Luân là 22/10/2025 và của Tân là "tháng 10/2025", mỗi đợt chỉ 2.200.000 đ.

Đã **gỡ khoản này khỏi sổ thu** (trước đó tôi tự chia đôi 3.500.000 đ mỗi bé —
một suy đoán không có căn cứ). Cần Founder cho biết 7.000.000 đ đó là tiền gì.

---

## D26 — Lớp Ms. Tuyết: 57 buổi, không nợ, còn dư 7 buổi (14/09/2026)

**Báo cáo "BÁO CÁO HỌC PHÍ MS. TUYẾT" lập 13/08/2026 cho thấy sheet feedback
thiếu 36 buổi.** Sheet chỉ có 21 buổi; thực tế 57 buổi từ 24/09/2025 đến
30/07/2026. Đã xoá 21 buổi cũ và nhập lại đủ 57 buổi.

Đây là lần thứ hai sheet feedback thiếu buổi so với báo cáo chính thức (lần đầu
là lớp Luân và Tân, D21). **Sheet feedback không phải nguồn đầy đủ.**

### Năm giáo viên nối tiếp nhau

| Giáo viên | Buổi |
|---|---|
| Teacher Allen | 1–2 |
| Ms. Wen | 3–19 |
| Ms. Grace | 20–23 |
| Ms. Rith | 24–42 |
| Teacher Sheba | 43–57 |

Tháng 05/2026 lớp tạm nghỉ. Báo cáo ghi rõ **không có buổi miễn phí nào**.

### Tám gói thanh toán, mỗi gói đúng 8 buổi

| Gói | Ngày | Số tiền | Buổi | Chứng từ |
|---:|---|---:|---|---|
| 1 | 17/09/2025 | 1.992.000 đ | 1–8 | theo báo cáo |
| 2 | 02/11/2025 | 1.992.000 đ | 9–16 | theo báo cáo |
| 3 | 08/12/2025 | 1.992.000 đ | 17–24 | theo báo cáo |
| 4 | 03/02/2026 | 1.992.000 đ | 25–32 | **có ảnh** |
| 5 | 08/04/2026 | 1.992.000 đ | 33–40 | **có ảnh** |
| 6 | 02/07/2026 | 1.992.000 đ | 41–48 | **có ảnh** |
| 7 | 22/07/2026 | 1.992.000 đ | 49–56 | **có ảnh** |
| 8 | 15/08/2026 | 1.992.000 đ | 57→ | **có ảnh** |

1.992.000 ₫ = đúng 8 × 249.000 ₫.

Báo cáo có ghi chú *"Gói 5 (08/04/2026) chưa có ảnh giao dịch gốc — nên bổ sung
để hồ sơ đủ 7/7"*. **Founder đã gửi đúng ảnh đó ngày 14/09/2026** — hồ sơ giờ
đủ chứng từ cho gói 4 đến 8.

### Kết quả — khớp tuyệt đối

| | |
|---|---:|
| 57 buổi × 249.000 | **14.193.000 đ** (báo cáo: 14.193.000 đ) |
| 8 gói × 1.992.000 | **15.936.000 đ** |
| Đã mua | 64 buổi |
| Đã học | 57 buổi |
| **Còn lại** | **7 buổi — dư 1.743.000 đ** |

**Cô Tuyết KHÔNG NỢ.** Báo cáo ghi *"còn phải thu 249.000 đ"* là tính đến ngày
lập 13/08/2026, trước khi cô đóng gói 8 ngày 15/08/2026. Sau khoản đó, cô đang
dư 7 buổi.

Trước đây hệ thống hiển thị cô Tuyết nợ 5.187.492 đ — con số đó sai hoàn toàn
vì thiếu 36 buổi và thiếu cả 8 khoản thanh toán.

---

## D27 — Kiểm tra trùng bill lớp Ms. Tuyết: 3 ảnh mới, 1 ảnh trùng (14/09/2026)

Founder gửi thêm 4 ảnh chuyển khoản, mỗi ảnh 1.992.000 đ.

| Ngày | Mã GD | Người nhận | Kết quả |
|---|---|---|---|
| 17/09/2025 14:25 | 3766 | NGUYEN THANH QUANG · HDBank | **mới** — gói 1 |
| 02/11/2025 09:58 | 3830 | NGUYEN THANH QUANG · HDBank | **mới** — gói 2 |
| 08/12/2025 08:48 | 3878 | NGUYEN THANH QUANG · HDBank | **mới** — gói 3 |
| 03/02/2026 19:09 | 3947 | NGUYEN THANH MY NGOC · OCB | **TRÙNG** — đã gửi lượt trước |

**Không có khoản nào bị ghi trùng trong sổ.** Vẫn đúng 8 gói, 15.936.000 đ.
Ảnh 03/02/2026 đã được ghi từ lượt trước dưới mã TT26090041, mã tham chiếu
`6034ASCBJ28SBV7E` — trùng khít với ảnh vừa gửi, nên nhận ra ngay.

Ba ảnh mới **bổ sung đúng ba gói mà báo cáo ghi "chưa có ảnh gốc"**. Hồ sơ lớp
Ms. Tuyết giờ **đủ chứng từ cho cả 8/8 gói**.

### Điểm cần Founder xác nhận

Ba gói đầu chuyển vào tài khoản **NGUYEN THANH QUANG — HDBank 0902582499**,
không phải tài khoản trung tâm **NGUYEN THANH MY NGOC — OCB**. Báo cáo có ghi
nhận việc đổi ngân hàng (*"HDBank (gói 1–3) / OCB (gói 4–7)"*) nên khớp về ngân
hàng, nhưng **tên người nhận khác**. Đã đánh `needs_review` cho ba dòng này.
