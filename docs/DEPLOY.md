# Đưa hệ thống lên mạng — 0 đồng/tháng

Toàn bộ hệ thống chạy thật mà không phát sinh chi phí nào:

| Thành phần | Dịch vụ | Chi phí | Vì sao chọn |
|---|---|---|---|
| Ứng dụng web | **Netlify Free** | 0 ₫ | Gói free **cho phép dùng thương mại** |
| Cơ sở dữ liệu + đăng nhập | **Supabase Free** | 0 ₫ | Có PostgreSQL thật, RLS thật, Auth thật |
| AI viết nhận xét | **Google Gemini** gói free | 0 ₫ | Cấp khoá không cần thẻ |
| Chạy định kỳ + sao lưu | **GitHub Actions** | 0 ₫ | 2.000 phút/tháng, dùng vài phút |

---

## 1. Vì sao Netlify, không phải Vercel hay Cloudflare

**Vercel Hobby — không được dùng.** Điều khoản của Vercel giới hạn gói Hobby cho
*"personal or non-commercial use"*, và định nghĩa "thương mại" bao gồm cả dự án
thuộc một pháp nhân kinh doanh. Trung tâm có thu học phí, nên đây là dùng thương
mại. Vercel ghi rõ họ **có quyền tắt project không cần báo trước**. Không đáng
đánh cược hệ thống vận hành của trung tâm vào đó.

**Cloudflare Workers — tốt nhưng không miễn phí cho việc này.** Gói free giới hạn
**10ms CPU mỗi request**. Render một trang Next.js thường tốn 10–20ms trở lên,
nên sẽ đổ lỗi 1102. Cần Workers Paid (~5 USD/tháng, 30 giây CPU). Đây là lựa
chọn tốt **khi nào** chấp nhận trả tiền — vẫn rẻ hơn Supabase Pro nhiều.

**Netlify Free — được.** Netlify nói rõ gói Free dùng được cho *"commercial
projects"*. Hạn mức: 125.000 lượt gọi function và 1 triệu lượt edge function mỗi
tháng. Trung tâm có vài người dùng nên còn rất xa.

---

## 1b. Vì sao website công khai lại ở Cloudflare (22/09/2026)

Mục 1 loại Cloudflare cho **cả ba** site. Kết luận đó vẫn đúng cho hệ quản trị
và cổng học viên, nhưng **sai cho website công khai** — và đây là chỗ sửa.

### Điều mục 1 chưa tính tới

**Giới hạn 10ms là thời gian CPU, không phải thời gian chờ.** Chờ mạng — gọi
Supabase, đợi cơ sở dữ liệu trả lời — không tính vào CPU. Thứ đốt CPU là render
React phía máy chủ.

Đã kiểm lại con số 10ms trên trang giá của Cloudflare ngày 22/09/2026: **vẫn
nguyên**, không phải thông tin cũ.

### Vì sao ba site khác nhau

| Site | Bản chất | Kết luận |
|---|---|---|
| Hệ quản trị `src/` | Mọi route đều render động, middleware chạy mọi request, mỗi trang đều truy vấn và dựng bảng số liệu | Giữ Netlify |
| Cổng học viên `portal/` | Có đăng nhập, render động | Giữ Netlify |
| Website công khai `web/` | 12/13 route dựng sẵn lúc build; route động duy nhất render vài dòng chữ; biểu mẫu đăng ký gần như chỉ ngồi chờ Supabase | **Cloudflare** |

### Một chỗ cần nói cho đúng

Lúc đầu tôi nói "12/13 route sẽ được phục vụ thẳng từ tầng asset, không gọi
Worker". **Kiểm lại thì không đúng.** Dựng thử bằng OpenNext rồi xem thư mục
`.open-next/assets` thì thấy tầng asset chỉ chứa `_next/static/*` và các tệp
trong `public/` — tức JavaScript, CSS và tệp tĩnh. **Mỗi trang HTML vẫn đi qua
Worker.**

