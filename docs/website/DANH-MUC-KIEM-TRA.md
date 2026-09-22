# Danh mục kiểm tra trước khi phát hành

> Người đi qua danh mục này: `web-qa`. Đi từ trên xuống, không bỏ mục nào.
> Chỉ cần một mục ở phần **Chặn phát hành** không đạt là trả bài.

---

## Bước 1 — Máy soi (2 phút)

```bash
node scripts/web-audit/audit.mjs <url hoặc thư mục>
echo "mã thoát: $?"
```

- [ ] Mã thoát bằng `0`

Mã thoát `1` nghĩa là còn lỗi nghiêm trọng → **trả bài ngay, không kiểm tiếp**.
Kiểm thủ công một bản chưa qua bước máy là lãng phí thời gian của chính bạn.

---

## Bước 2 — Chặn phát hành

Ba câu hỏi. Một câu "có" là chặn.

- [ ] Còn dấu `[CẦN SỐ THẬT: …]`, `TODO`, "đang cập nhật", hay bất kỳ nội dung tạm nào?
- [ ] Có con số nào về kết quả học tập mà không truy được về nguồn?
- [ ] Trên điện thoại, người đọc **không** tìm được cách liên hệ trong 10 giây?

---

## Bước 3 — Điện thoại thật

Dùng điện thoại thật hoặc chế độ giả lập thiết bị, khổ **360×640**.

- [ ] Không phải cuộn ngang ở bất kỳ trang nào
- [ ] Không có chữ nào tràn ra ngoài khối
- [ ] Mọi nút bấm trúng được bằng ngón cái (vùng bấm ≥ 44×44px)
- [ ] Menu mở và đóng được, đóng xong không kẹt cuộn trang
- [ ] Ảnh không bị méo hay bị cắt mất phần quan trọng
- [ ] Chữ thân bài đọc được mà không cần phóng to (≥ 16px)
- [ ] Phóng to được bằng hai ngón (không bị `user-scalable=no` chặn)

---

## Bước 4 — Đường đi của người mua

Đi đúng đường một phụ huynh thật sẽ đi:

- [ ] Từ trang chủ tới lúc nhắn được tin: **không quá 3 lần bấm**
- [ ] Trong ba giây đầu ở trang chủ, nói được một câu trang này dạy ai và dạy gì
- [ ] Mỗi trang có đúng **một** hành động chính, nút phụ nhỏ hơn rõ rệt
- [ ] Bấm thử **mọi** liên kết, kể cả chân trang và mạng xã hội — không cái nào chết
- [ ] Nút Zalo / điện thoại mở đúng ứng dụng trên điện thoại

---

## Bước 5 — Biểu mẫu

Nếu trang có biểu mẫu để lại thông tin:

- [ ] Gửi khi bỏ trống → báo lỗi rõ ràng, chỉ đúng ô nào thiếu
- [ ] Gửi số điện thoại sai định dạng → báo lỗi, không im lặng nuốt
- [ ] Gửi đúng → có màn hình xác nhận, người dùng biết chuyện gì xảy ra tiếp
- [ ] Dữ liệu gửi đi **thật sự tới nơi nhận** — tự kiểm, đừng tin lời
- [ ] Mỗi ô nhập có nhãn nhìn thấy được, không chỉ có chữ mờ placeholder
- [ ] Bấm gửi hai lần liên tiếp không tạo hai bản ghi

---

## Bước 6 — Bàn phím và trình đọc màn hình

- [ ] Nhấn `Tab` đi hết trang được, thứ tự hợp lý từ trên xuống
- [ ] Luôn nhìn thấy viền tiêu điểm đang ở đâu
- [ ] Cửa sổ bật lên: `Esc` đóng được, tiêu điểm không thoát ra ngoài khi còn mở
- [ ] Mọi ảnh có `alt`; ảnh trang trí để `alt=""`
- [ ] Tương phản chữ trên nền ≥ 4.5:1

Nhắc: **gold `#c8a24a` trên nền trắng chỉ đạt 2.41:1 — không được dùng làm chữ.**
Vàng chỉ làm nền cho chữ navy (6.71:1) hoặc làm viền.

---

## Bước 7 — Mạng chậm

Bóp băng thông xuống mức 3G chậm trong công cụ nhà phát triển:

- [ ] Trong 5 giây đầu đã đọc được chữ, không phải màn hình trắng
- [ ] Trang không nhảy giật khi ảnh tải xong
- [ ] Ảnh dưới màn hình đầu chỉ tải khi cuộn tới

---

## Bước 8 — Đọc lại chữ

- [ ] Không sai chính tả tiếng Việt, không thiếu dấu
- [ ] Tên riêng viết đúng: **Ms.Ngọc Elite English**
- [ ] Không có câu nào dán sang website trung tâm khác mà vẫn đúng
- [ ] Không có lời hứa tuyệt đối ("cam kết 100%", "chắc chắn đậu", "số 1")
- [ ] Số điện thoại, email, giờ làm việc đều đúng — gọi thử một cuộc

---

## Bước 9 — Chia sẻ

- [ ] Dán địa chỉ trang vào Zalo → hiện đúng ảnh, tiêu đề, mô tả
- [ ] Dán vào Facebook Messenger → hiện đúng
- [ ] Ảnh chia sẻ đúng 1200×630, không bị cắt mất chữ quan trọng

---

## Cách báo cáo một lỗi

Đúng bốn dòng:

```
Lỗi:        chuyện gì xảy ra
Tái hiện:   1) … 2) … 3) …
Đáng ra:    phải xảy ra chuyện gì
Mức:        chặn phát hành | cần sửa | ghi nhận sau
```

Không viết "giao diện hơi lệch". Viết: *"trên Chrome khổ 360px, nút Đăng ký tràn ra
ngoài lề phải 12px, che mất chữ cuối"*.
