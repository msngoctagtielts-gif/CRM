import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Quét các buổi học đã quá hạn nộp báo cáo và sinh cảnh báo chất lượng.
 *
 * Gọi định kỳ (khuyến nghị mỗi giờ) từ n8n hoặc Vercel Cron:
 *
 *   POST /api/cron/scan-reports
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Dùng service role vì không có phiên người dùng trong cron job. Đây là một
 * trong hai chỗ duy nhất được phép dùng service role key.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET chưa được cấu hình trên server.' },
      { status: 500 },
    )
  }

  const header = request.headers.get('authorization') ?? ''
  if (header !== `Bearer ${secret}`) {
    // Không tiết lộ lý do cụ thể để tránh dò secret.
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('fn_scan_overdue_reports')

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data : []
    return NextResponse.json({
      ok: true,
      scanned_at: new Date().toISOString(),
      overdue_lessons: rows.length,
      lessons: rows,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** Kiểm tra endpoint còn sống (không thực hiện thay đổi gì). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'scan-reports',
    method: 'POST',
    auth: 'Authorization: Bearer $CRON_SECRET',
  })
}
