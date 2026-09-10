#!/usr/bin/env bash
#
# Netlify gọi tệp này trước mỗi lần build.
#   thoát 0   = BỎ QUA build (không tốn credit)
#   thoát != 0 = TIẾN HÀNH build
#
# Gói Free của Netlify có hạn mức cứng 300 credit/tháng, mỗi deploy production
# tốn 15 credit và dùng chung pool với băng thông — tức khoảng 20 lần deploy.
# Sửa README hay tài liệu mà cũng build lại thì hết credit giữa tháng và site
# tạm dừng tới tháng sau. Chỉ build khi có thay đổi thật sự ảnh hưởng tới app.

set -uo pipefail

# Những đường dẫn mà thay đổi ở đó BẮT BUỘC phải build lại.
WATCHED=(
  src
  public
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  postcss.config.mjs
  netlify.toml
)

# Lần build đầu, hoặc không biết commit trước đó ⇒ cứ build cho chắc.
if [[ -z "${CACHED_COMMIT_REF:-}" || -z "${COMMIT_REF:-}" ]]; then
  echo "Không xác định được commit trước — vẫn build."
  exit 1
fi

if [[ "$CACHED_COMMIT_REF" == "$COMMIT_REF" ]]; then
  echo "Không có commit mới — bỏ qua build."
  exit 0
fi

# git diff --quiet: thoát 0 khi KHÔNG có khác biệt.
if git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- "${WATCHED[@]}" 2>/dev/null; then
  echo "Chỉ có thay đổi ngoài phạm vi app (tài liệu, migration, script) — bỏ qua build."
  echo "Đường dẫn theo dõi: ${WATCHED[*]}"
  exit 0
fi

echo "Có thay đổi trong phạm vi app — tiến hành build."
git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF" -- "${WATCHED[@]}" | sed 's/^/    /'
exit 1
