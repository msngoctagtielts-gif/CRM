# Bằng chứng uy tín — thu thập cái gì, và cấm nói cái gì

> Người giữ tài liệu này: `web-copywriter`.
> `web-auditor` đối chiếu trang đang chạy với danh mục này ở tầng 2.

Uy tín trên website không đến từ tính từ. Nó đến từ **những thứ kiểm chứng được**.
Câu "chất lượng hàng đầu" ai cũng viết được nên không ai tin. Câu "mỗi buổi học có
báo cáo gửi phụ huynh trong vòng 10 giờ" thì kiểm được, nên đáng giá gấp nhiều lần.

---

## Bốn thứ phụ huynh tìm trước khi nhắn tin

Thiếu thứ nào là họ đi hỏi nơi khác — và thường không quay lại.

### 1. Người dạy là ai

| Cần thu thập | Trạng thái |
|---|---|
| Ảnh chân dung thật, đủ sáng, không phải ảnh kho | [ ] |
| Bằng cấp: tên bằng, nơi cấp, năm cấp | [ ] |
| Chứng chỉ giảng dạy (TESOL / CELTA / TKT…) — ảnh chụp chứng chỉ | [ ] |
| Số năm dạy và đối tượng đã dạy | [ ] |
| Một đoạn video ngắn cô Ngọc nói tiếng Anh | [ ] |

Đoạn video là bằng chứng mạnh nhất trong bảng này. Với một trung tâm dạy giao tiếp,
không có gì thuyết phục bằng việc nghe chính người dạy nói.

### 2. Học cái gì, đi tới đâu

