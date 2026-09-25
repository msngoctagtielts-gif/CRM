# Kế hoạch xây dựng hai website

> Bản này do `web-planner` giữ. Mỗi lần `web-auditor` soi lại trang đang chạy,
> `web-planner` cập nhật bản này chứ không viết lại từ đầu.

---

## Trạng thái hiện tại — đọc trước

Hai điều chưa xác định được từ phiên làm việc này, và cả hai chặn phần lớn công việc:

**1. Mã nguồn hai trang nằm ở đâu.**
Các kho mã hiện có của tài khoản (`CRM`, `blog_cms`, `blog_cm`, `classroom`,
`Speaknow1`, `speaking-practice-site`, `a1-speaking-practice`,
`msngoc-kidsbox-assets`, `kidbox-lesson-plans-new-generation`) **không kho nào chứa
mã của `msngoc-elite-english.pages.dev` hay `msngoc-folio.pages.dev`**. Nhiều khả
năng hai dự án Cloudflare Pages này được tải lên trực tiếp (*Direct Upload*) thay vì
nối với kho mã. Cần xác nhận trong Cloudflare Dashboard → Workers & Pages → chọn dự
án → Settings → Builds & deployments.

**2. Chưa soi được nội dung trang đang chạy.**
Môi trường phiên này chặn truy cập ra `*.pages.dev`, nên chưa có báo cáo lỗi thật.
Cách gỡ, chọn một:
- Chạy công cụ soi trên máy cô Ngọc (xem `scripts/web-audit/README.md`)
- Hoặc mở trang, `Ctrl+S` lưu về tệp `.html`, đưa tệp đó vào phiên làm việc

Tới khi có hai thứ trên, phần "Việc theo giai đoạn" dưới đây là khung chuẩn, còn
danh sách lỗi cụ thể thì chưa điền được.

---

## Sơ đồ trang

### `msngoc-elite-english.pages.dev` — trang trung tâm

| Trang | Trả lời câu hỏi nào của người đọc | Hành động chính |
|---|---|---|
| Trang chủ | "Nơi này dạy ai, dạy gì, có đáng tin không?" | Nhắn Zalo / để lại số |
| Khoá học & lộ trình | "Con tôi / tôi sẽ học gì, đi tới đâu?" | Xem chi tiết một lộ trình |
| Về Ms.Ngọc & giáo viên | "Ai đứng lớp, có bằng cấp gì?" | Đọc hồ sơ đầy đủ |
| Học phí | "Hết bao nhiêu tiền?" | Đăng ký học thử |
| Cảm nhận & kết quả | "Ai đã học, kết quả ra sao?" | Nhắn Zalo |
| Học thử | "Thử trước được không?" | Gửi biểu mẫu |
| Liên hệ | "Gọi ai, ở đâu, giờ nào?" | Gọi / nhắn |

Mỗi trang **đúng một** hành động chính. Nút phụ không được to bằng nút chính.

### `msngoc-folio.pages.dev` — hồ sơ cá nhân

| Trang | Trả lời câu hỏi nào | Hành động chính |
|---|---|---|
| Trang chủ | "Người này là ai, làm được gì?" | Xem hồ sơ / liên hệ hợp tác |
| Kinh nghiệm & bằng cấp | "Có thật sự đủ trình độ không?" | Tải CV |
| Sản phẩm giảng dạy | "Chất lượng công việc thế nào?" | Xem ví dụ thật |
| Liên hệ | "Làm việc cùng bằng cách nào?" | Email / LinkedIn |

Trang hồ sơ cá nhân **không bán khoá học**. Nó bảo chứng cho trang trung tâm. Hai
trang liên kết chéo một lần ở chân trang, không nhồi.

---

## Việc theo giai đoạn

Xếp theo **tiền và niềm tin**, không theo độ vui khi làm.

### Giai đoạn 0 — Gỡ hai chỗ chặn *(cô Ngọc làm, không phải AI)*

- [ ] Xác định mã nguồn hai trang nằm ở đâu
- [ ] Nối dự án Cloudflare Pages với một kho mã GitHub, để từ đó sửa được bằng mã
- [ ] Đưa nội dung trang hiện tại vào được phiên làm việc

**Xong khi:** `web-auditor` chạy được công cụ soi và ra báo cáo thật.

