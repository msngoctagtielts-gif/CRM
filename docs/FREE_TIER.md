# Chạy thật trên gói Free của Supabase

Trung tâm chưa có ngân sách nâng Pro. Tài liệu này nói rõ **mất gì**, **bù được
đến đâu bằng công cụ miễn phí**, và **rủi ro nào không bù được**.

Kết luận ngắn: **chạy thật trên gói Free được**, với hai việc tự động phải bật.
Nhưng có một rủi ro không xoá được bằng tiền 0 đồng — đọc mục 4.

---

## 1. Gói Free thiếu gì so với Pro

| | Free | Pro (~25 USD/tháng) |
|---|---|---|
| Tạm dừng project | **Có** — sau 7 ngày ít hoạt động | Không bao giờ |
| Sao lưu hằng ngày | **Không** | Có, giữ 7 ngày |
| Tải bản sao lưu từ Dashboard | **Không** | Có |
| Khôi phục về một thời điểm (PITR) | Không | Có (mua thêm) |
| Dung lượng CSDL | 500 MB | 8 GB |
| Hỗ trợ kỹ thuật | Cộng đồng | Có đội hỗ trợ |

Hai dòng đầu mới đáng lo. **500 MB là quá thừa** cho trung tâm: toàn bộ dữ liệu
kiểm thử hiện tại nén lại chỉ **72 KB**; 21 lớp chạy vài năm vẫn chưa tới 50 MB.

---

## 2. Chống bị tạm dừng — đã tự động

Supabase dừng project Free khi CSDL **ít hoạt động trong 7 ngày liên tiếp**. Tài
liệu của họ nói: *"vài request tới database mỗi ngày trong tuần vừa rồi là đủ để
không bị dừng"*. Bị dừng thì dữ liệu **không mất**, nhưng app sập cho tới khi có
người vào Dashboard bấm **Resume** — với trung tâm đang dạy thật thì đó là mất
buổi làm việc.

`.github/workflows/keepalive.yml` gửi một truy vấn mỗi ngày lúc 8h sáng giờ Việt
Nam. GitHub Actions cho 2.000 phút/tháng với repo riêng tư; job này mất vài giây.

**Cần đặt hai secret** trong repo (Settings → Secrets and variables → Actions):

| Secret | Lấy ở đâu |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | cùng trang, khoá `anon public` |

Khoá `anon` vốn được nhúng công khai trong trình duyệt nên để ở đây không thêm
rủi ro nào.

Nếu sau này app đã triển khai, đặt thêm `APP_URL` và `CRON_SECRET` thì job cũng
chạy luôn phần quét cảnh báo chất lượng hằng ngày.

---

## 3. Tự sao lưu — đã tự động

Gói Free **không cho tải bản sao lưu**, nên phải tự dump ra ngoài.

`.github/workflows/backup.yml` chạy mỗi đêm 01:30 giờ Việt Nam:

1. Cài PostgreSQL client 17
2. `pg_dump` toàn bộ schema `public` (cấu trúc + dữ liệu) và dữ liệu tài khoản
   đăng nhập
3. Mã hoá **AES-256** bằng gpg
4. Giữ làm artifact của GitHub, 90 ngày

**Cần đặt hai secret nữa:**

| Secret | Lấy ở đâu |
|---|---|
| `SUPABASE_DB_URL` | Supabase → **Connect** → **Session pooler** → copy nguyên chuỗi, thay `[YOUR-PASSWORD]` bằng mật khẩu CSDL |
| `BACKUP_PASSPHRASE` | Tự đặt một mật khẩu dài. **Mất mật khẩu này là mất luôn bản sao lưu** — không ai giải mã hộ được. Lưu vào trình quản lý mật khẩu |

> ### ⚠ Phải dùng chuỗi "Session pooler", không dùng kết nối trực tiếp
>
> Đã kiểm bằng tra DNS thật:
>
> ```
> db.zyzxqthlgrunkxohvhku.supabase.co   IPv4: không có · IPv6: 2406:da18:...
> aws-0-ap-southeast-1.pooler...        IPv4: 52.74.252.201
> ```
>
> Kết nối trực tiếp **chỉ có IPv6**, mà máy chạy GitHub Actions **chỉ có IPv4**.
> Dùng chuỗi trực tiếp thì job sẽ treo rồi báo lỗi mạng khó hiểu.

### Sao lưu tay khi cần

```bash
export SUPABASE_DB_URL='postgresql://postgres.<ref>:<mật-khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
export BACKUP_PASSPHRASE='...'
./scripts/backup/dump.sh backups
```

### Phục hồi

```bash
export TARGET_DB_URL='...'        # project MỚI, không phải project đang chạy
export BACKUP_PASSPHRASE='...'
./scripts/backup/restore.sh backups/mnee-backup-YYYYMMDD-HHMMSS.tar.gpg
```

Quy trình đầy đủ khi phải dựng lại từ đầu:

1. Tạo project Supabase mới
2. Áp toàn bộ migration trong `supabase/migrations/` (tạo lại cả trigger nằm
   ngoài schema `public`)
3. Chạy `restore.sh` — nạp tài khoản đăng nhập trước, rồi ghi đè schema `public`
4. Đổi `NEXT_PUBLIC_SUPABASE_URL` và các khoá trong biến môi trường của app

**Đã kiểm thật, không phải lý thuyết.** Dump từ một CSDL có đủ 35 bảng và dữ
liệu, phục hồi sang CSDL trắng khác, rồi đối chiếu:

