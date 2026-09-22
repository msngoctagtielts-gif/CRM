import Link from 'next/link'

const MENU = [
  { href: '/thau-hieu', nhan: 'Bài tự đánh giá' },
  { href: '/kien-thuc', nhan: 'Kiến thức' },
  { href: '/dang-ky', nhan: 'Đăng ký tư vấn' },
]

export function Khung({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-navy-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/" className="group">
            <div className="text-sm font-semibold tracking-wide text-navy-900">
              Ms.Ngọc Elite English
            </div>
            <div className="text-xs text-navy-400">Thấu hiểu để dẫn lối.</div>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="text-navy-600 transition-colors hover:text-navy-900"
              >
                {m.nhan}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-navy-100 bg-navy-50">
        <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-navy-600">
          <div className="font-semibold text-navy-900">Ms.Ngọc Elite English</div>
          <p className="mt-2 max-w-prose leading-relaxed">
            Trung tâm tiếng Anh giao tiếp, học trực tuyến, ưu tiên lớp một kèm một.
          </p>
          <p className="mt-4 max-w-prose leading-relaxed text-navy-500">
            Trung tâm cấp <strong className="font-semibold">Giấy xác nhận hoàn thành</strong> của
            trung tâm, không phải chứng chỉ được cơ quan nhà nước công nhận. Chúng tôi không cam
            kết đầu ra theo mốc thời gian — tiến độ phụ thuộc điểm xuất phát và thời gian bạn
            thật sự bỏ ra.
          </p>
          <p className="mt-6 text-xs text-navy-400">
            Thông tin bạn để lại chỉ dùng để liên hệ tư vấn. Không chia sẻ cho bên thứ ba.
          </p>
        </div>
      </footer>
    </div>
  )
}
