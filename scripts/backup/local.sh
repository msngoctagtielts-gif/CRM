#!/usr/bin/env bash
#
# Sao lưu từ MÁY CỦA CÔ NGỌC, không phụ thuộc GitHub.
#
#   ./scripts/backup/local.sh
#
# Vì sao có thêm bản này khi đã có GitHub Actions:
#
#   · Artifact của GitHub tự xoá sau 90 ngày. Bản trên máy thì không.
#   · GitHub tự tắt workflow theo lịch nếu repo không có commit nào trong 60
#     ngày — nghĩa là đúng lúc hệ thống đã ổn định và không ai sửa code nữa thì
#     việc sao lưu lặng lẽ dừng.
#   · Hai nơi lưu độc lập mới gọi là có sao lưu. Một nơi chỉ là một điểm hỏng.
#
# Thông tin kết nối đọc từ tệp .env.backup cạnh tệp này. Tệp đó KHÔNG bao giờ
# được commit lên GitHub (đã nằm trong .gitignore).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$HERE/.env.backup"
GIU_LAI="${GIU_LAI:-12}"   # số bản sao lưu giữ lại trên máy

if [[ ! -f "$ENV_FILE" ]]; then
  cat >&2 <<HUONGDAN
Chưa có tệp $ENV_FILE

Tạo tệp đó với đúng hai dòng sau (thay bằng giá trị thật):

  SUPABASE_DB_URL='postgresql://postgres.zyzxqthlgrunkxohvhku:MAT_KHAU@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
  BACKUP_PASSPHRASE='mat-khau-ma-hoa-ban-sao-luu'

Lưu ý tên người dùng phải là postgres.zyzxqthlgrunkxohvhku — có dấu chấm và mã
dự án phía sau. Chỉ ghi "postgres" là máy chủ từ chối.

Lấy chuỗi kết nối: supabase.com > dự án > nút Connect > tab Session pooler.
HUONGDAN
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

THU_MUC="${THU_MUC_SAO_LUU:-$HOME/MNEE-Backups}"
mkdir -p "$THU_MUC"

echo "> Sao lưu vào $THU_MUC"
"$HERE/dump.sh" "$THU_MUC"

# Dọn bản cũ để ổ đĩa không đầy dần. Mỗi bản vài MB nên 12 bản là thừa đủ.
SO_BAN="$(find "$THU_MUC" -maxdepth 1 -name 'mnee-backup-*.tar.gpg' | wc -l | tr -d ' ')"
if (( SO_BAN > GIU_LAI )); then
  echo "> Có $SO_BAN bản, giữ lại $GIU_LAI bản mới nhất"
  find "$THU_MUC" -maxdepth 1 -name 'mnee-backup-*.tar.gpg' -print0 \
    | sort -z \
    | head -z -n "-$GIU_LAI" \
    | xargs -0 -r rm -v
fi

echo
echo "Các bản đang có trên máy:"
ls -lh "$THU_MUC"/mnee-backup-*.tar.gpg | tail -5
