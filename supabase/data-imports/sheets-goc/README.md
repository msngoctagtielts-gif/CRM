# Bản sao sheet feedback gốc

Thư mục này giữ bản sao nội dung các sheet feedback của lớp, dạng văn bản.

## Vì sao cần

Ngày 16/09/2026, sheet lớp Thảo - Ms. Phương
(`1LFQ2FdsxQlWrCwnrf54gbOyvqbs2F5xY74Qf7hOkf6I`) đang đọc được bình thường thì
sau đó khoảng mười phút trở thành không truy cập được, cô Ngọc báo file hiện ở
thùng rác. Toàn bộ 46 buổi học của lớp — tương đương hơn bốn tháng dạy — chỉ
còn tồn tại ở bản sao này.

Nhiều sheet feedback KHÔNG thuộc tài khoản trung tâm. Ví dụ "FEEDBACK - Ms. Dung"
thuộc `milly291205@gmail.com`. Giáo viên xoá sheet của họ là trung tâm mất trắng
dữ liệu buổi học, không lấy lại được.

## Cách tạo bản sao

Đọc sheet qua Google Drive rồi lưu phần `fileContent` ra tệp `.md`. Bộ đọc trong
`supabase/data-imports/scripts/doc_sheet.py` đọc lại được tệp này y như đọc sheet
gốc, nên có thể nạp lại vào cơ sở dữ liệu bất cứ lúc nào.

## Việc nên làm

Chuyển toàn bộ sheet feedback về một thư mục Drive do tài khoản trung tâm sở hữu,
và chỉ chia sẻ quyền sửa cho giáo viên. Quyền sở hữu mới là thứ quyết định ai
xoá được file, không phải quyền chia sẻ.

## Vì sao nằm ở đây, không nằm ở `backups/`

Bản sao đầu tiên đặt ở `backups/sheets/`. Dòng 25 của `.gitignore` bỏ qua cả thư
mục `backups/` (đúng, vì nơi đó chứa bản kết xuất cơ sở dữ liệu và thông tin kết
nối). Hệ quả là bản sao không hề được commit — nó chỉ tồn tại trong máy ảo của
phiên làm việc và sẽ mất khi phiên kết thúc. Chuyển sang đây để git thật sự theo
dõi.

## Kiểm chứng bản sao này đọc lại được

```
python3 supabase/data-imports/scripts/doc_sheet.py \
  supabase/data-imports/sheets-goc/2026-09-16_thao-ms-phuong_sheet-goc.md ra.json
```

Chạy ngày 16/09/2026 cho: 45 buổi có nội dung, từ 16/05/2026 đến 28/08/2026,
Trang 27 buổi và Ms Phương 18 buổi. Buổi thứ 19 của Ms. Phương là 25/07, sheet
ghi "Chia phòng không quay được video" và không có nội dung nên bộ đọc bỏ qua.