### Giai đoạn 1 — Trang không được hỏng

| Việc | Giao cho | Xong khi |
|---|---|---|
| Soi toàn diện hai trang | `web-auditor` | Có báo cáo xếp hạng theo thiệt hại |
| Sửa mọi lỗi mức "mất học viên ngay" | `web-builder` | `audit.mjs` thoát mã 0 |
| Kiểm trên điện thoại thật | `web-qa` | Khổ 360px không cuộn ngang, không tràn chữ |
| Bảo đảm có đường liên hệ ở đầu và chân mọi trang | `web-builder` | Tìm được cách liên hệ trong 10 giây |

### Giai đoạn 2 — Bằng chứng uy tín

| Việc | Giao cho | Xong khi |
|---|---|---|
| Thu thập bằng chứng theo `UY-TIN.md` | cô Ngọc + `web-copywriter` | Đủ bốn nhóm bằng chứng, có nguồn |
| Viết trang Về Ms.Ngọc và trang Giáo viên | `web-copywriter` | Không còn `[CẦN SỐ THẬT]` |
| Thiết kế khối cảm nhận và khối lộ trình | `web-designer` | Có đặc tả đủ trạng thái |
| Công khai học phí | `web-copywriter` + cô Ngọc | Có bảng giá hoặc khoảng giá rõ ràng |
| Rà lời hứa quá mức | `web-copywriter` | `audit.mjs` không báo luật `hua-qua-muc` |

### Giai đoạn 3 — Để người lạ tìm thấy

| Việc | Giao cho | Xong khi |
|---|---|---|
| Tiêu đề, mô tả, canonical cho mọi trang | `web-builder` | Không còn luật `title` / `mo-ta` nào báo |
| Dữ liệu có cấu trúc | `web-builder` | `EducationalOrganization` và `Person` hợp lệ |
| Thẻ chia sẻ + ảnh 1200×630 | `web-designer` + `web-builder` | Dán link vào Zalo hiện đúng ảnh và tiêu đề |
| `robots.txt` và `sitemap.xml` | `web-builder` | Truy cập được, liệt kê đủ trang |
| Nội dung mỗi trang đủ dày | `web-copywriter` | Không còn luật `do-day-noi-dung` |

### Giai đoạn 4 — Trau chuốt

| Việc | Giao cho | Xong khi |
|---|---|---|
| Hệ thống thị giác thống nhất hai trang | `web-designer` | Cùng thang chữ, cùng bảng màu |
| Tốc độ tải | `web-builder` | Trang đọc được trong 5 giây trên 3G |
| Khả năng tiếp cận | `web-builder` + `web-qa` | Đi hết trang bằng phím Tab, tương phản ≥ 4.5:1 |

---

## Tiêu chí "xong" của cả dự án

Không phải "trông đẹp hơn". Là sáu dòng dưới, kiểm chứng được từng dòng:

1. `node scripts/web-audit/audit.mjs <cả hai trang>` thoát mã 0
2. Trên điện thoại khổ 360px, tìm được cách liên hệ trong 10 giây
3. Bốn thứ phụ huynh cần (người dạy, lộ trình, bằng chứng, học phí) đều có trên trang
4. Mọi con số về kết quả học tập truy được về nguồn
5. Dán link vào Zalo hiện đúng ảnh và tiêu đề
6. `web-qa` ký duyệt — không phải `web-builder` tự nói xong

---

## Chưa quyết — cần cô Ngọc trả lời

1. **Học phí có công khai trên trang không?** Giấu giá làm người đọc mặc định là đắt
   và mập mờ; công khai thì lọc được người không đúng phân khúc. Nếu ngại, đăng
   khoảng giá theo lộ trình thay vì giá từng buổi.
2. **Có được dùng tên thật của học viên trong phần cảm nhận không?** Cảm nhận ẩn danh
   gần như không có giá trị thuyết phục. Cần xin phép bằng văn bản từng người.
3. **Hai trang có dùng chung hệ nhận diện không?** Khuyến nghị: có. Dùng chung
   navy / gold / trắng / burgundy làm hai trang bảo chứng lẫn nhau.
4. **Ngôn ngữ trang hồ sơ cá nhân?** Nếu nhắm đối tác quốc tế thì cần bản tiếng Anh,
   và đó là một khối việc riêng chưa nằm trong kế hoạch này.
