# Website công khai — Ms.Ngọc Elite English

Nơi người chưa biết trung tâm tìm hiểu và để lại thông tin. Đây là website
**thứ ba** của hệ thống, và là website duy nhất cho người chưa đăng nhập vào.

| Website | Thư mục | Ai dùng | Lập chỉ mục | Chạy ở đâu |
|---|---|---|---|---|
| Hệ quản trị | `src/` | Founder, giáo viên | Không | Netlify |
| Cổng học viên | `portal/` | Phụ huynh, học viên (có đăng nhập) | Không | Netlify |
| **Công khai** | `web/` | **Người lạ** | **Có** | **Cloudflare Workers** |

Ba bản build riêng, ba tên miền riêng, không bên nào import mã của bên nào.
Chung duy nhất cơ sở dữ liệu Supabase.

---

## Nó làm được gì với cơ sở dữ liệu

Đúng **một** việc: gọi hàm `dang_ky_tu_van`.

Vai `anon` đã bị migration `0011_rls.sql` thu hồi quyền trên mọi bảng, và
`0052` không mở lại. Hàm `dang_ky_tu_van` chạy `security definer` và tự quyết
`status`, `source`, `lead_code` — người gọi không đặt được các cột đó kể cả khi
tự dựng request ngoài trình duyệt.

Nghĩa là khoá anon key nằm trong mã trình duyệt cũng không đọc được một dòng dữ
liệu nào của trung tâm.

---

## Các trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Định vị, bốn trụ nội dung, bài viết nổi bật, mục video (tự ẩn khi chưa có video) |
| `/thau-hieu` | Bài tự đánh giá 8 câu → chân dung người học → biểu mẫu đăng ký |
| `/kien-thuc` · `/kien-thuc/[slug]` | Thư viện bài viết |
| `/dang-ky` | Đăng ký tư vấn trực tiếp |
| `/cam-on` | Sau khi gửi — hiện mã đăng ký |

---

## Chạy trên máy

```bash
cd web
npm install
cp .env.example .env.local     # rồi điền hai biến Supabase
npm run dev                    # http://localhost:3002
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy ở cổng 3002 (hệ quản trị 3000, cổng học viên 3001) |
| `npm run build` | Dựng bản production |
| `npm run typecheck` | Kiểm kiểu |
| `npm run test:unit` | Kiểm thử cách chấm bài tự đánh giá |

---

## Sửa nội dung

Nội dung nằm trong mã nguồn, không nằm trong cơ sở dữ liệu — để mỗi thay đổi
đi qua Git, có lịch sử và có bước xem lại.

| Sửa gì | Sửa ở đâu |
|---|---|
| Thêm bài viết | `src/noi-dung/bai-viet.ts` |
| Sửa sáu chân dung người học | `src/noi-dung/chan-dung.ts` |
| Sửa câu hỏi, cách chấm | `src/noi-dung/bai-tu-danh-gia.ts` — **chạy lại `npm run test:unit`** |
| Thêm video đã đăng | `src/noi-dung/video.ts` — mục Video trên trang chủ tự hiện ra |

Sáu mã chân dung (`ngai_noi`, `so_sai`, `ban_ron`, `mat_goc`, `ielts_gap`,
`phu_huynh`) được chép lại trong màn hình `/tuyen-sinh` của hệ quản trị. Đổi mã
thì sửa cả hai nơi.

Luật viết bài nằm ngay đầu `src/noi-dung/bai-viet.ts`, và lý do của từng luật
nằm ở `docs/KENH_THU_HUT_HOC_VIEN.md` mục 9.

---

## Triển khai — Cloudflare Workers

Site này chạy trên **Cloudflare Workers** qua adapter OpenNext, trong khi hệ
quản trị và cổng học viên vẫn ở Netlify. Lý do tách ra nằm ở
`docs/DEPLOY.md` mục 1b.

| Lệnh | Tác dụng |
|---|---|
| `npm run cf-build` | Build rồi đóng gói thành Worker vào `.open-next/` |
| `npm run preview` | Build rồi chạy thử bằng chính runtime của Cloudflare (cổng 8788) |
| `npm run deploy` | Build rồi đẩy lên Cloudflare |

`npm run preview` đáng chạy trước mỗi lần deploy: nó chạy trên **workerd**, đúng
runtime thật, chứ không phải Node. Có những thứ qua được `npm run build` nhưng
hỏng ở workerd, và `preview` bắt được.

### Ba việc phải làm một lần trên Cloudflare

1. `npx wrangler login` để nối máy với tài khoản.
2. Đặt biến trong **Workers & Pages → mnee-web → Settings → Variables and
   Secrets**: hai biến `NEXT_PUBLIC_` kiểu Text, `DANG_KY_SALT` kiểu Secret.
3. Nối tên miền trong **Settings → Domains & Routes**.

### Thay cho `should-skip-build.sh`

Netlify tính credit theo lượt deploy nên site này từng có một script chặn build
khi không có gì đổi. Cloudflare không gộp deploy với băng thông vào một túi
credit, nên script đó đã bỏ. Nếu nối Cloudflare thẳng với GitHub để tự động
deploy, dùng **Build watch paths** trong cấu hình build và đặt `web/` — cùng
tác dụng, không cần script.

### Hai giới hạn cần biết của gói Free

| Giới hạn | Mức | Chỗ đứng hiện tại |
|---|---|---|
| Kích thước Worker sau khi nén | 3 MB | **961 KB** — còn rất nhiều chỗ |
| CPU mỗi request | 10 ms | Xem mục 1b của `docs/DEPLOY.md` |

Request tới `/_next/static/*` và các tệp trong `public/` được phục vụ từ tầng
asset, **miễn phí và không giới hạn**, không gọi Worker. Còn mỗi trang HTML
thì vẫn đi qua Worker — trang dựng sẵn chỉ đọc lại HTML có sẵn trong gói, không
render lại React, nên rẻ. Nhưng đó là *rẻ*, không phải *bằng không*.

### File cấu hình

| File | Làm gì |
|---|---|
| `wrangler.jsonc` | Tên Worker, compatibility flags, thư mục asset |
| `open-next.config.ts` | Cố ý để trống — giải thích lý do ngay trong file |
| `public/_headers` | Header bảo mật cho tệp tĩnh |
| `next.config.ts` | Header bảo mật cho phần Worker render |

Header phải khai ở cả hai nơi vì tầng asset không chạy qua Worker. Trùng lặp là
có chủ đích, đã ghi chú trong cả hai file.
