import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Báo cáo học tập — Ms.Ngọc Elite English',
}

/**
 * Bố cục riêng cho bản in.
 *
 * VÌ SAO TÁCH KHỎI (app)
 *   Bố cục (app) có thanh điều hướng, huy hiệu cảnh báo và dấu build. In ra thì
 *   những thứ đó chiếm chỗ và làm trang trông như ảnh chụp màn hình chứ không
 *   phải một văn bản gửi phụ huynh. Tách nhóm là cách rẻ nhất để bản in sạch.
 *
 *   Trang vẫn nằm sau middleware nên vẫn phải đăng nhập mới xem được.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="ban-in">{children}</div>
}
