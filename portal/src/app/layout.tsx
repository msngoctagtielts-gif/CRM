import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Cổng thông tin học viên', template: '%s · Ms.Ngọc Elite English' },
  description: 'Tình hình học tập, video buổi học và học phí.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
