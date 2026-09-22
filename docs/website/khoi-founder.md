# Khối Founder — bản sửa (hướng B)

Sửa hai chỗ ở đáy khối hero trang chủ:

1. **Bỏ vệt chéo đỏ–vàng** ở góc dưới trái, thay bằng đường vàng dọc chạy hết chiều cao
2. **Bỏ số "01"** sau chữ FOUNDER, thay dải đó bằng một dòng bằng chứng

Xem bản dựng: kết quả nằm trong khung "B — cho chỗ đó làm việc" của canvas thiết kế.

---

## Vì sao

| Chỗ | Vấn đề | Đo được |
|---|---|---|
| Vệt chéo | Burgundy trên navy không đủ tương phản, đọc ra như mảng lem | **2.42:1** |
| Vệt chéo | Burgundy trong hệ nhận diện dành riêng cho cảnh báo, công nợ, số âm — đem trang trí thì lúc cần báo động không ai giật mình | — |
| Vệt chéo | Đường chéo là ngôn ngữ lạ giữa bố cục toàn đường đứng và ngang | — |
| "01" | Hứa một danh sách không tồn tại — trung tâm chỉ có một người sáng lập | — |
| "01" | Ngay trên đã có 01/02/03 là chuỗi thật; cùng ký hiệu, hai nghĩa, trên một màn hình | — |

---

## Mã — dải Founder

```html
<section class="mnee-founder">
  <p class="mnee-founder__eyebrow">NGƯỜI SÁNG LẬP</p>
  <h2 class="mnee-founder__name">Ms. Ngọc</h2>
  <p class="mnee-founder__motto">Thấu hiểu để dẫn lối.</p>
  <div class="mnee-founder__rule" aria-hidden="true"></div>
  <p class="mnee-founder__proof">
    Chứng chỉ TESOL · 8 năm giảng dạy<br>
    Dạy kèm cá nhân hoá theo từng học viên
  </p>
</section>
```

```css
.mnee-founder {
  --navy-950: #08142b;
  --navy-700: #1d3559;
  --navy-200: #c4d2e4;
  --gold-500: #c8a24a;

  background: var(--navy-950);
  color: #ffffff;
  padding: 40px 44px;
  border-top: 1px solid var(--navy-700);
}

.mnee-founder__eyebrow {
  margin: 0 0 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--gold-500);
}

.mnee-founder__name {
  margin: 0 0 16px;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(36px, 9vw, 46px);
  font-weight: 500;
  line-height: 1;
}

.mnee-founder__motto {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.mnee-founder__rule {
  width: 40px;
  height: 2px;
  margin: 24px 0 16px;
  background: var(--gold-500);
}

.mnee-founder__proof {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--navy-200);
}
```

Tương phản đã kiểm: gold trên navy-950 **7.62:1**, navy-200 trên navy-950 trên 10:1,
trắng trên navy-950 trên 16:1. Tất cả vượt chuẩn 4.5:1.

**13px là sàn, đừng hạ thêm.** Dòng bằng chứng là dòng người ta thật sự đọc để quyết
định, không phải chú thích cho có.

---

## Mã — góc dưới trái khối hero

```css
/* 1. Xoá vệt chéo. Tên lớp thật trong MNEE-OS có thể khác — tìm phần tử
      chứa background burgundy (#7b2d3b hoặc #a82e49) rồi xoá hẳn khỏi HTML,
      đừng chỉ display:none. */

/* 2. Đường vàng dọc chạy hết chiều cao, dừng đúng ở vạch ngăn */
.hero {
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 3px;
  background: #c8a24a;
}
```

Đường này vốn đã có ở mép trái nhưng bị cắt ngang chừng. Cho nó chạy hết là đủ neo
góc dưới trái — đúng việc mà vệt chéo đang cố làm, nhưng bằng ngôn ngữ của chính hệ
nhận diện.

---

## Số thật — cô Ngọc đã xác nhận 22/09/2026

| Nội dung | Trạng thái |
|---|---|
| Chứng chỉ TESOL | có |
| 8 năm giảng dạy | có |
| Dạy kèm cá nhân hoá | có |
| Số học viên đã đồng hành | **chưa có** — không đưa lên trang |

Số học viên chưa có nên đã bỏ hẳn dòng đó, không để ngoặc treo trên trang chạy
thật. Một dòng thật hơn hai dòng có một nửa là đoán. Khi nào lấy được số từ hệ
thống quản lý thì thêm vào sau, dễ hơn là gỡ một con số sai xuống.

---

## Kinh nghiệm 1–20 năm thuộc khối khác

Con số "giáo viên 1 đến 20 năm kinh nghiệm, trung tâm trao đổi trước khi ghép lớp"
là của **đội ngũ**, không phải của người sáng lập. Đặt nhầm vào khối Founder thì
người đọc tưởng đang nói về cô Ngọc, và con số 8 năm ngay bên cạnh thành mâu thuẫn.

Nó thuộc khối **Đội ngũ giáo viên**, một khối riêng.

### Và đừng đăng nguyên khoảng "1–20 năm"

Phụ huynh đọc "1 đến 20 năm" thì chỉ nhớ đúng một đầu: **1**. Khoảng số này khiến
người ta lo mình rơi vào nhóm giáo viên mới, chứ không yên tâm hơn.

Thứ thật sự mạnh ở đây không phải khoảng kinh nghiệm — mà là **cơ chế ghép**:

```html
<section class="mnee-team">
  <h2>Ghép giáo viên trước khi vào học</h2>
  <p>
    Trung tâm trao đổi với học viên về mục tiêu, trình độ và lịch học,
    rồi mới chọn giáo viên phù hợp — không xếp lớp trước rồi mới báo.
  </p>
  <p>Toàn bộ giáo viên có chứng chỉ giảng dạy.</p>
</section>
```

Đây là một quy trình kiểm chứng được: học viên nào cũng xác nhận được là có buổi
trao đổi trước hay không. Nó trả lời đúng câu hỏi mà khoảng "1–20 năm" đang làm
người ta lo.

**Cần cô xác nhận thêm:** có phải **toàn bộ** giáo viên đều có chứng chỉ giảng dạy
không? Nếu chỉ một phần thì phải viết đúng phần đó, đừng viết "toàn bộ".
