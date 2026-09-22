import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Ms.Ngọc Elite English — Thấu hiểu để dẫn lối',
    template: '%s · Ms.Ngọc Elite English',
  },
  description:
    'Kiến thức thực tế về tâm lý người học, phương pháp phù hợp với từng người, giao tiếp và IELTS. Làm bài tự đánh giá để biết bạn nên bắt đầu từ đâu.',
  // Khác cổng học viên: trang này CẦN được tìm thấy. Đó là lý do nó tồn tại.
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-white text-navy-800 antialiased">{children}</body>
    </html>
  )
}
