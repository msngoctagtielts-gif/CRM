/**
 * Video của trung tâm.
 *
 * CỐ Ý ĐỂ TRỐNG. Danh sách này chỉ được điền khi video đã quay xong và đã đăng
 * thật. Không đặt video mẫu, không đặt link giữ chỗ, không nhúng video của
 * người khác rồi để người đọc tưởng là của trung tâm.
 *
 * Khi có video thật thì thêm vào đây; mục "Video" trên trang chủ tự hiện ra.
 * Trang chủ đã viết sẵn để khi danh sách rỗng thì mục đó biến mất hoàn toàn —
 * không có khung trống, không có chữ "sắp ra mắt".
 *
 * Kịch bản, khung hình và quy trình dựng nằm trong
 * `docs/KENH_THU_HUT_HOC_VIEN.md`, mục "Bộ khuôn sản xuất".
 *
 * `youtubeId` là phần sau `v=` trong link YouTube. Dùng YouTube vì đó là nơi
 * duy nhất hệ thống nội bộ đọc được video để xác minh và cắt trích đoạn.
 */

export type Video = {
  youtubeId: string
  tieuDe: string
  moTa: string
  /** Trụ nội dung, khớp với thư viện bài viết. */
  tru: 'tam_ly' | 'phuong_phap' | 'giao_tiep' | 'ielts' | 'phu_huynh'
}

export const VIDEO: Video[] = []
