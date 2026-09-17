#!/usr/bin/env bash
# Trả về 0 = BỎ QUA build. Chỉ build khi thư mục portal/ có thay đổi.
set -euo pipefail
if [ -z "${CACHED_COMMIT_REF:-}" ]; then exit 1; fi
if git diff --quiet "$CACHED_COMMIT_REF" "${COMMIT_REF:-HEAD}" -- .; then
  echo "portal/ khong doi — bo qua build"
  exit 0
fi
exit 1
