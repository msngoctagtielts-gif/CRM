import { formatDateTime } from '@/lib/format'

/**
 * Dấu phiên bản, hiện ở chân mọi trang.
 *
 * Ngày 15/09/2026 Founder báo "chưa thấy cập nhật" — bản đang chạy cũ hơn code
 * đã đẩy lên, nhưng không có gì trên màn hình cho biết điều đó. Mất cả buổi để
 * lần ra. Dòng này để lần sau nhìn một giây là biết, và khi báo lỗi thì đọc
 * luôn mã bản build cho người sửa.
 */
export function BuildStamp() {
  const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT
  const time = process.env.NEXT_PUBLIC_BUILD_TIME

  return (
    <p className="px-4 py-3 text-center text-[0.6875rem] text-navy-300">
      {commit ? (
        <>
          Bản <span className="font-mono">{commit}</span>
        </>
      ) : (
        'Bản chạy trên máy'
      )}
      {time ? <> · dựng {formatDateTime(time)}</> : null}
    </p>
  )
}
