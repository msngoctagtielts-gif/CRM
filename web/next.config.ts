import type { NextConfig } from 'next'

const COMMIT = process.env.COMMIT_REF ?? ''

/**
 * Website công khai — ứng dụng RIÊNG BIỆT với hệ quản trị và với cổng học viên.
 *
 * Chạy trên Cloudflare Workers qua adapter OpenNext (`wrangler.jsonc`), trong
 * khi hai app kia vẫn ở Netlify. Lý do tách ra nằm trong docs/DEPLOY.md mục 1b.
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

  /**
   * Header bảo mật cho phần do Worker render.
   *
   * Đặt ở đây thay vì trong cấu hình của nhà cung cấp để đổi nhà không mất
   * header. `public/_headers` lo phần Cloudflare phục vụ tĩnh — hai nơi cộng
   * lại mới phủ hết, vì tầng asset không chạy qua Worker.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