| Cần thu thập | Trạng thái |
|---|---|
| Tên giáo trình đang dùng (Speak Now, Kid's Box…) | [ ] |
| Lộ trình từng cấp độ, quy chiếu về khung CEFR | [ ] |
| Chuẩn đầu ra mỗi cấp — mô tả bằng việc học viên **làm được** | [ ] |
| Ảnh chụp một giáo án thật | [ ] |
| Ảnh chụp một báo cáo buổi học gửi phụ huynh | [ ] |

Chuẩn đầu ra viết bằng hành động, không viết bằng cảm giác.
Không viết "nói tốt hơn". Viết "tự đặt được câu hỏi và hỏi lại trong hội thoại đặt
món ăn, không cần nhắc".

### 3. Ai đã học, kết quả ra sao

| Cần thu thập | Trạng thái |
|---|---|
| 5–8 cảm nhận có **tên thật**, tuổi hoặc nghề, và bối cảnh | [ ] |
| Văn bản xin phép của từng người được trích | [ ] |
| 2–3 hồ sơ theo dõi tiến bộ (trước → sau, có mốc thời gian) | [ ] |
| Ảnh hoặc video lớp học thật, có xin phép | [ ] |
| Số liệu tổng hợp lấy từ hệ thống quản lý MNEE | [ ] |

**Cảm nhận ẩn danh gần như vô giá trị.** "Chị H., phụ huynh" là câu ai cũng bịa được.
"Chị Hương, mẹ bé Minh 8 tuổi, học từ tháng 3/2026" thì có thể đối chiếu.

Số liệu tổng hợp phải truy được về hệ thống quản lý. Ví dụ đúng cách:
> "Trong 12 tháng gần nhất, 94% buổi học có báo cáo nộp đúng hạn 10 giờ —
> số liệu từ hệ thống quản lý nội bộ, tính đến 09/2026."

Ví dụ sai cách: *"Hầu hết học viên tiến bộ rõ rệt."*

### 4. Hết bao nhiêu tiền

| Cần thu thập | Trạng thái |
|---|---|
| Học phí theo lộ trình, hoặc ít nhất một khoảng giá | [ ] |
| Cái gì đã bao gồm trong học phí | [ ] |
| Chính sách nghỉ buổi, bảo lưu, hoàn phí | [ ] |
| Có học thử không, mất phí không | [ ] |

Giấu giá không giữ được người đọc — nó chỉ chuyển họ sang trung tâm có công khai.
Nếu không muốn đăng giá từng buổi, đăng khoảng giá theo lộ trình.

---

## Tín hiệu uy tín ở tầng kỹ thuật

Những thứ này người đọc không nói ra, nhưng cảm được:

- [ ] HTTPS, không có cảnh báo "không an toàn"
- [ ] Có favicon — tab trình duyệt không logo trông như trang chưa làm xong
- [ ] Dán link vào Zalo hiện đúng ảnh và tiêu đề, không phải ô trắng
- [ ] Không có ảnh vỡ, không có liên kết chết
- [ ] Không sai chính tả tiếng Việt — **một trang dạy tiếng Anh mà sai chính tả
      tiếng Việt thì mất uy tín gấp đôi**
- [ ] Có tên pháp nhân hoặc hộ kinh doanh, địa chỉ, cách liên hệ ở chân trang
- [ ] Có chính sách bảo mật nếu trang thu thập số điện thoại qua biểu mẫu
- [ ] Ảnh thật của lớp học, không phải ảnh kho — ảnh kho bị nhận ra ngay và phản tác dụng

---

## Cấm tuyệt đối

Những câu dưới đây **làm giảm uy tín chứ không tăng**, và có rủi ro theo quy định
quảng cáo. Công cụ soi (`audit.mjs`, luật `hua-qua-muc`) bắt các mẫu này:

| Cấm viết | Viết thay bằng |
|---|---|
| "Cam kết 100% đầu ra" | "Nếu sau 24 buổi chưa đạt mốc đã thoả thuận, học bù miễn phí tới khi đạt" |
| "Chắc chắn đậu IELTS" | "12 học viên thi IELTS năm 2026, 9 người đạt từ 6.5 trở lên" |
| "Giỏi sau 1 tháng" | "Sau 8 buổi, học viên tự giới thiệu bản thân được trong 2 phút không cần giấy" |
| "Tốt nhất Việt Nam" / "Số 1" | Bỏ hẳn. Thay bằng một điều cụ thể chỉ nơi này làm |
| "Giáo viên bản ngữ 100%" *(nếu không đúng)* | Nói đúng cơ cấu giáo viên hiện có |
| **"IELTS: 0.0 – 7.0"** | **"Luyện IELTS từ mất gốc đến mục tiêu 7.0"** |

### Về câu "IELTS: 0.0 – 7.0" trên danh thiếp

Câu này **sai về mặt sự kiện**, không chỉ là cách diễn đạt.

Theo thang điểm chính thức, **band 0 của IELTS nghĩa là "không dự thi"** (*Did not
attempt the test*). Band 1 mới là mức thấp nhất của người có dự thi (*Non user*).
Viết "IELTS: 0.0" như một điểm xuất phát là dùng sai thang điểm — và người đã từng
thi IELTS đọc ra ngay.

Chưa kể, ai lướt qua chỉ kịp thấy **số 0** nằm cạnh chữ IELTS. Cùng lỗi với khoảng
"1–20 năm kinh nghiệm": khoảng số làm người ta nhớ đầu thấp.

**Viết trên web:** *"Luyện IELTS từ mất gốc đến mục tiêu 7.0"*

Cùng một sự thật — nhận cả người chưa biết gì, đồng hành tới 7.0 — nhưng đọc ra là
**năng lực của trung tâm**, không phải một khoảng số khó hiểu. Chữ "mục tiêu" cũng
đúng hơn: đó là đích nhắm, không phải lời hứa đầu ra.

Công cụ soi có luật `ielts-sai-thang-diem` bắt câu này.

**Danh thiếp đã in thì không sửa được.** Ghi lại để lần in sau thay, và từ giờ mọi
chỗ khác — web, Facebook, Zalo, hồ sơ — dùng câu mới.

---

**Luật gốc: mọi con số phải truy được về nguồn.** Chưa có số thì viết
`[CẦN SỐ THẬT: …]` trong bản thảo, **không bao giờ điền số ước lượng cho đủ câu**.
`web-qa` chặn phát hành nếu còn dấu này trên trang.

Một con số sai bị một phụ huynh phát hiện sẽ đắt hơn toàn bộ lợi ích của việc có
con số đó.
