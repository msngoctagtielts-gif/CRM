import type { NextConfig } from 'next'

const COMMIT = process.env.COMMIT_REF ?? ''

/**
 * Cổng thông tin học viên — ứng dụng RIÊNG BIỆT với hệ quản trị.
 *
 * Không import bất cứ thứ gì từ ../src. Đó là chủ đích: nếu hai bên dùng chung
 * mã nguồn thì một thay đổi bên quản trị có thể vô tình kéo màn hình quản trị
 * sang cổng. Hai app, hai bản build, hai tên miền.
 *
 * Chung duy nhất một thứ: cơ sở dữ liệu Supabase. Và ở đó cổng chỉ đọc được
 * bốn view đã lọc cứng theo tài khoản đăng nhập.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: COMMIT.slice(0, 7),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
}

export default nextConfig
