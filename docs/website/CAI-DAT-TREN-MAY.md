# Mang sáu nhân sự và công cụ soi sang máy làm website

Mã nguồn hai website **không nằm trong kho mã GitHub nào**. Nó nằm trên máy Windows
của cô Ngọc, ở thư mục:

```
C:\Users\User\MNEE-OS
```

Phiên `session_01WCyrPE3GwSCJ6LE5NMYR1A` ("Miss Ngọc Elite English websites") làm
việc trực tiếp trên thư mục đó qua Claude Desktop. Phiên chạy trên kho `CRM` nằm ở
máy chủ đám mây, **không với tới được ổ C của cô**.

Nên sáu nhân sự và công cụ soi phải được **chép sang** thì mới dùng được ở đó.

---

## Cách làm — hai dòng lệnh

Mở **PowerShell** (Windows) hoặc **Terminal** (Mac), vào thư mục có mã nguồn website:

```powershell
cd C:\Users\User\MNEE-OS
```

Rồi chạy:

```powershell
curl.exe -sSLO https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e/scripts/web-audit/cai-dat.mjs
node cai-dat.mjs
```

> Trên Mac hoặc Linux, đổi `curl.exe` thành `curl`.
> `curl.exe` có sẵn trong Windows 10 trở lên, không phải cài gì thêm.

Trình cài sẽ:

1. Kiểm Node trên máy có từ phiên bản 20 trở lên không
2. Tải 13 tệp — công cụ soi, sáu nhân sự, năm tài liệu
3. **Tự dựng một trang hỏng rồi soi thử**, để chắc công cụ chạy được trên máy đó
   trước khi báo xong

Nếu bước nào hỏng, nó dừng lại và nói rõ hỏng ở đâu, không báo xong khống.

Chạy lại lệnh trên bất cứ lúc nào để lấy bản mới nhất. Tệp cũ bị ghi đè; tệp khác
trong thư mục không bị đụng tới.

> **Một lưu ý nhỏ:** GitHub giữ đệm tệp khoảng 5 phút. Nếu vừa có thay đổi mới đẩy
> lên mà chạy ngay thì có thể còn nhận bản cũ — chờ 5 phút rồi chạy lại là có bản
> mới. Không ảnh hưởng gì tới lần cài đầu tiên.

| Tuỳ chọn | Tác dụng |
|---|---|
| `node cai-dat.mjs --nhanh` | Bỏ bước tự kiểm |
| `node cai-dat.mjs --chi-cong-cu` | Chỉ tải công cụ soi, không tải nhân sự và tài liệu |

---

## Kiểm lại là đã cài đúng

```powershell
node scripts\web-audit\audit.mjs .
```

Soi toàn bộ tệp `.html` trong thư mục. Hoặc soi hai trang đang chạy:

```powershell
node scripts\web-audit\audit.mjs https://msngoc-elite-english.pages.dev
node scripts\web-audit\audit.mjs https://msngoc-folio.pages.dev --profile=ca-nhan
```

---

## Rồi gọi nhân sự

Mở phiên làm việc ở thư mục `MNEE-OS` và gọi thẳng tên:

```
Dùng web-auditor soi toàn bộ thư mục này
Dùng web-planner lên kế hoạch từ báo cáo vừa rồi
```

**Chạy `web-auditor` trước.** Phiên `MNEE-OS` đã tự sửa một đợt UX và hiệu năng rồi
(thang chữ, vùng bấm 44px, chống nhảy layout, nén ảnh). Chốt hiện trạng trước khi
sửa tiếp, nếu không hai phiên sẽ sửa chồng lên nhau mà phiên nào cũng tưởng mình
đúng.

---

## Nếu mạng công ty chặn, tải tay

Khi `cai-dat.mjs` báo tải hỏng, vào thẳng kho mã trên GitHub và tải từng tệp:

```
https://github.com/msngoctagtielts-gif/CRM/tree/claude/ai-agents-professional-website-oym91e
```

Đặt đúng chỗ, giữ nguyên cấu trúc thư mục:

```
MNEE-OS\
  .claude\agents\        6 tệp nhân sự
  scripts\web-audit\     audit.mjs + README.md
  docs\website\          5 tệp tài liệu
```

---

## Về lâu dài nên nối GitHub

Hiện `MNEE-OS` chưa nối kho mã. Nối được thì tốt hơn hẳn: sửa ở đâu cũng thấy, có
lịch sử thay đổi để lần ngược khi hỏng, và không phải chép tay mỗi lần công cụ soi
có luật mới. Nhưng đó là việc riêng, làm sau cũng được — cách hai dòng lệnh ở trên
đủ để bắt đầu ngay hôm nay.
