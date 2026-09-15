import type { NextConfig } from 'next'

/**
 * Dấu phiên bản của bản build.
 *
 * Ngày 15/09/2026 Founder mở app và không thấy các màn hình mới, vì bản đang
 * chạy cũ hơn code đã đẩy lên — nhưng không có cách nào nhìn ra điều đó ngoài
 * việc đoán. Mất cả buổi để phát hiện.
 *
 * Netlify đặt sẵn COMMIT_REF và BRANCH lúc build. Đọc ở đây rồi nướng vào bản
 * build, để màn hình tự nói nó là bản nào. Chạy trên máy thì không có biến đó,
 * rơi về "bản chạy trên máy".
 */
const COMMIT =
  process.env.COMMIT_REF ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  ''

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: COMMIT.slice(0, 7),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
}

export default nextConfig
