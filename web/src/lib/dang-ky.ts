'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { taoClientCongKhai } from './supabase'

export type KetQuaDangKy =
  | { ok: true; maLead: string }
  | { ok: false; loi: string }

/**
 * Băm địa chỉ IP để đếm số lượt mà không lưu IP thô.
 *
 * Phải có muối. Không gian IPv4 chỉ có hơn bốn tỉ giá trị, nên một bản băm
 * không muối là dò ngược ra được trong vài phút — tức là vẫn đang lưu IP, chỉ
 * là lưu một cách khó đọc hơn. Chưa đặt muối thì trả về chuỗi rỗng và hàm trong
 * cơ sở dữ liệu sẽ bỏ qua bước giới hạn tần suất, thà vậy còn hơn lưu dữ liệu
 * cá nhân một cách hớ hênh.
 */
async function bamIP(): Promise<string> {
  const muoi = process.env.DANG_KY_SALT
  if (!muoi) return ''

  const h = await headers()
  const ip =
    h.get('x-nf-client-connection-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  if (!ip) return ''

  return createHash('sha256').update(`${muoi}:${ip}`).digest('hex').slice(0, 32)
}

const LOI_NGUOI_DOC: Record<string, string> = {
  THIEU_HO_TEN: 'Xin điền tên để chúng tôi biết xưng hô thế nào.',
  SAI_DIEN_THOAI: 'Số điện thoại chưa đúng. Xin kiểm tra lại giúp.',
  QUA_NHIEU_LUOT: 'Bạn đã gửi nhiều lần trong một giờ qua. Xin thử lại sau.',
}

/**
 * Gửi thông tin đăng ký.
 *
 * Trả về kết quả chứ không tự chuyển trang — để nơi gọi quyết định hiện lỗi tại
 * chỗ hay chuyển sang trang cảm ơn.
 */
export async function guiDangKy(form: FormData): Promise<KetQuaDangKy> {
  // Bẫy máy tự động: ô này ẩn với người, chỉ chương trình mới điền vào.
  if ((form.get('website') as string | null)?.trim()) {
    // Trả về như thành công để chương trình gửi rác không biết mình bị chặn.
    return { ok: true, maLead: '' }
  }

  const soTuoi = Number(form.get('tuoi'))
  const traLoiTho = form.get('cau_tra_loi')
  let cauTraLoi: unknown = {}
  if (typeof traLoiTho === 'string' && traLoiTho.trim() !== '') {
    try {
      cauTraLoi = JSON.parse(traLoiTho)
    } catch {
      cauTraLoi = {}
    }
  }

  const supabase = taoClientCongKhai()
  const { data, error } = await supabase.rpc('dang_ky_tu_van', {
    p_ho_ten: String(form.get('ho_ten') ?? ''),
    p_dien_thoai: String(form.get('dien_thoai') ?? ''),
    p_email: String(form.get('email') ?? '') || null,
    p_tuoi: Number.isFinite(soTuoi) && soTuoi > 0 ? Math.trunc(soTuoi) : null,
    p_muc_tieu: String(form.get('muc_tieu') ?? '') || null,
    p_ma_chan_dung: String(form.get('ma_chan_dung') ?? '') || null,
    p_cau_tra_loi: cauTraLoi,
    p_nguon: String(form.get('nguon') ?? 'dang_ky'),
    p_ip_bam: await bamIP(),
  })

  if (error) {
    const ma = Object.keys(LOI_NGUOI_DOC).find((k) => error.message.includes(k))
    if (ma) return { ok: false, loi: LOI_NGUOI_DOC[ma] }
    // Lỗi lạ: không ném chi tiết kỹ thuật ra cho người lạ đọc.
    console.error('[dang-ky] lỗi không lường trước:', error.message)
    return {
      ok: false,
      loi: 'Hệ thống đang trục trặc. Xin gọi trực tiếp cho trung tâm giúp chúng tôi.',
    }
  }

  return { ok: true, maLead: typeof data === 'string' ? data : '' }
}