Điều đó không lật ngược kết luận, nhưng làm nó yếu hơn một bậc:

- Trang dựng sẵn thì Worker chỉ **đọc lại HTML có sẵn trong gói** rồi trả về,
  không render lại React. Rẻ — nhưng là *rẻ*, không phải *bằng không*.
- Còn hệ quản trị thì mỗi request đều là render thật cộng truy vấn, nên lý do
  loại nó vẫn nguyên giá trị.

**Chưa chứng minh được bằng số đo thật** là mỗi request nằm dưới 10ms CPU — chỉ
đo được sau khi deploy, trong bảng Observability của Cloudflare (đã bật sẵn
trong `wrangler.jsonc`). Nếu gặp lỗi 1102 thì có hai đường lui, theo thứ tự:

1. Workers Paid ~5 USD/tháng, nâng lên 30 giây CPU.
2. Chuyển `web/` sang xuất tĩnh hoàn toàn, để trình duyệt gọi thẳng hàm
   `dang_ky_tu_van` bằng khoá anon — khoá đó vốn công khai và `anon` không đọc
   được bảng nào. Khi ấy trang không còn gọi Worker nữa. Đổi lại phải bỏ phần
   băm IP phía máy chủ, tức mất chặn spam theo IP; bù bằng Cloudflare Turnstile.

### Cái được

Vấn đề thật mà việc này giải quyết: **thêm site thứ ba làm 300 credit/tháng của
Netlify căng hẳn lên.** Ba site chia nhau, mỗi deploy 15 credit, mà website công
khai lại là site sẽ sửa nhiều nhất — mỗi bài viết mới là một lần deploy — và là
site duy nhất có lưu lượng từ người lạ.

Tách nó ra trả lại gần như toàn bộ hạn mức cho hai site vận hành thật, và băng
thông của người lạ không còn ăn vào credit của hệ quản trị nữa.

### Đã kiểm được đến đâu

Chạy thật tại máy bằng `npm run preview`, tức chạy trên **workerd** — đúng
runtime của Cloudflare, không phải Node:

| Kiểm | Kết quả |
|---|---|
| Sáu route trả về nội dung thật | ✅ tất cả 200, tiếng Việt hiển thị đúng |
| Header bảo mật trên trang Worker render | ✅ đủ bốn header |
| Header bảo mật trên tệp tĩnh | ✅ `_headers` được nạp |
| `wrangler deploy --dry-run` | ✅ cấu hình hợp lệ |
| Kích thước Worker sau nén | ✅ 961 KB / giới hạn 3 MB |

Chưa kiểm được: CPU mỗi request, và luồng gửi biểu mẫu tới Supabase thật (lúc
chạy thử dùng khoá giả).

---

## 2. Cạm bẫy của gói Free Netlify — và cách đã xử lý

Gói Free có **hạn mức cứng 300 credit/tháng**. Hết credit thì **site tạm dừng tới
tháng sau**. Mỗi lần deploy production tốn **15 credit**, dùng chung pool với băng
thông (20 credit/GB).

Tức là khoảng **20 lần deploy/tháng**, và mỗi lần deploy ăn mất phần băng thông.
Sửa một dòng trong README mà cũng build lại là đốt credit vô ích.

**Đã xử lý:** `netlify/should-skip-build.sh` chỉ cho build khi có thay đổi thật
sự ảnh hưởng tới app (`src/`, `public/`, `package.json`, `next.config.ts`,
`tsconfig.json`, `postcss.config.mjs`, `netlify.toml`). Sửa tài liệu, migration
SQL hay script sao lưu thì **bỏ qua build**, không tốn credit.

Đã kiểm 7 tình huống, tất cả đúng:

| Thay đổi | Kỳ vọng | Kết quả |
|---|---|---|
| Chỉ sửa tài liệu | bỏ qua | ✅ |
| Chỉ sửa migration SQL | bỏ qua | ✅ |
| Sửa `src/` | build | ✅ |
| Sửa `package.json` | build | ✅ |
| Vừa sửa tài liệu vừa sửa mã | build | ✅ |
| Lần build đầu | build | ✅ |
| Không có commit mới | bỏ qua | ✅ |

Ngoài ra `netlify.toml` **tắt deploy xem trước và deploy nhánh** — mỗi nhánh đẩy
lên mà cũng deploy thì hết credit rất nhanh.

> **Thói quen cần giữ:** gom thay đổi rồi deploy một lượt. Đừng sửa một chữ rồi
> deploy, sửa chữ nữa rồi deploy.

---

## 3. TRẠNG THÁI HIỆN TẠI — đã làm xong tới đâu (11/09/2026)

Project trên Netlify đã được tạo và cấu hình sẵn qua Netlify MCP:

| Hạng mục | Trạng thái |
|---|---|
| Project | ✅ `mnee-management` · team `ms-ngocenliteenglish` (gói Free) |
| Địa chỉ site | `https://mnee-management.netlify.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ đã đặt |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ đã đặt |
| `NEXT_PUBLIC_TIMEZONE` | ✅ `Asia/Ho_Chi_Minh` |
| `CRON_SECRET` | ✅ đã đặt (sinh ngẫu nhiên 256 bit) |
| Bắt buộc đăng nhập SSO Netlify | ✅ **đã tắt** cho project này |
| `netlify.toml` | ✅ có trong repo, Netlify tự đọc |
| **Nối repo GitHub** | ⬜ **còn việc này** |

> Hai project cũ của cô (`singular-kataifi-b40bf9`, `mnee-teacher-library-9f4t`)
> **không bị ảnh hưởng** — đã kiểm lại sau khi đổi access control.

### Vì sao phần nối repo phải do cô bấm

Netlify MCP có đủ quyền tạo project và đặt biến môi trường, nhưng **không có
operation nối repo GitHub** — việc đó cần uỷ quyền GitHub App qua trình duyệt.
Tôi cũng đã thử đường tải mã nguồn trực tiếp lên Netlify, nhưng môi trường phát
triển này **chặn toàn bộ host của Netlify** ở tầng proxy:

```
netlify-mcp.netlify.app:443 → gateway answered 403 to CONNECT (policy denial)
api.netlify.com:443         → gateway answered 403 to CONNECT (policy denial)
```

### Ba bước còn lại của cô

1. Mở <https://app.netlify.com/projects/mnee-management/configuration/deploys>
2. Bấm **Link repository** → chọn **GitHub** → repo `msngoctagtielts-gif/CRM`
   (nếu Netlify xin quyền truy cập repo, bấm đồng ý)
3. Bấm **Deploy**

Không cần chọn nhánh: nhánh mặc định của repo đã đúng là
`claude/mnee-system-architecture-oxsrc4`. Không cần điền build command hay publish
directory: `netlify.toml` đã khai sẵn.

### Hai biến còn thiếu — app vẫn chạy, chỉ thiếu 2 tính năng

| Biến | Thiếu thì sao | Lấy ở đâu |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Nút "Quét lại ngay" ở trang Cảnh báo và route cron báo lỗi. Mọi phần khác chạy bình thường | Supabase → Project Settings → API → `service_role`. Tôi **không lấy được** khoá này: Supabase MCP chỉ cấp khoá công khai |
| `GOOGLE_AI_API_KEY` | Nút "AI viết nháp" hiện hướng dẫn thay vì chạy | Google AI Studio. Tôi **cố ý không đặt** khoá cũ vì nó đã lộ trong khung chat — tạo khoá mới rồi đặt |

### Sau khi deploy xong

1. Vào Supabase → **Authentication → URL Configuration**, đặt **Site URL** =
   `https://mnee-management.netlify.app`. Chưa đặt thì link đặt lại mật khẩu và
   xác nhận email sẽ trỏ về localhost. Không chặn việc đăng nhập thường.
