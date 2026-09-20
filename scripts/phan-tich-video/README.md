# Xác minh buổi học từ video

Đo số phút học **thật**, tìm các lần gián đoạn và mô tả không khí lớp — bằng cách
đưa video buổi học cho Gemini đọc.

## Vì sao phải nhờ dịch vụ ngoài

Máy chạy Claude Code bị chặn hoàn toàn `youtube.com` và `zoom.us` ở tầng cổng ra
(403 CONNECT). Trợ lý không xem được video, cũng không lấy được phụ đề.

Gemini thì **tự tải video từ phía Google**, nên việc máy này bị chặn không còn
quan trọng.

Đã thử sáu nhà cung cấp, **chỉ Gemini đi ra được**:

| Dịch vụ | Kết nối |
|---|---|
| `generativelanguage.googleapis.com` (Gemini) | ✅ tới được |
| `api.deepseek.com` | ❌ chặn |
| `api.openai.com` | ❌ chặn |
| `api.groq.com` | ❌ chặn |
| `openrouter.ai` | ❌ chặn |
| `huggingface.co` | ❌ chặn |

## Giới hạn phải biết trước

**Chỉ chạy được với video YouTube.** Zoom Clips là link riêng tư, không dịch vụ
nào tải về được. Tính tới 20/09/2026: 7 trong 13 buổi tháng 9 có video YouTube.

Muốn xác minh buổi chỉ có Zoom Clips, giáo viên phải tải bản ghi lên YouTube
(chế độ *Không công khai / Unlisted* là đủ, không cần công khai).

**Không ghi đè số giáo viên khai.** Kết quả vào cột riêng `phut_thuc_te`. Lương
và học phí vẫn tính theo số khai cho tới khi cô Ngọc duyệt. Hệ thống không tự
sửa tiền theo kết quả máy đọc.

**Nhận xét do máy viết được đánh dấu `authored_by = 'ai'`.** Giáo viên đọc lại và
sửa thì chuyển thành `ai_edited_by_teacher`. Máy chỉ điền vào ô đang trống,
không đụng vào chữ giáo viên đã viết.

## Lấy khoá Gemini miễn phí

1. Mở <https://aistudio.google.com/apikey>
2. Đăng nhập bằng tài khoản Google của trung tâm
3. Bấm **Create API key** → sao chép chuỗi

Bậc miễn phí của Gemini đủ cho quy mô hiện tại. Kiểm tra hạn mức mới nhất tại
<https://ai.google.dev/gemini-api/docs/rate-limits>.

## Chạy

```bash
export GEMINI_API_KEY=...      # khoá vừa lấy
export SUPABASE_DB_URL=...     # chuỗi Session pooler, giống secret của backup.yml

# Chạy thử — in kết quả ra màn hình, KHÔNG ghi vào cơ sở dữ liệu
node scripts/phan-tich-video/phan-tich.mjs --thu

# Chạy thật
node scripts/phan-tich-video/phan-tich.mjs

# Chỉ xác minh từ một ngày trở đi
node scripts/phan-tich-video/phan-tich.mjs --tu 2026-09-01
```

Script bỏ qua những buổi đã xác minh rồi, nên chạy lại nhiều lần không sao.

## Xem kết quả

Màn hình **Xác minh buổi học** trong menu Tài chính, hoặc view
`v_xac_minh_buoi_hoc`.

Bảng cho thấy: số khai, số thật, độ lệch, số phút học viên nói kèm tỷ lệ, các
lần gián đoạn trên 30 giây và lý do, mô tả không khí lớp.

Tỷ lệ học viên nói **dưới 60%** là dấu hiệu lớp giao tiếp chưa đạt.

## Khi kết quả sai

Gemini đọc video, không phải người dự giờ. Chất lượng âm thanh kém thì kết quả
kém. Lời nhắc đã yêu cầu trả `null` thay vì đoán, nhưng vẫn phải đọc lại trước
khi dùng làm căn cứ trả lương hay gửi phụ huynh.

Cột `nguon_xac_minh` ghi rõ ai xác minh: `gemini`, `teacher` hay `founder`.
