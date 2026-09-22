import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Cấu hình OpenNext cho Cloudflare Workers.
 *
 * CỐ Ý ĐỂ TRỐNG — và đây là lựa chọn, không phải bỏ sót.
 *
 * Mẫu mặc định của adapter bật `incrementalCache` dùng R2. Website này không
 * cần: mọi trang đều dựng sẵn lúc build (không có `revalidate`, không có ISR),
 * nên không có gì để lưu đệm giữa các lần chạy. Bật R2 chỉ thêm một dịch vụ
 * phải tạo, phải theo dõi hạn mức, và trên nhiều tài khoản còn đòi gắn thẻ
 * thanh toán — đổi lại không được gì.
 *
 * Cũng vì vậy mà `wrangler.jsonc` không khai báo `WORKER_SELF_REFERENCE`
 * (chỉ cần khi xoá đệm theo yêu cầu) và không khai báo binding `images`
 * (trang không dùng `next/image` ở đâu cả).
 *
 * Khi nào cần xem lại file này: ngày nào thêm một trang có `revalidate`, hoặc
 * bắt đầu dùng `next/image`.
 */
export default defineCloudflareConfig()
