-- 0019 — Phân biệt video ĐANG MƯỢN với video ĐÃ SAO LƯU
--
-- Bối cảnh (D34): giáo viên tự ghi hình buổi dạy bằng Zoom rồi gửi đường dẫn
-- cho trung tâm. Đường dẫn đó trỏ vào tài khoản CỦA GIÁO VIÊN, nên trung tâm
-- không sở hữu bản ghi. Nó chết theo hai cách, cả hai đều im lặng:
--
--   1. Zoom tự xoá bản ghi khi hết hạn lưu trữ của tài khoản đó. Đây là cơ chế
--      mặc định, không phải sự cố. Link cũ trả về "file no longer exists".
--   2. Giáo viên nghỉ việc — tài khoản đi theo họ.
--
-- Báo cáo gia đình Luân–Tân ngày 30/08/2026 đã phải ghi "Buổi này chưa có video
-- lưu lại" cho buổi 8 ngày 04/08. Đó là hiện tượng này bắt đầu xảy ra.
--
-- Ba cột dưới đây KHÔNG tự cứu được video. Việc chúng làm là khiến tình trạng
-- "đang mượn" hiện ra trên màn hình thay vì chỉ lộ khi phụ huynh hỏi.

alter table recordings
  add column if not exists mirrored_url text,
  add column if not exists mirrored_at timestamptz,
  add column if not exists link_checked_at timestamptz;

comment on column recordings.url is
  'Đường dẫn gốc do giáo viên cung cấp. Thường nằm trên tài khoản Zoom của giáo viên nên có thể chết bất cứ lúc nào.';
comment on column recordings.mirrored_url is
  'Đường dẫn bản sao do trung tâm sở hữu (YouTube không công khai hoặc Drive trung tâm). Có giá trị ở đây nghĩa là video đã an toàn.';
comment on column recordings.mirrored_at is
  'Thời điểm sao lưu thành công. NULL = video vẫn đang mượn.';
comment on column recordings.link_checked_at is
  'Lần cuối kiểm tra đường dẫn gốc còn sống. Dùng để phát hiện link chết trước khi phụ huynh phát hiện.';

-- Chỉ mục cho việc quét định kỳ "video nào chưa sao lưu".
create index if not exists idx_recordings_chua_sao_luu
  on recordings (created_at)
  where mirrored_at is null and status = 'active';
