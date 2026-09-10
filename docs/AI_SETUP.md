# Bật tính năng AI viết nhận xét

Quyết định D6: khi giáo viên cung cấp link video hoặc bản ghi lời thoại, AI viết
sẵn phần nhận xét để giáo viên đọc lại và sửa. Việc **gửi cho phụ huynh vẫn là
một bước riêng do người bấm**, hệ thống không bao giờ tự gửi (giả định A13).

---

## 1. Lấy khoá API — miễn phí, 2 phút, không cần thẻ

Việc này **phải do Founder tự làm** vì cần đăng nhập tài khoản Google của trung
tâm. Không ai khác lấy hộ được.

1. Mở <https://aistudio.google.com/apikey> và đăng nhập bằng tài khoản Google
   của trung tâm
2. Bấm **Create API key** → chọn hoặc để hệ thống tự tạo một project
3. Sao chép chuỗi khoá (dạng `AIza...`)

Gói miễn phí của Gemini cho vài trăm tới hơn nghìn lượt mỗi ngày. Trung tâm dạy
vài chục buổi mỗi tuần nên còn rất xa mức đó — thực tế sẽ không tốn đồng nào.
Google đổi hạn mức khá thường xuyên, xem
<https://ai.google.dev/gemini-api/docs/rate-limits> để biết con số hiện hành.

> **Khoá này là bí mật.** Ai có nó cũng gọi được API bằng hạn mức của trung tâm.
> Không dán vào chat, không commit vào Git, không gửi qua Zalo.

---

## 2. Đặt khoá vào hệ thống

Thêm vào `.env.local` khi chạy máy cá nhân:

```bash
GOOGLE_AI_API_KEY=...              # khoá vừa lấy ở bước 1
GOOGLE_AI_MODEL=gemini-3.6-flash   # không bắt buộc, đây là mặc định
```

> **Về tên model.** Google khai tử model khá nhanh: `gemini-2.0-flash` đã ngừng
> hoạt động và trả về lỗi 404. Mặc định hiện tại là `gemini-3.6-flash`, đã kiểm
> bằng lần gọi thật. Nếu một ngày nút "AI viết nháp" báo *"Không tìm thấy
> model"*, chạy lệnh dưới đây để xem danh sách còn dùng được rồi đặt lại
> `GOOGLE_AI_MODEL`:
>
> ```bash
> curl -s "https://generativelanguage.googleapis.com/v1beta/models" \
>   -H "x-goog-api-key: $GOOGLE_AI_API_KEY" | grep '"name"'
> ```
>
> Không dùng bí danh `gemini-flash-latest`: lúc kiểm nó trả lỗi 503 quá tải, và
> bí danh có thể đổi model bên dưới mà mình không hay biết.

Khi triển khai thật (ví dụ Vercel): **Project Settings → Environment Variables**,
thêm đúng hai tên trên. Đừng dùng tiền tố `NEXT_PUBLIC_` — biến có tiền tố đó bị
nhúng thẳng vào JavaScript gửi xuống trình duyệt, nghĩa là công khai khoá cho bất
kỳ ai mở trang.

Chưa đặt khoá thì tính năng tự tắt: nút "AI viết nháp" hiện hướng dẫn thay vì báo
lỗi, và mọi phần khác của hệ thống chạy bình thường.

---

## 3. Kiểm tra khoá có chạy không

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" \
  -H "x-goog-api-key: $GOOGLE_AI_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Trả lời đúng một từ: OK"}]}]}'
