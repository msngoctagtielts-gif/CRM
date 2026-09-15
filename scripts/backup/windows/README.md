# Sao lưu về máy Windows

Bản sao lưu thứ hai, nằm trên máy của Founder. Độc lập với job trên GitHub.

## Vì sao cần cả hai

| | Job trên GitHub | Script này |
|---|---|---|
| Chạy khi nào | 01:30 giờ VN mỗi đêm | 22:00 mỗi tối, hoặc bấm đúp bất cứ lúc nào |
| Tệp nằm ở đâu | Artifact của GitHub | Thư mục trên máy |
| **Bị xoá sau** | **90 ngày** | không, script giữ 30 bản gần nhất |
| Tự tắt khi nào | GitHub tắt lịch nếu repo 60 ngày không có commit | không |
| Máy hỏng thì sao | vẫn còn | **mất, trừ khi thư mục nằm trong Google Drive** |

Hai bản bù đúng điểm yếu của nhau. Tệp dùng chung một định dạng nên
`scripts/backup/restore.sh` phục hồi được cả hai.

## Cách dùng

**Sao lưu ngay một lần:** bấm đúp `SaoLuu.cmd`

**Bật sao lưu tự động mỗi ngày:** bấm đúp `DatLichTuDong.cmd` — một lần duy nhất.

Lần đầu chạy, script hỏi hai thứ:

1. **Chuỗi kết nối Supabase.** Lấy ở supabase.com → project MNEE Management
   System → nút **Connect** → tab **Session pooler** → copy trọn chuỗi, thay
   mỗi phần `[YOUR-PASSWORD]` bằng mật khẩu cơ sở dữ liệu.
2. **Mật khẩu mã hoá tệp sao lưu.** Khác mật khẩu cơ sở dữ liệu. Dùng đúng mật
   khẩu đã đặt trong secret `BACKUP_PASSPHRASE` trên GitHub thì một mật khẩu mở
   được cả hai nơi.

Các lần sau không hỏi lại. Chuỗi kết nối được mã hoá bằng DPAPI của Windows —
buộc vào đúng tài khoản Windows đang đăng nhập, máy khác mở ra chỉ thấy chuỗi
vô nghĩa.

## Script tự cài gì

Không có gì phải cài tay trước.

- **Công cụ PostgreSQL 17** — tải gói *binaries* (tệp zip) từ EnterpriseDB rồi
  giải nén vào `%LOCALAPPDATA%\MNEE-SaoLuu`. Không cài máy chủ PostgreSQL, vì
  máy này chỉ cần ĐỌC dữ liệu. Script dò lần lượt các bản 17.x từ mới tới cũ,
  lấy bản đầu tiên tải được — không ghim cứng một số hiệu để không chết khi
  EnterpriseDB gỡ bản cũ.
- **Gpg4win** — cài qua `winget`, để mã hoá AES-256.

Nếu máy chưa có `winget` hoặc mạng chặn EnterpriseDB, script dừng và chỉ rõ
đường dẫn tải thủ công.

## Tệp sao lưu nằm ở đâu

Mặc định: `Documents\MNEE-SaoLuu\mnee-backup-<ngày-giờ>.tar.gpg`

Đổi chỗ khác:

```
SaoLuu-MNEE.ps1 -ThuMucLuu "D:\Google Drive\MNEE-SaoLuu"
```

**Nên để thư mục này bên trong Google Drive hoặc OneDrive.** Máy hỏng thì bản
sao lưu nằm cùng máy cũng mất theo — khi đó script này không bù được gì cho
job trên GitHub.

## Script tự kiểm lại tệp

Mã hoá xong, script giải mã lại ngay và đọc thử danh sách tệp bên trong. Một
bản sao lưu không mở ra được thì vô nghĩa, và phải biết điều đó hôm nay chứ
không phải hôm mất dữ liệu. Không qua được bước này là script báo lỗi.

## Bên trong tệp có gì

| Tệp | Nội dung |
|---|---|
| `public.dump` | Toàn bộ schema public — cấu trúc và dữ liệu |
| `auth_data.sql` | Dữ liệu tài khoản đăng nhập. Thiếu là phục hồi xong không ai đăng nhập được |
| `extensions.sql` | Danh sách extension. `pg_dump --schema=public` không ghi `CREATE EXTENSION`; thiếu tệp này thì lúc phục hồi các cột `citext` báo "type does not exist" và cả bản sao lưu thành vô dụng |
| `MANIFEST.txt` | Sao lưu lúc nào, từ máy chủ phiên bản nào, bao nhiêu bảng |

## Xoá chuỗi kết nối đã lưu

Khi đổi mật khẩu cơ sở dữ liệu:

```
SaoLuu-MNEE.ps1 -QuenKetNoi
```

## Tắt lịch tự động

Mở **Task Scheduler** của Windows, tìm tác vụ `MNEE - Sao luu co so du lieu`.

## Phần chưa kiểm được

Script được kiểm cú pháp và chạy thử phần kiểm chuỗi kết nối (8 ca, đạt cả 8,
gồm cả ca mật khẩu chứa ký tự `@`). Ba phần chỉ chạy được trên Windows thật nên
**chưa kiểm**: tải và giải nén gói PostgreSQL từ EnterpriseDB, cài Gpg4win qua
winget, và đăng ký tác vụ trong Task Scheduler. Chạy lần đầu nếu vướng ở ba chỗ
đó, gửi lại nguyên văn thông báo lỗi.
