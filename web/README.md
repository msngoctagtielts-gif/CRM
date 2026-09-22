# Website công khai — Ms.Ngọc Elite English

Nơi người chưa biết trung tâm tìm hiểu và để lại thông tin. Đây là website
**thứ ba** của hệ thống, và là website duy nhất cho người chưa đăng nhập vào.

| Website | Thư mục | Ai dùng | Lập chỉ mục |
|---|---|---|---|
| Hệ quản trị | `src/` | Founder, giáo viên | Không |
| Cổng học viên | `portal/` | Phụ huynh, học viên (có đăng nhập) | Không |
| **Công khai** | `web/` | **Người lạ** | **Có** |

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

## Triển khai

Netlify site riêng, **Base directory = `web`**. Cấu hình ở `netlify.toml`.

Ba site dùng chung hạn mức 300 credit/tháng của gói Free, mỗi deploy production
tốn 15 credit. `should-skip-build.sh` bỏ qua build khi thư mục `web/` không đổi.

Khác hai site kia ở một chỗ: site này **không** đặt `X-Robots-Tag: noindex`.
Nó cần được tìm thấy — đó là toàn bộ lý do nó tồn tại.
