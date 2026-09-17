# Bài kiểm tra xếp lớp — bản web

Hai bản, hai mục đích khác nhau. Không thay thế nhau.

| File | Ai dùng | Cách dùng |
|---|---|---|
| `placement-hocvien.html` | Học viên tự làm | 24 câu, 4 bậc A2–C1. Gửi link trước buổi tư vấn. |
| `placement-lop.html` | Giáo viên trình chiếu | 36 câu, 6 bậc Pre-A1–C1. Học viên nhìn chung màn hình, giáo viên bấm bàn phím. |

Bản trình chiếu: đáp án **ẩn mặc định** vì học viên nhìn cùng màn hình.
Phím tắt: `1`–`4` chọn · `Space` bật/tắt đáp án · `←` quay lại · `Enter` hoặc `→` tiếp.
Quy tắc dừng: bậc nào dưới 4/6 câu đúng thì dừng, nên một buổi thường chỉ dùng 18–24 trong 36 câu.

Đáp án trong dữ liệu gốc đều đứng đầu mảng `o` cho dễ soát. Lúc nạp trang, mỗi câu
được xoay vòng lựa chọn theo công thức cố định (`shift = (i * 3 + 1) % 4`) để đáp án
không phải lúc nào cũng là phương án 1 — thứ tự không đổi khi bấm qua bấm lại.

Phần nói và nghe **không** chấm ở đây. Chấm riêng theo sáu tiêu chí trong bộ kiểm tra
đầu vào bản giấy (Fluency, Vocabulary, Grammar in Use, Pronunciation, Interaction,
Confidence, thang 1–5).

Band IELTS ghi kèm mỗi bậc CEFR chỉ là tương quan gần đúng — theo IELTS.org công bố,
không có quy đổi tuyệt đối 1:1.

**Chưa thử nghiệm với học viên thật.** Trước khi dùng chính thức, nên cho 3–5 học viên
đã biết rõ trình độ làm bài rồi đối chiếu với đánh giá của giáo viên.
