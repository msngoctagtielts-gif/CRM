import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MNEE Management System',
    template: '%s · MNEE',
  },
  description:
    'Hệ thống quản lý trung tâm Ms.Ngọc Elite English — học viên, lớp học, báo cáo giảng dạy, học phí và tài chính.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#13294b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
