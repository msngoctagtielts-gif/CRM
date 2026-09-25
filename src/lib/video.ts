/**
 * Đọc link bản ghi buổi học để nhúng vào màn hình báo cáo.
 *
 * File này CỐ Ý không import gì — chạy thẳng được bằng `node --test`, giống
 * `lib/ai/feedback.ts`.
 *
 * VÌ SAO CHỈ NHÚNG ĐƯỢC YOUTUBE
 *   Zoom Clips chặn nhúng bằng header X-Frame-Options. Nhúng vào thì khung chỉ
 *   hiện một ô trắng, và Founder tưởng hệ thống hỏng. Nên link Zoom được trả về
 *   dạng 'lien_ket' để giao diện mở tab mới thay vì nhúng — nói thật còn hơn
 *   một khung trống không giải thích được.
 */

export type LoaiVideo = 'youtube' | 'zoom' | 'khac'

export type BanGhi = {
  url: string
  loai: LoaiVideo
  /** Chỉ có với YouTube. Dùng dựng link nhúng. */
  videoId: string | null
}

/**
 * Bóc mã video YouTube từ mọi dạng link trung tâm đang dùng:
 *   youtu.be/ID · youtube.com/watch?v=ID · youtube.com/embed/ID · /live/ID
 *
 * Mã video YouTube là 11 ký tự trong tập [A-Za-z0-9_-]. Ràng buộc đúng 11 ký tự
 * để một đường dẫn lạ không bị đọc nhầm thành mã rồi sinh ra khung nhúng hỏng.
 */
export function docVideoId(url: string | null | undefined): string | null {
  const v = (url ?? '').trim()
  if (v === '') return null

  const mau = [
    /youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/,
    /youtube(?:-nocookie)?\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)/,
    /youtube(?:-nocookie)?\.com\/(?:embed|live|shorts)\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/,
  ]
  for (const m of mau) {
    const kq = m.exec(v)
    if (kq) return kq[1]
  }
  return null
}

export function loaiVideo(url: string | null | undefined): LoaiVideo {
  const v = (url ?? '').trim().toLowerCase()
  if (v === '') return 'khac'
  if (docVideoId(v) !== null) return 'youtube'
  if (/(^|\/\/|\.)zoom\.us\//.test(v)) return 'zoom'
  return 'khac'
}

export function docBanGhi(url: string | null | undefined): BanGhi | null {
  const v = (url ?? '').trim()
  if (v === '' || !/^https?:\/\//i.test(v)) return null
  return { url: v, loai: loaiVideo(v), videoId: docVideoId(v) }
}

/**
 * Link nhúng.
 *
 * Dùng youtube-nocookie.com chứ không phải youtube.com: video lớp học có mặt và
 * giọng trẻ em, nên không để YouTube gắn cookie theo dõi lên người xem báo cáo.
 * Với một trung tâm thì đó là chuyện tôn trọng học viên, không phải tiểu tiết.
 *
 * `batDauGiay` cho phép mở đúng khoảnh khắc giáo viên đã ghi mốc thời gian —
 * Founder bấm là nhảy thẳng tới câu học viên nói, không phải tua tay.
 */
export function linkNhung(videoId: string, batDauGiay?: number | null): string {
  const goc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
  const s =
    typeof batDauGiay === 'number' && Number.isFinite(batDauGiay) && batDauGiay > 0
      ? Math.floor(batDauGiay)
      : null
  return s === null ? `${goc}?rel=0` : `${goc}?rel=0&start=${s}`
}

/** "12:03" hoặc "1:02:30" → số giây. Sai định dạng thì trả null, không đoán. */
export function giayTuMoc(v: string | null | undefined): number | null {
  const m = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/.exec(v ?? '')
  if (!m) return null
  const [, gio, phut, giay] = m
  const s = (gio ? Number(gio) * 3600 : 0) + Number(phut) * 60 + Number(giay)
  return Number.isFinite(s) && s > 0 ? s : null
}
