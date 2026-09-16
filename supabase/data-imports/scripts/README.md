# Bộ công cụ nạp feedback lịch sử (trước 01/09/2026)

Trước tháng 9/2026 giáo viên ghi nội dung buổi học vào Google Sheets riêng của
từng lớp, không nhập vào hệ thống. Thư mục này là bộ công cụ đã dùng để đưa số
liệu đó vào CSDL, giữ lại để khi cần đối chiếu còn biết dữ liệu từ đâu ra.

| Tệp | Việc |
|---|---|
| `sheet_ids.txt` | ID sheet feedback của 21 lớp, lấy từ sheet DANH SÁCH LỚP |
| `lop.txt` | Tên lớp trong CSDL ↔ tên tệp làm việc, kèm tiến độ đã nạp |
| `doc_sheet.py` | Đọc sheet dạng markdown thành JSON từng buổi |
| `doc_thienai.py` | Bản riêng cho sheet Thiên Ái (bố cục band IELTS, khác hẳn) |
| `lay_transcript.py` | Lấy lại nội dung sheet từ bản ghi phiên, khỏi đọc lại |
| `loc.py` | Lọc ra những buổi trong hệ thống còn thiếu báo cáo |
| `sinh_gon.py` | Sinh lệnh `fn_nhap_feedback` (xem migration 0024) |

## Ba chốt an toàn

**Ngày.** Mỗi giáo viên ghi một kiểu: `24/09/2025`, `10/15/25` kiểu Mỹ,
`2025-12-05`, `August 10, 2026`. `doc_sheet.py` sinh HẾT các cách đọc hợp lệ của
một ô, rồi `sinh_gon.py` đối chiếu với ngày thật trong CSDL. Chỉ một ứng viên
khớp thì lấy; không khớp hoặc khớp từ hai trở lên thì BỎ QUA và in ra. Không bao
giờ đoán. Trường hợp cả hai cách đọc đều có thật (08/02 = 8 tháng 2 hay 2 tháng
8, lớp Tân có cả hai) thì dựa vào THỨ TỰ DÒNG trong sheet, và in rõ là đã suy.

**Nhãn đánh giá.** Sheet ghi tiếng Việt, CSDL ràng buộc 5 mã cố định. Ánh xạ
theo VỊ TRÍ TRÊN THANG, không dịch từng chữ. Đây là diễn giải của hệ thống chứ
không phải sự thật tuyệt đối, nên chữ gốc của giáo viên được giữ nguyên trong
`teaching_report_students.comments` để không mất gì.

**Buổi trống.** Dòng không có chủ đề, nội dung, điểm mạnh, cần cải thiện lẫn bài
tập thì KHÔNG nạp. Một báo cáo rỗng còn tệ hơn là không có báo cáo: màn hình
Chất lượng sẽ đếm buổi đó là "đã có hồ sơ" trong khi thật ra chưa có gì.

## Cách chạy

```bash
python3 lay_transcript.py '<chuỗi nhận dạng sheet>' lop.md   # hoặc đọc từ Drive
python3 doc_sheet.py lop.md lop_rows.json
python3 sinh_gon.py '<Tên lớp trong CSDL>' lop_rows.json ngay/lop.txt lop.sql
```

`ngay/<lop>.txt` là danh sách ngày buổi học có thật trong CSDL của lớp đó.
`sinh_gon.py` chia nhỏ payload vì kết quả quá dài sẽ bị cắt khi truyền.
