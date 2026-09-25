# Công cụ soi lỗi website

> Cài lên máy khác (ví dụ máy có mã nguồn website) bằng hai dòng:
> ```
> curl.exe -sSLO https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e/scripts/web-audit/cai-dat.mjs
> node cai-dat.mjs
> ```
> Chi tiết: [`docs/website/CAI-DAT-TREN-MAY.md`](../../docs/website/CAI-DAT-TREN-MAY.md)

Soi một trang web và chỉ ra chỗ chưa hoàn thiện — thiếu thẻ, ảnh không alt, nội dung
còn dở dang, lời hứa quá mức, lỗi tiếp cận, lỗi hiệu năng.

Chỉ cần **Node 20 trở lên**. Không cài thêm thư viện nào.

## Dùng

```bash
# Soi trang đang chạy
node scripts/web-audit/audit.mjs https://msngoc-elite-english.pages.dev

# Soi trang hồ sơ cá nhân (bộ luật hơi khác)
node scripts/web-audit/audit.mjs https://msngoc-folio.pages.dev --profile=ca-nhan

# Soi tệp đã lưu về máy (dùng khi mạng bị chặn)
node scripts/web-audit/audit.mjs ./trang-da-luu.html

# Soi cả một thư mục mã nguồn
node scripts/web-audit/audit.mjs ./site

# Lấy kết quả dạng JSON cho agent khác đọc
node scripts/web-audit/audit.mjs ./site --json
```

| Tuỳ chọn | Tác dụng |
|---|---|
| `--json` | In JSON thay vì báo cáo chữ |
| `--quiet` | Chỉ in phần tổng kết |
| `--profile=trung-tam \| ca-nhan` | Chọn bộ luật. Mặc định đoán theo tên trang (có chữ `folio` → `ca-nhan`) |

**Mã thoát:** `1` nếu còn lỗi mức nghiêm trọng, `0` nếu không, `2` nếu không đọc
được trang. Dùng được trong CI.

## Khi mạng bị chặn

Một số môi trường chặn truy cập ra `*.pages.dev`. Khi đó:

1. Mở trang trong trình duyệt
2. `Ctrl+S` → chọn *Webpage, Complete* → lưu tệp `.html`
3. `node scripts/web-audit/audit.mjs ./tep-vua-luu.html`

## Ba mức

| Mức | Nghĩa |
|---|---|
| **NGHIÊM TRỌNG** | Đang mất học viên ngay lúc này. Sửa trước khi làm bất cứ việc gì khác |
| **CẦN SỬA** | Làm mất niềm tin hoặc khiến không ai tìm thấy trang |
| **NÊN CẢI THIỆN** | Bào mòn dần trải nghiệm |

## Bộ luật

| Nhóm | Soi cái gì |
|---|---|
| Kỹ thuật | `lang`, bảng mã, viewport, favicon, id trùng |
| Tìm kiếm & chia sẻ | `<title>`, mô tả, canonical, Open Graph, JSON-LD |
| Khả năng tiếp cận | alt của ảnh, cấp bậc tiêu đề, nhãn ô nhập, nút và liên kết không chữ |
| Nội dung & uy tín | nội dung còn dở dang, liên kết chết, kênh liên hệ, bằng chứng uy tín, lời hứa quá mức, độ dày nội dung |
| An toàn | tài nguyên `http://`, `target="_blank"` thiếu `rel="noopener"` |
| Hiệu năng | ảnh thiếu kích thước, thiếu `loading="lazy"`, script chặn vẽ, trang nặng |

Mỗi phát hiện đều in kèm **mã luật** (ví dụ `hua-qua-muc`) và **cách sửa cụ thể**.

## Công cụ này không thay được người

Nó không đọc được nội dung có thuyết phục hay không, không biết ảnh có đẹp không,
không biết con số trên trang có thật không. Chạy xong vẫn phải đi
`docs/website/DANH-MUC-KIEM-TRA.md`.

## Thêm luật mới

Mở `audit.mjs`, thêm một lời gọi `luat(ma, nhom, ham)`. Hàm nhận
`{ html, chu, nhan, profile }` và trả mảng `{ muc, thongDiep, cachSua, dong? }`.
