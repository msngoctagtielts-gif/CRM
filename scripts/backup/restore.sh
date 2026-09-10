#!/usr/bin/env bash
#
# Phục hồi một bản sao lưu đã mã hoá vào một cơ sở dữ liệu.
#
#   TARGET_DB_URL=... BACKUP_PASSPHRASE=... ./scripts/backup/restore.sh bản-sao-lưu.tar.gpg
#
# CẢNH BÁO: lệnh này GHI ĐÈ schema public của cơ sở dữ liệu đích. Chỉ chạy vào
# project mới hoặc cơ sở dữ liệu cục bộ, đừng chạy vào project đang hoạt động.
#
# Dữ liệu tài khoản đăng nhập (schema auth) chỉ được nạp khi schema auth đã tồn
# tại ở đích — project Supabase mới luôn có sẵn; cụm PostgreSQL trắng thì không.

set -euo pipefail

: "${TARGET_DB_URL:?Thiếu TARGET_DB_URL (cơ sở dữ liệu ĐÍCH — sẽ bị ghi đè)}"
: "${BACKUP_PASSPHRASE:?Thiếu BACKUP_PASSPHRASE}"

ARCHIVE="${1:?Thiếu đường dẫn tệp sao lưu .tar.gpg}"
[[ -f "$ARCHIVE" ]] || { echo "Không thấy tệp: $ARCHIVE" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "> Giải mã"
gpg --batch --yes --decrypt --passphrase-fd 0 --output "$WORK/bundle.tar" "$ARCHIVE" <<< "$BACKUP_PASSPHRASE" 2>/dev/null
tar -C "$WORK" -xf "$WORK/bundle.tar"

echo "> Bản sao lưu này là:"
sed 's/^/    /' "$WORK/MANIFEST.txt"

# Extension phải có TRƯỚC, vì bảng dùng kiểu citext sẽ không tạo được nếu thiếu.
if [[ -s "$WORK/extensions.sql" ]]; then
  echo "> Tạo extension cần thiết"
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -q -f "$WORK/extensions.sql"
  sed 's/^/    /' "$WORK/extensions.sql"
fi

# Tài khoản đăng nhập phải nạp TRƯỚC schema public.
# Lý do: public.users.id có khoá ngoại trỏ tới auth.users(id). Nạp public trước
# thì đến lúc tạo lại khoá ngoại, auth.users còn trống và câu ALTER TABLE đổ —
# bảng public.users phục hồi xong nhưng MẤT khoá ngoại, lỗi âm thầm đúng kiểu
# chỉ phát hiện ra nhiều tháng sau.
if psql "$TARGET_DB_URL" -tAc "select 1 from information_schema.schemata where schema_name='auth'" | grep -q 1; then
  echo "> Nạp dữ liệu tài khoản đăng nhập"
  # ON_ERROR_STOP=0: bỏ qua dòng trùng khoá khi tài khoản đã có sẵn ở đích.
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=0 -q -f "$WORK/auth_data.sql" 2>&1 \
    | grep -v '^$' | sed 's/^/    /' || true
else
  echo "> Bỏ qua dữ liệu đăng nhập: cơ sở dữ liệu đích không có schema auth"
  echo "  ⚠ public.users có khoá ngoại tới auth.users — phục hồi vào cụm PostgreSQL"
  echo "    trắng thì khoá ngoại đó sẽ không tạo được. Phục hồi vào project Supabase"
  echo "    mới (luôn có schema auth) thì không gặp vấn đề này."
fi

echo "> Nạp schema public (ghi đè)"
# --clean --if-exists: xoá đối tượng cũ trước khi tạo lại, để chạy lại được
# nhiều lần mà không báo lỗi "đã tồn tại".
pg_restore --dbname="$TARGET_DB_URL" \
  --clean --if-exists --no-owner --no-privileges \
  --schema=public "$WORK/public.dump"

echo "> Kiểm lại sau phục hồi"
psql "$TARGET_DB_URL" -tAc "
  select 'bảng: ' || count(*) from information_schema.tables
   where table_schema='public' and table_type='BASE TABLE'
  union all
  select 'view: ' || count(*) from information_schema.views where table_schema='public'
  union all
  select 'policy RLS: ' || count(*) from pg_policies where schemaname='public'
  union all
  select 'khoá ngoại: ' || count(*) from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
   where c.contype = 'f' and n.nspname = 'public'
" | sed 's/^/    /'

echo "> Xong. Hãy mở giao diện và kiểm vài số liệu trước khi tin hẳn."