2. Thêm secret vào GitHub cho job quét cảnh báo hằng ngày:
   `APP_URL` = `https://mnee-management.netlify.app`,
   `CRON_SECRET` = đúng giá trị đã đặt ở Netlify (xem trong Netlify →
   Project configuration → Environment variables)

---

## 4. Các bước triển khai (tham khảo — trường hợp dựng lại từ đầu)

### 4.1 Nối repo với Netlify

1. Đăng ký <https://app.netlify.com> bằng tài khoản GitHub
2. **Add new site → Import an existing project → GitHub** → chọn repo `CRM`
3. Netlify tự đọc `netlify.toml`, không cần điền gì thêm
4. Nhánh production: chọn nhánh đang dùng

### 4.2 Đặt biến môi trường

**Site configuration → Environment variables**:

| Biến | Bắt buộc | Lấy ở đâu |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | cùng trang, khoá `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | cùng trang, khoá `service_role` |
| `CRON_SECRET` | ✅ | tự đặt một chuỗi dài ngẫu nhiên |
| `GOOGLE_AI_API_KEY` | ⬜ | Google AI Studio, xem `docs/AI_SETUP.md` |
| `GOOGLE_AI_MODEL` | ⬜ | mặc định `gemini-3.6-flash` |

> ⚠ `SUPABASE_SERVICE_ROLE_KEY` bỏ qua toàn bộ RLS. **Không bao giờ** đặt tiền tố
> `NEXT_PUBLIC_` cho nó — biến có tiền tố đó bị nhúng thẳng vào JavaScript gửi
> xuống trình duyệt, tức là công khai chìa khoá vạn năng của cả cơ sở dữ liệu.

### 4.3 Sau khi deploy xong

1. Lấy địa chỉ site (dạng `https://<tên>.netlify.app`)
2. Vào Supabase → **Authentication → URL Configuration**, đặt **Site URL** là địa
   chỉ đó, nếu không link xác nhận email và đặt lại mật khẩu sẽ trỏ về localhost
3. Thêm hai secret vào GitHub để job quét cảnh báo hằng ngày chạy được:
   `APP_URL` = địa chỉ site, `CRON_SECRET` = đúng giá trị đã đặt ở Netlify

---

## 5. Đã kiểm được đến đâu

Chạy `netlify build` thật ngay trong môi trường phát triển:

```
✓ Next.js build          — 19 route, xong sau 33,7 giây
✓ Functions bundling     — ___netlify-server-handler đóng gói xong
✗ Edge Functions bundling — lỗi 403 khi tải Deno
```

Bước cuối hỏng vì **sandbox phát triển chặn `deno.land`** (đã xác nhận:
`CONNECT tunnel failed, response 403`), không phải lỗi cấu hình. Máy build của
Netlify tải Deno bình thường.

**Chưa kiểm được** vì cần tài khoản Netlify thật: lần deploy đầu tiên, và
`src/middleware.ts` chạy dưới dạng Edge Function trên Deno.

---

## 6. Khi nào cần trả tiền

Không phải bây giờ. Cân nhắc khi có **một** trong các dấu hiệu:

| Dấu hiệu | Chuyển sang | Giá |
|---|---|---|
| Hết credit Netlify giữa tháng nhiều lần | Cloudflare Workers Paid cho hệ quản trị | ~5 USD/th |
| Website công khai đổ lỗi 1102 (quá 10ms CPU) | Workers Paid, hoặc xuất tĩnh — xem mục 1b | ~5 USD/th hoặc 0 |
| Cần khôi phục dữ liệu về một thời điểm bất kỳ | Supabase Pro + PITR | 25 USD/th |
| AI vượt hạn mức miễn phí | Gemini trả phí | theo lượt dùng |

Xem thêm `docs/FREE_TIER.md` về gói Free của Supabase và rủi ro còn lại.
