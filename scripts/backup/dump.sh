#!/usr/bin/env bash
#
# Sao lưu cơ sở dữ liệu ra một tệp đã mã hoá.
#
#   SUPABASE_DB_URL=... BACKUP_PASSPHRASE=... ./scripts/backup/dump.sh [thư-mục-ra]
#
# Vì sao cần: gói Free của Supabase KHÔNG cho tải bản sao lưu. Mất dữ liệu là
# mất hợp đồng, học phí và báo cáo của cả trung tâm, nên phải tự sao lưu ra
# ngoài. Xem docs/FREE_TIER.md.
#
# Tệp kết quả được mã hoá đối xứng AES-256 bằng gpg, nên để trên GitHub hay
# Google Drive đều không lộ dữ liệu học viên.

set -euo pipefail

: "${SUPABASE_DB_URL:?Thiếu SUPABASE_DB_URL (chuỗi kết nối Session pooler)}"
: "${BACKUP_PASSPHRASE:?Thiếu BACKUP_PASSPHRASE (mật khẩu giải mã bản sao lưu)}"

# --- Kiểm chuỗi kết nối TRƯỚC khi gọi psql -----------------------------------
#
# Lịch sử của khối này, vì nó dạy một bài học:
#
# Ngày 15/09/2026 job hỏng với "password authentication failed for user
# postgres". Chẩn đoán đầu tiên đổ cho TÊN ĐĂNG NHẬP thiếu mã dự án. SAI. Tài
# liệu Supabase nói rõ tên đăng nhập sai cho ra "Tenant or user not found",
# KHÔNG phải lỗi xác thực; còn "a valid username with the wrong password lands
# here". Founder sửa tên đăng nhập, chạy lại 3 lần, vẫn hỏng y hệt.
#
# Nguyên nhân thật gần như luôn là MẬT KHẨU, và cái bẫy hay gặp nhất là mật
# khẩu có ký tự đặc biệt chưa được percent-encode. Supabase viết: "A password
# that works in a GUI field can fail in a URI for this reason alone."
#
# Nên khối này kiểm mật khẩu trước, tên đăng nhập sau.
# Không in mật khẩu ra log ở bất kỳ nhánh nào.

_sau_scheme="${SUPABASE_DB_URL#*://}"
# Userinfo kết thúc ở dấu @ CUỐI CÙNG, không phải dấu @ đầu tiên (RFC 3986).
# Tách theo dấu @ đầu tiên là hỏng ngay khi mật khẩu có chứa @.
_dinh_danh="${_sau_scheme%@*}"
_may_chu="${_sau_scheme##*@}"
_nguoi_dung="${_dinh_danh%%:*}"
_mat_khau="${_dinh_danh#*:}"
_may_chu="${_may_chu%%[:/]*}"

if [[ "$_dinh_danh" == *"YOUR-PASSWORD"* ]]; then
  echo "LỖI: chuỗi kết nối còn nguyên chỗ giữ mật khẩu [YOUR-PASSWORD]." >&2
  echo "      Thay nó bằng mật khẩu cơ sở dữ liệu thật rồi lưu lại secret." >&2
  exit 1
fi

if [[ "$_dinh_danh" != *:* || -z "$_mat_khau" ]]; then
  echo "LỖI: chuỗi kết nối không có phần mật khẩu." >&2
  exit 1
fi

# Ký tự phải percent-encode khi nằm trong chuỗi kết nối. Không mã hoá thì URI
# bị cắt hoặc hiểu sai, và Postgres báo y như sai mật khẩu.
#   #  cắt cụt toàn bộ phần sau — nguy hiểm nhất vì hỏng hoàn toàn im lặng
#   ?  bắt đầu phần tham số
#   @  kết thúc phần đăng nhập
#   /  bắt đầu phần đường dẫn
#   :  ngăn cách tên đăng nhập với mật khẩu
#   &  ngăn cách tham số
_ky_tu_cam=''
for _kt in '#' '?' '@' '/' ':' '&' ' '; do
  [[ "$_mat_khau" == *"$_kt"* ]] && _ky_tu_cam+="$_kt"
done

if [[ -n "$_ky_tu_cam" ]]; then
  echo "LỖI: mật khẩu chứa ký tự phải mã hoá: $_ky_tu_cam" >&2
  echo "      Trong chuỗi kết nối, các ký tự này phải viết dưới dạng percent-encode:" >&2
  echo "        #  ->  %23      ?  ->  %3F      @  ->  %40" >&2
  echo "        /  ->  %2F      :  ->  %3A      &  ->  %26      (dấu cách) -> %20" >&2
  echo "      Cách gọn hơn: đổi mật khẩu cơ sở dữ liệu sang loại CHỈ CÓ chữ và số." >&2
  echo "      Supabase → Database → Settings → Reset database password." >&2
  exit 1
fi

