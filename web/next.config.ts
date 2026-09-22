import type { NextConfig } from 'next'

const COMMIT = process.env.COMMIT_REF ?? ''

/**
 * Website công khai — ứng dụng RIÊNG BIỆT với hệ quản trị và với cổng học viên.
 *
 * Không import bất cứ thứ gì từ ../src hay ../portal/src. Đây là website duy
 * nhất trong ba website được phép cho người chưa đăng nhập vào, nên nó phải là
 * bản build không chứa một dòng mã quản trị nào — kể cả mã JavaScript gửi xuống
 * trình duyệt.
 *
 * Chung duy nhất một thứ với hai app kia: cơ sở dữ liệu Supabase. Và ở đó nó
 * chỉ gọi được đúng MỘT hàm — `dang_ky_tu_van` — không đọc được bảng nào.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: COMMIT.slice(0, 7),
  },
}

export default nextConfig
