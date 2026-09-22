#!/usr/bin/env bash
#
# Dựng một cluster PostgreSQL tạm, áp toàn bộ migration, rồi chạy kiểm thử
# nghiệp vụ. Không cần Docker, không chạm vào database production.
#
#   ./supabase/tests/run-local.sh
#
# Thoát với mã 0 nếu mọi assertion đều đạt.

set -euo pipefail

PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGPORT_TEST:-54329}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKDIR="$(mktemp -d)"
DB=mnee_test

if [[ ! -x "$PGBIN/initdb" ]]; then
  echo "Không tìm thấy PostgreSQL binaries. Đặt PGBIN=/đường/dẫn/bin" >&2
  exit 1
fi

cleanup() {
  "$PGBIN/pg_ctl" -D "$WORKDIR/pgdata" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "> Khởi tạo cluster tạm ($WORKDIR)"
"$PGBIN/initdb" -D "$WORKDIR/pgdata" -U postgres --auth=trust -E UTF8 >"$WORKDIR/initdb.log" 2>&1

"$PGBIN/pg_ctl" -D "$WORKDIR/pgdata" \
  -o "-k $WORKDIR -p $PORT -c listen_addresses=''" \
  -l "$WORKDIR/pg.log" -w start >/dev/null

PSQL=("$PGBIN/psql" -h "$WORKDIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -d postgres -c "create database $DB;" >/dev/null

echo "> Dựng lớp giả lập Supabase (auth schema, auth.uid)"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/00_supabase_shim.sql" >/dev/null

echo "> Áp migration"
# `create extension pg_cron` chỉ chạy được trên Supabase. Trên cluster tạm thì
# vô hiệu hoá đúng dòng đó; 00_supabase_shim.sql đã dựng sẵn cron.schedule() giả
# lập nên phần còn lại của migration chạy y như thật. KHÔNG sửa file migration —
# chỉ lọc lúc nạp.
mkdir -p "$WORKDIR/migrations"
for file in "$ROOT"/supabase/migrations/*.sql; do
  name="$(basename "$file")"
  printf '    %s\n' "$name"
  sed 's/^\([[:space:]]*\)create extension if not exists pg_cron/\1-- [kiem thu] /I' \
    "$file" > "$WORKDIR/migrations/$name"
  "${PSQL[@]}" -d "$DB" -f "$WORKDIR/migrations/$name" >/dev/null
done

echo "> Chạy kiểm thử nghiệp vụ"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/smoke.sql" 2>&1 |
  sed -e 's/^psql:[^ ]* //' -e '/^$/d'

echo
echo "OK - toàn bộ kiểm thử đạt"