if [[ "$_may_chu" == *pooler.supabase.com && "$_nguoi_dung" != *.* ]]; then
  echo "LỖI: tên đăng nhập '$_nguoi_dung' thiếu mã dự án." >&2
  echo "      Pooler dùng chung đòi dạng postgres.<project-ref>, không phải postgres." >&2
  echo "      Máy chủ đang dùng: $_may_chu" >&2
  exit 1
fi

echo "> Chuỗi kết nối hợp lệ · người dùng $_nguoi_dung · máy chủ $_may_chu"

OUT_DIR="${1:-backups}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$OUT_DIR"

echo "> Kiểm phiên bản pg_dump so với máy chủ"
SERVER_VERSION="$(psql "$SUPABASE_DB_URL" -tAc 'show server_version' | tr -d '[:space:]')"
CLIENT_VERSION="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
SERVER_MAJOR="${SERVER_VERSION%%.*}"
echo "  máy chủ $SERVER_VERSION · pg_dump $CLIENT_VERSION"
if [[ "$CLIENT_VERSION" -lt "$SERVER_MAJOR" ]]; then
  echo "LỖI: pg_dump $CLIENT_VERSION cũ hơn máy chủ $SERVER_MAJOR — pg_dump sẽ từ chối chạy." >&2
  echo "      Cài postgresql-client-$SERVER_MAJOR rồi chạy lại." >&2
  exit 1
fi

# 1) Toàn bộ schema public: cấu trúc + dữ liệu, định dạng custom để nén và
#    phục hồi chọn lọc được.
echo "> Dump schema public"
pg_dump "$SUPABASE_DB_URL" \
  --schema=public --format=custom --compress=9 \
  --no-owner --no-privileges \
  --file="$WORK/public.dump"

# 2) Tài khoản đăng nhập. Chỉ lấy DỮ LIỆU của bảng auth, không lấy cấu trúc —
#    cấu trúc schema auth do Supabase tự quản lý và tự tạo lại ở project mới.
#    Thiếu phần này thì phục hồi xong không ai đăng nhập được.
echo "> Dump tài khoản đăng nhập (auth)"
pg_dump "$SUPABASE_DB_URL" \
  --data-only --format=plain --no-owner --no-privileges \
  --table=auth.users --table=auth.identities \
  --file="$WORK/auth_data.sql"

# 3) Danh sách extension. `pg_dump --schema=public` KHÔNG ghi câu
#    CREATE EXTENSION, nên nếu không lưu riêng thì lúc phục hồi các cột kiểu
#    citext sẽ lỗi "type does not exist", bảng không tạo được và cả bản sao lưu
#    thành vô dụng. Lấy từ chính cơ sở dữ liệu nên migration sau thêm extension
#    mới thì bản sao lưu tự biết.
echo "> Ghi danh sách extension"
psql "$SUPABASE_DB_URL" -tAc "
  select 'create extension if not exists ' || quote_ident(extname) || ';'
    from pg_extension
   where extname <> 'plpgsql'
   order by extname" > "$WORK/extensions.sql"
sed 's/^/    /' "$WORK/extensions.sql"

# 4) Ghi lại bối cảnh để người phục hồi biết bản này là của đâu, lúc nào.
cat > "$WORK/MANIFEST.txt" <<META
Bản sao lưu MNEE Management System
Thời điểm (UTC) : $(date -u +'%Y-%m-%d %H:%M:%S')
Máy chủ Postgres: $SERVER_VERSION
pg_dump         : $(pg_dump --version)
Số bảng public  : $(psql "$SUPABASE_DB_URL" -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'" | tr -d '[:space:]')
Số migration    : $(psql "$SUPABASE_DB_URL" -tAc "select count(*) from supabase_migrations.schema_migrations" 2>/dev/null | tr -d '[:space:]' || echo 'không đọc được')

Cách phục hồi: xem scripts/backup/restore.sh và docs/FREE_TIER.md
META

echo "> Đóng gói và mã hoá"
tar -C "$WORK" -cf "$WORK/bundle.tar" public.dump auth_data.sql extensions.sql MANIFEST.txt

ARCHIVE="$OUT_DIR/mnee-backup-$STAMP.tar.gpg"
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase-fd 0 --output "$ARCHIVE" "$WORK/bundle.tar" <<< "$BACKUP_PASSPHRASE"

SIZE="$(du -h "$ARCHIVE" | cut -f1)"
echo "> Xong: $ARCHIVE ($SIZE)"

# Kiểm ngay là giải mã được. Một bản sao lưu không mở ra được thì vô nghĩa, và
# phải biết điều đó ngay hôm nay chứ không phải hôm mất dữ liệu.
echo "> Thử giải mã lại để chắc chắn tệp dùng được"
gpg --batch --yes --decrypt --passphrase-fd 0 --output "$WORK/verify.tar" "$ARCHIVE" <<< "$BACKUP_PASSPHRASE" 2>/dev/null
tar -tf "$WORK/verify.tar" >/dev/null
echo "> Giải mã và đọc được danh sách tệp — bản sao lưu hợp lệ"