```

Trả về JSON có chữ `OK` là khoá chạy. Trả về `API key not valid` là khoá sai hoặc
chưa kích hoạt.

---

## 4. Điều AI **không** làm được — và vì sao

### Không mở được recording trên Google Drive

Gemini đọc trực tiếp được video **YouTube**, nhưng **không mở được link Google
Drive** vì đó là file riêng tư cần đăng nhập. Trung tâm đang lưu recording trên
Drive, nên phần lớn buổi học sẽ rơi vào trường hợp này.

Khi đó AI vẫn viết được phần **điểm mạnh** và **cần cải thiện** từ nội dung buổi
học và ghi chú của giáo viên, nhưng **để trống trích nguyên văn lời học viên và
timestamp**.

Đây là lựa chọn có chủ ý, không phải thiếu sót. Trích nguyên văn là một trong 6
tiêu chí chấm chất lượng, nên có áp lực điền cho đủ điểm. Một câu tiếng Anh do AI
bịa ra rồi gửi cho phụ huynh như thể con họ đã nói là chuyện hỏng lòng tin, không
phải lỗi nhỏ. Vì vậy hệ thống chặn ở **hai lớp**:

1. Prompt cấm bịa và yêu cầu để trống khi không có nguồn
2. Máy chủ **xoá** trích dẫn và timestamp nếu model vẫn cố điền
   (`enforceNoFabrication` trong `src/lib/ai/feedback.ts`)

Lớp thứ hai mới là lớp bảo đảm — dặn dò một mô hình ngôn ngữ không phải là bảo
đảm.

**Cách có đủ 6 tiêu chí:** giáo viên bấm "+ Dán bản ghi lời thoại" và dán
transcript buổi học vào. Có transcript thì AI trích được câu thật.

### Không tự chấm "đủ sâu"

Hai tiêu chí `qc_strengths_deep` và `qc_improvements_deep` vẫn do Founder chấm.
Trigger `trg_guard_qc_verdict` (migration 0017) chặn ở tầng cơ sở dữ liệu, nên kể
cả AI hay giáo viên gọi thẳng API cũng không tự bật được.

### Không tự gửi phụ huynh

AI chỉ ghi bản nháp vào báo cáo. Gửi phụ huynh là nút riêng do người bấm.

---

## 5. Dữ liệu nào rời khỏi hệ thống

Gửi sang Google chỉ gồm những gì cần để viết nhận xét:

| Có gửi | Không gửi |
|---|---|
| Tên gọi hoặc biệt danh ("Tân", "Ngân") | Họ tên đầy đủ |
| Tuổi | Ngày sinh |
| Tên lớp, ngày học, thời lượng | Số điện thoại, địa chỉ |
| Nội dung buổi học, ghi chú giáo viên | Thông tin phụ huynh |
| Bản ghi lời thoại nếu giáo viên dán vào | Toàn bộ số liệu học phí, lương, doanh thu |

Việc rút gọn tên nằm ở `studentLabelFor()` và có kiểm thử riêng. Nếu về sau muốn
không gửi gì ra ngoài, chỉ cần bỏ `GOOGLE_AI_API_KEY` là tính năng tắt hẳn.

---

## 6. Đổi sang nhà cung cấp khác

Toàn bộ phần chạm mạng gói trong `src/lib/ai/provider.ts`. Phần soạn prompt, đọc
kết quả và chặn bịa đặt nằm ở `src/lib/ai/feedback.ts` và không phụ thuộc nhà
cung cấp nào — đổi sang OpenAI hay model chạy tại chỗ chỉ phải viết lại
`provider.ts`.

Chạy kiểm thử phần logic này:

```bash
npm run test:unit
```

---

## 7. Đã kiểm thật những gì

Ngày 10/09/2026, gọi API thật bằng khoá của trung tâm:

| Trường hợp | Kết quả |
|---|---|
| Recording là link Google Drive | Viết được điểm mạnh, cần cải thiện, mẫu câu; **để trống** trích dẫn và timestamp; `source_note` nói rõ lý do |
| Giáo viên dán bản ghi lời thoại | Trích **đúng câu thật** học viên đã nói, kể cả câu sai ngữ pháp ("She go to school at seven.") — đúng thứ phụ huynh cần thấy |

Hai lỗi chỉ lộ ra khi gọi thật, đã vá:

1. **`gemini-2.0-flash` đã bị khai tử** — trả về 404, tính năng chết hẳn. Đổi
   mặc định sang `gemini-3.6-flash`.
2. **Thinking token ăn hết hạn mức output.** Gemini 3.x "suy nghĩ" trước khi trả
   lời, và số token suy nghĩ tính chung vào `maxOutputTokens`. Đo thật: 620 token
   prompt sinh ra ~1.550 token suy nghĩ chỉ để viết ~330 token nội dung. Đặt
   2.048 là sát mép — có lần JSON đứt ngang, giáo viên mất cả bản nháp. Đã nâng
   lên 8.192, báo lỗi riêng khi bị cắt, và thử lại một lần khi model quá tải.
