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