```
trước: students=8 classes=6 lessons=17 reports=3 enrollments=8
       consumptions=16 payables=16 revenue=4598000.00 tuition_rates=4 authusers=3
sau  : students=8 classes=6 lessons=17 reports=3 enrollments=8
       consumptions=16 payables=16 revenue=4598000.00 tuition_rates=4 authusers=3
→ KHỚP TUYỆT ĐỐI · 35 bảng · 10 view · 69 policy RLS · 106 khoá ngoại
```

Hai lỗi phát hiện khi kiểm và đã vá:

1. `pg_dump --schema=public` **không ghi câu `CREATE EXTENSION`**. Thiếu `citext`
   ở đích thì bảng không tạo được và cả bản sao lưu thành vô dụng — lần thử đầu
   hỏng 142 câu lệnh. Nay danh sách extension được lưu kèm.
2. **Thứ tự nạp sai.** `public.users` có khoá ngoại tới `auth.users`, nên phải
   nạp tài khoản trước. Nạp ngược lại thì bảng phục hồi xong nhưng **mất khoá
   ngoại** — lỗi âm thầm, nhiều tháng sau mới lộ.

---

## 4. Rủi ro KHÔNG bù được bằng 0 đồng

Nói thẳng để cô quyết định có ý thức:

**Cửa sổ mất dữ liệu tối đa 24 giờ.** Bản sao lưu chạy mỗi đêm. Nếu CSDL hỏng
lúc 4h chiều, mọi thứ nhập từ 1h30 sáng hôm đó mất hẳn. Pro + PITR thu hẹp còn
vài giây. Với trung tâm, mất một ngày nhập liệu là **nhập lại được** từ sheet và
trí nhớ giáo viên — khó chịu, không phải thảm hoạ. Nhưng phải biết trước.

**Giảm bớt mà không tốn tiền:** đổi `cron` của backup thành 2 lần/ngày (thêm một
mốc buổi trưa) là còn 12 giờ. Chi phí vẫn 0 đồng.

**Không có hỗ trợ kỹ thuật.** Supabase lỗi phía họ thì chỉ còn diễn đàn cộng
đồng.

**GitHub tự tắt workflow theo lịch** nếu repo không có commit nào trong 60 ngày.
GitHub gửi email báo trước; vào tab **Actions** bấm bật lại là xong.

---

## 5. Khi nào nên nâng Pro

Không phải bây giờ. Nâng khi có **một** trong các dấu hiệu:

- Cửa sổ mất 24 giờ trở nên không chấp nhận được (nhiều giáo viên nhập liệu
  hằng ngày, nhập lại quá tốn công)
- Có người ngoài Founder phụ thuộc vào hệ thống để làm việc, sập là cả trung tâm
  đứng
- CSDL vượt 400 MB (còn rất xa)
- Cần khôi phục về một thời điểm bất kỳ vì đã từng xoá nhầm dữ liệu thật

Cho tới lúc đó, hai workflow trên là đủ để chạy thật một cách có trách nhiệm.

---

## 5b. Nhắc chốt tháng — `month-end-reminder.yml`

Nhịp vận hành của trung tâm có hai mốc cố định: **chốt lương ngày cuối tháng**,
**trả lương từ mùng 1 đến mùng 3**. Job này mở một issue trên GitHub đúng hai mốc
đó, kèm số liệu tháng vừa qua. GitHub tự gửi email cho chủ repo, nên không cần
dịch vụ gửi email nào và không phát sinh phí.

| Mốc | Lịch chạy | Issue mở ra |
|---|---|---|
| Ngày cuối tháng | 07:30 giờ VN | *Chốt lương tháng MM/YYYY* — soát buổi thiếu giờ dạy, rồi tính lương |
| Mùng 1 | 07:30 giờ VN | *Trả lương và thu học phí — kỳ MM/YYYY* — chuyển lương, nhắc phí, xem tình hình |

Mỗi issue là một danh sách việc có ô tích. Tích xong từng việc là có luôn bằng
chứng tháng đó đã làm gì — không cần ghi sổ riêng.

Lịch chạy là `30 0 28-31 * *`, không phải `31 * *`: viết ngày 31 sẽ bỏ qua mọi
tháng 30 ngày và cả tháng Hai. Job tự kiểm hôm nay có phải ngày cuối tháng
không, chưa tới thì dừng im lặng.

Nội dung issue chỉ có **số đếm và số tiền tổng** — không có tên học viên, tên
phụ huynh hay số điện thoại. Issue và email GitHub nằm ngoài vòng kiểm soát của
hệ thống; chi tiết thì đã có trang `/month-end` với RLS canh.

Chạy thử không cần chờ tới lịch: tab **Actions** → *Nhắc chốt tháng* → **Run
workflow** → chọn mốc muốn thử.

---

## 6. Danh sách secret cần đặt

Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Bắt buộc | Dùng cho |
|---|---|---|
| `SUPABASE_URL` | ✅ | keepalive |
| `SUPABASE_ANON_KEY` | ✅ | keepalive |
| `SUPABASE_DB_URL` | ✅ | sao lưu (chuỗi **Session pooler**) |
| `BACKUP_PASSPHRASE` | ✅ | sao lưu (tự đặt, lưu kỹ) |
| `APP_URL` | ⬜ | quét cảnh báo + số liệu trong issue nhắc chốt tháng |
| `CRON_SECRET` | ⬜ | quét cảnh báo + số liệu trong issue nhắc chốt tháng |

Hai secret cuối không bắt buộc: thiếu chúng thì job nhắc chốt tháng vẫn mở issue
đúng hẹn, chỉ là không kèm số liệu. Thiếu số liệu không phải lý do để bỏ nhắc
việc trả lương.

Đặt xong, vào tab **Actions**, chọn từng workflow và bấm **Run workflow** để chạy
thử ngay thay vì chờ tới lịch.
