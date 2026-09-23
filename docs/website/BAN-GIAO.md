# Bàn giao

Nhánh: `claude/ai-agents-professional-website-oym91e` · kho `msngoctagtielts-gif/CRM`

---

## 1. Đã giao những gì

### Sáu nhân sự AI — `.claude/agents/`

| Tệp | Vai trò | Ranh giới |
|---|---|---|
| `web-auditor.md` | Soi trang đang chạy, xếp hạng theo thiệt hại | Không sửa |
| `web-planner.md` | Sơ đồ trang, thứ tự làm, tiêu chí xong | Không viết mã, không viết chữ |
| `web-designer.md` | Bố cục, thang chữ, màu, trạng thái | Không viết nội dung |
| `web-copywriter.md` | Nội dung tiếng Việt, bằng chứng uy tín | Không quyết bố cục |
| `web-builder.md` | Dựng mã, tối ưu tốc độ | Không tự đổi chữ đã duyệt |
| `web-qa.md` | Chặn hoặc cho qua | Không sửa lỗi |

Gọi thẳng tên trong phiên làm việc: *"Dùng web-auditor soi toàn bộ thư mục này"*.

### Công cụ soi lỗi — `scripts/web-audit/`

| Tệp | Nội dung |
|---|---|
| `audit.mjs` | 27 luật, sáu nhóm. Node thuần, không thư viện ngoài |
| `cai-dat.mjs` | Trình cài, chép cả bộ sang máy khác |
| `README.md` | Cách dùng |

Mã thoát `1` nếu còn lỗi nghiêm trọng — dùng được trong CI.

### Mã hai khối trang chủ — `docs/website/mau/`

| Tệp | Dùng thế nào |
|---|---|
| `mnee-blocks.css` | Chép vào dự án, nối vào trang |
| `khoi-founder.partial.html` | Hai khối HTML, dán thẳng |
| `xem-truoc.html` | Mở bằng trình duyệt để duyệt thiết kế |

### Tài liệu — `docs/website/`

`README.md` (dây chuyền sáu vai trò) · `KE-HOACH-XAY-DUNG.md` · `UY-TIN.md` ·
`DANH-MUC-KIEM-TRA.md` · `khoi-founder.md` (lý do từng thay đổi) ·
`CAI-DAT-TREN-MAY.md` · `BAN-GIAO.md` (tệp này)

---

## 2. Đã kiểm — số thật, không phải lời hứa

| Kiểm cái gì | Kết quả |
|---|---|
| Bản xem trước hai khối | **0 lỗi nghiêm trọng, 0 lỗi cần sửa** |
| Khả năng tiếp cận của hai khối | **0 lỗi** — không thiếu alt, không ô nhập thiếu nhãn, không liên kết rỗng, không trùng id, không nhảy cấp tiêu đề |
| Trình cài, chạy trong thư mục trống | 13 tệp về đủ, tự kiểm đạt, mã thoát 0 |
| Công cụ soi trên trang hỏng thử nghiệm | 33 phát hiện (5 nghiêm trọng) |
| Công cụ soi trên trang chuẩn | 0 phát hiện — không báo nhầm |

### Tương phản màu, đã đo từng cặp

| Cặp màu | Tỷ lệ | Kết luận |
|---|---|---|
| Trắng trên navy-950 | 18.34:1 | đạt |
| Navy-900 trên navy-50 | 14.76:1 | đạt |
| Navy-200 trên navy-950 | 11.95:1 | đạt |
| Navy-600 trên navy-50 | 8.20:1 | đạt |
| Gold-500 trên navy-950 | 7.62:1 | đạt |
| Gold-700 trên navy-50 | 4.87:1 | đạt |
| **Gold-500 trên navy-50** | **2.20:1** | **không đạt — vàng không được làm chữ trên nền sáng** |
| **Burgundy-600 trên navy-900** | **2.42:1** | **không đạt — lý do bỏ vệt chéo** |

---

## 3. Hai lỗi của chính tôi, đã sửa trong quá trình làm

Ghi lại để người sau biết chỗ nào từng hỏng:

**Lỗi Windows trong trình cài.** Bản đầu dùng `file://` URL để gọi công cụ soi;
trên Windows đường dẫn thành `/C:/Users/…` và Node không mở được. Sửa sang đường
dẫn thường trước khi đẩy lên.

**Công cụ soi không bắt được dấu ngoặc vuông.** Tài liệu nói `web-qa` chặn phát
hành khi còn `[CẦN SỐ THẬT]` hay `[SỐ]`, nhưng thực tế không luật nào bắt. Đã thêm
hai mẫu; kiểm lại `[2026]` và `[hình 3]` không bị báo nhầm.

---

## 4. Còn treo

| Việc | Ai làm | Vì sao chưa xong |
|---|---|---|
| **Soi hai trang đang chạy** | cô Ngọc chạy trình cài rồi gọi `web-auditor` | Phiên này bị chặn truy cập ra `*.pages.dev` |
| **Áp hai khối vào trang thật** | phiên `MNEE-OS` | Mã nguồn ở `C:\Users\User\MNEE-OS`, phiên này không với tới ổ C |
| **Số học viên đã đồng hành** | Hệ thống quản lý MNEE | Chưa có số, nên đã bỏ hẳn dòng thay vì để ngoặc treo |
| **Ảnh chân dung founder** | cô Ngọc | Phiên `MNEE-OS` đang chờ: ảnh dọc, phông nền sạch |
| **Kết nối lại máy** | cô Ngọc | Phiên `MNEE-OS` còn gói chưa đẩy được |
| **Nối `MNEE-OS` với kho mã GitHub** | cô Ngọc | Làm sau cũng được, nhưng làm rồi thì hết cảnh chép tay |

---

## 5. Làm gì tiếp — theo thứ tự

```powershell
# 1. Mở PowerShell, vào thư mục có mã nguồn website
cd C:\Users\User\MNEE-OS

# 2. Chép cả bộ sang
curl.exe -sSLO https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e/scripts/web-audit/cai-dat.mjs
node cai-dat.mjs

# 3. Soi hiện trạng TRƯỚC khi sửa gì
node scripts\web-audit\audit.mjs .
node scripts\web-audit\audit.mjs https://msngoc-elite-english.pages.dev
```

Rồi trong phiên làm việc ở `MNEE-OS`:

```
Dùng web-auditor soi toàn bộ thư mục này
Dùng web-planner lên kế hoạch từ báo cáo vừa rồi
Áp hai khối trong docs/website/mau/ vào trang chủ
Dùng web-qa kiểm lại trước khi đẩy lên Cloudflare
```

**Chạy `web-auditor` trước bất cứ thay đổi nào.** Phiên `MNEE-OS` đã tự sửa một đợt
UX và hiệu năng rồi; không chốt hiện trạng trước thì hai phiên sửa chồng lên nhau mà
phiên nào cũng tưởng mình đúng.

---

## 6. Ba luật giữ cho cả về sau

**Không ai tự tuyên bố mình xong.** `web-builder` nộp bài, `web-qa` mới nói xong.
Người dựng luôn nhìn sót lỗi của chính mình — đó là lý do hai vai trò này tách nhau.

**Không có số bịa.** Chưa có số thì viết `[CẦN SỐ THẬT: …]`. Công cụ soi giờ bắt
được dấu này và chặn phát hành.

**Máy soi trước, người soi sau.** Mã thoát `1` nghĩa là đừng mất thời gian kiểm thủ
công — trả bài luôn.
