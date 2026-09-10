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

## 3. Các bước triển khai

### 3.1 Nối repo với Netlify

1. Đăng ký <https://app.netlify.com> bằng tài khoản GitHub
2. **Add new site → Import an existing project → GitHub** → chọn repo `CRM`
3. Netlify tự đọc `netlify.toml`, không cần điền gì thêm
4. Nhánh production: chọn nhánh đang dùng

### 3.2 Đặt biến môi trường

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

### 3.3 Sau khi deploy xong

1. Lấy địa chỉ site (dạng `https://<tên>.netlify.app`)
2. Vào Supabase → **Authentication → URL Configuration**, đặt **Site URL** là địa
   chỉ đó, nếu không link xác nhận email và đặt lại mật khẩu sẽ trỏ về localhost
3. Thêm hai secret vào GitHub để job quét cảnh báo hằng ngày chạy được:
   `APP_URL` = địa chỉ site, `CRON_SECRET` = đúng giá trị đã đặt ở Netlify

---

## 4. Đã kiểm được đến đâu

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

## 5. Khi nào cần trả tiền

Không phải bây giờ. Cân nhắc khi có **một** trong các dấu hiệu:

| Dấu hiệu | Chuyển sang | Giá |
|---|---|---|
| Hết credit Netlify giữa tháng nhiều lần | Cloudflare Workers Paid | ~5 USD/th |
| Cần khôi phục dữ liệu về một thời điểm bất kỳ | Supabase Pro + PITR | 25 USD/th |
| AI vượt hạn mức miễn phí | Gemini trả phí | theo lượt dùng |

Xem thêm `docs/FREE_TIER.md` về gói Free của Supabase và rủi ro còn lại.
