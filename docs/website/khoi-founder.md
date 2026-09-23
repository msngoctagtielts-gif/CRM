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
  --navy-950: #03122b;
  --navy-700: #0e3677;
  --navy-200: #bcc8dc;
  --gold-500: #ecb551;

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

Tương phản đã kiểm: gold trên navy-950 **10.04:1**, navy-200 trên navy-950 **11.05:1**,
trắng trên navy-950 **18.66:1**. Tất cả vượt chuẩn 4.5:1.

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
  background: #ecb551;
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
  <p class="mnee-team__eyebrow">ĐỘI NGŨ GIÁO VIÊN</p>
  <h2 class="mnee-team__heading">Ghép giáo viên trước khi vào học</h2>
  <div class="mnee-team__rule" aria-hidden="true"></div>
  <p class="mnee-team__body">
    Trung tâm trao đổi với học viên về mục tiêu, trình độ và lịch học,
    rồi mới chọn giáo viên phù hợp — không xếp lớp trước rồi mới báo.
  </p>
  <p class="mnee-team__fact">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
    <span>Toàn bộ giáo viên có chứng chỉ giảng dạy.</span>
  </p>
</section>
```

```css
.mnee-team {
  --navy-900: #051d42;
  --navy-800: #07285d;
  --navy-600: #1d4991;
  --navy-50:  #f4f6f8;
  --gold-500: #ecb551;
  --gold-700: #926719;

  background: var(--navy-50);
  color: var(--navy-900);
  padding: 56px 44px;
}

.mnee-team__eyebrow {
  margin: 0 0 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--navy-600);
}

.mnee-team__heading {
  margin: 0 0 20px;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(26px, 7vw, 32px);
  font-weight: 600;
  line-height: 1.2;
}

.mnee-team__rule {
  width: 40px;
  height: 2px;
  margin-bottom: 20px;
  background: var(--gold-500);
}

.mnee-team__body {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--navy-800);
}

.mnee-team__fact {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.mnee-team__fact svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--gold-700);
}
```

**Nền sáng là có chủ ý** — sau hai khối navy liên tiếp, mắt cần một khoảng thở.

**Vàng ở khối này chỉ được làm vạch, không được làm chữ.** Gold `#ecb551` trên nền
`#f4f6f8` chỉ đạt **1.72:1**. Dấu tích dùng gold đậm `#926719` (**4.64:1**), nhãn nhỏ
dùng navy-600 (**8.03:1**), tiêu đề và thân bài navy-900 (**15.37:1**).

Đây là một quy trình kiểm chứng được: học viên nào cũng xác nhận được là có buổi
trao đổi trước hay không. Nó trả lời đúng câu hỏi mà khoảng "1–20 năm" đang làm
người ta lo.

Cô Ngọc đã xác nhận **toàn bộ** giáo viên có chứng chỉ giảng dạy (22/09/2026), nên
câu đó được viết khẳng định. Nếu về sau tuyển thêm người chưa có chứng chỉ, phải sửa
câu này trước khi người đó đứng lớp — đây là loại câu một phụ huynh hỏi lại là biết
ngay.


---

## Chân dung đã tách nền

Ảnh chân dung gốc có nền xám đen `#1a1a1a`–`#282828`, không phải navy. Đã tách nền
bằng mô hình u2net, xuất ra PNG/WebP nền trong suốt ở ba cỡ: 1500, 900, 600px.
Bản WebP 900px chỉ **67 KB** — dùng bản này cho trang chủ.

### Đừng đặt thẳng lên nền navy phẳng

Áo vest navy `#161a31` trên navy-900 chỉ đạt **1.03:1**. Vai tan vào nền.

| Nền | Tương phản với áo vest |
|---|---|
| navy-950 | 1.09 |
| navy-900 | **1.03** |
| navy-800 | 1.20 |
| navy-700 | 1.43 |
| navy-50 (nền sáng) | 15.81 |

Không bậc navy nào đủ. Ảnh gốc giải bằng **vầng sáng sau lưng** — chính kỹ thuật
đèn viền của thợ chụp. Lớp `.mnee-portrait` dựng lại đúng thế bằng CSS:

```html
<div class="mnee-portrait" style="height: 520px">
  <img src="ms-ngoc-900.webp" alt="Ms. Ngọc, người sáng lập Ms.Ngọc Elite English"
       width="900" height="1200">
</div>
```

Tâm vầng sáng `#3a588c`, toả về navy-900. Đo tại mép vai: **1.61:1** — không phải
chuẩn chữ (chuẩn đó không áp cho ảnh), nhưng đủ để vai nổi khỏi nền.

### Một cách tôi đã thử và loại

Viền vàng mảnh quanh chủ thể. Dựng ra nhìn như hình dán, không hợp "tối giản,
cao cấp". Loại.

### Lỗi bắt được khi dựng thử trong trình duyệt

Bản CSS đầu tiên làm **búi tóc bị cắt cụt** khi khung bị ép chiều cao. Đã thêm
`max-height: 100%` và `object-fit: contain` để ảnh thu nhỏ chứ không bị xén. Kiểm
lại ở 360px và 440px bằng Chromium: không xén, không cuộn ngang.
