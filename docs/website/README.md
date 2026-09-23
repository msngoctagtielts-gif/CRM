# Dây chuyền làm website — sáu nhân sự AI

Hai website cần hoàn thiện:

| Địa chỉ | Là gì | Người đọc chính |
|---|---|---|
| `msngoc-elite-english.pages.dev` | Trang trung tâm | Phụ huynh và người đi làm đang tìm chỗ học |
| `msngoc-folio.pages.dev` | Hồ sơ nghề nghiệp cá nhân | Đối tác, nơi tuyển dụng, học viên tra cứu người dạy |

---

## Sáu vai trò và cách họ nối với nhau

```
   web-auditor ──────────┐          (soi trang đang chạy, tìm chỗ chưa hoàn thiện)
                         ▼
                   web-planner      (quyết định làm gì, thứ tự nào, xong là thế nào)
                    │        │
        ┌───────────┘        └───────────┐
        ▼                                ▼
  web-designer ────────────────────► web-copywriter
   (bố cục, màu, chữ,                 (nội dung tiếng Việt,
    trạng thái, CSS)                   bằng chứng uy tín)
        │                                │
        └───────────┬────────────────────┘
                    ▼
               web-builder            (dựng HTML/CSS/JS thật)
                    │
                    ▼
                 web-qa               (chặn hoặc cho qua — người duy nhất nói "xong")
                    │
          ┌─────────┴─────────┐
      cho qua              trả bài
          │                     │
          ▼                     └──► quay lại web-builder
       phát hành
```

| Vai trò | Tệp | Làm gì | Không làm gì |
|---|---|---|---|
| `web-auditor` | `.claude/agents/web-auditor.md` | Soi trang đang chạy, xếp hạng vấn đề theo thiệt hại | Không sửa |
| `web-planner` | `.claude/agents/web-planner.md` | Sơ đồ trang, thứ tự làm, tiêu chí xong, giao việc | Không viết mã, không viết chữ |
| `web-designer` | `.claude/agents/web-designer.md` | Bố cục, thang chữ, màu, trạng thái, CSS | Không viết nội dung |
| `web-copywriter` | `.claude/agents/web-copywriter.md` | Toàn bộ chữ tiếng Việt, bằng chứng uy tín | Không quyết bố cục |
| `web-builder` | `.claude/agents/web-builder.md` | Dựng mã, tối ưu tốc độ | Không tự đổi chữ đã duyệt |
| `web-qa` | `.claude/agents/web-qa.md` | Kiểm máy và kiểm người, chặn hoặc cho qua | Không sửa lỗi |

---

## Gọi một vai trò

Trong Claude Code, gọi thẳng tên:

```
Dùng web-auditor soi https://msngoc-elite-english.pages.dev
Dùng web-planner lên kế hoạch từ báo cáo vừa rồi
Dùng web-qa kiểm lại trang chủ trước khi đẩy
```

---

## Ba luật của cả dây chuyền

**1. Không ai được tự tuyên bố mình xong.**
`web-builder` nộp bài, `web-qa` mới là người nói xong. Đây là lý do hai vai trò này
tách nhau — người dựng luôn nhìn sót lỗi của chính mình.

**2. Không có số bịa.**
Mọi con số về học viên, kết quả, tỷ lệ phải lấy từ hệ thống quản lý MNEE hoặc do cô
Ngọc xác nhận. Khi chưa có, viết `[CẦN SỐ THẬT: …]` trong bản thảo. `web-qa` chặn
phát hành nếu còn dấu này.

**3. Máy soi trước, người soi sau.**
```bash
node scripts/web-audit/audit.mjs <url hoặc thư mục>
```
Mã thoát `1` = còn lỗi nghiêm trọng. Đừng mất thời gian kiểm thủ công một bản chưa
qua được bước máy.

---

## Tài liệu kèm theo

| Tệp | Nội dung |
|---|---|
| [`BAN-GIAO.md`](BAN-GIAO.md) | **Bắt đầu đọc ở đây** — đã giao gì, đã kiểm gì, còn treo gì |
| [`CAI-DAT-TREN-MAY.md`](CAI-DAT-TREN-MAY.md) | Chép sáu nhân sự và công cụ soi sang máy làm website (`C:\Users\User\MNEE-OS`) |
| [`KE-HOACH-XAY-DUNG.md`](KE-HOACH-XAY-DUNG.md) | Sơ đồ trang, bốn giai đoạn, tiêu chí xong |
| [`UY-TIN.md`](UY-TIN.md) | Bằng chứng uy tín cần thu thập, và lời hứa bị cấm |
| [`DANH-MUC-KIEM-TRA.md`](DANH-MUC-KIEM-TRA.md) | Danh mục `web-qa` đi qua trước mỗi lần phát hành |
| [`khoi-founder.md`](khoi-founder.md) | Bản sửa khối Founder trang chủ — mã dán được, kèm ba con số cần có |
| [`../../scripts/web-audit/README.md`](../../scripts/web-audit/README.md) | Cách dùng công cụ soi lỗi |
