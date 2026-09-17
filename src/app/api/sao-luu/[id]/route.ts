import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Tải một bản sao lưu về máy dưới dạng tệp JSON.
 *
 * Dùng phiên đăng nhập bình thường, KHÔNG dùng service role: RLS của bảng
 * data_backups đã giới hạn chỉ Founder đọc được, nên không cần khoá đặc quyền.
 * requireFounder() chặn thêm một lớp ở tầng ứng dụng.
 */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireFounder()
  const { id } = await params

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_backups')
    .select('created_at, loai, du_lieu, so_dong, kich_thuoc_bytes')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!data)
    return NextResponse.json({ ok: false, error: 'Không tìm thấy bản sao.' }, { status: 404 })

  const ngay = String(data.created_at).slice(0, 10)
  const noiDung = JSON.stringify(
    {
      he_thong: 'MNEE Management System',
      tao_luc: data.created_at,
      loai: data.loai,
      so_dong: data.so_dong,
      kich_thuoc_bytes: data.kich_thuoc_bytes,
      du_lieu: data.du_lieu,
    },
    null,
    2,
  )

  return new NextResponse(noiDung, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mnee-sao-luu-${ngay}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
