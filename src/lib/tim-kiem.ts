"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Tìm kiếm toàn cục: học viên, giáo viên, lớp học.
 *
 * Vì sao cần: cô Ngọc nói "mỗi lần tìm kiếm thông tin là một điều rất áp lực".
 * Menu dài không giải được việc đó — thêm mục chỉ khiến phải đoán xem thông tin
 * nằm ở nhóm nào. Gõ tên rồi nhảy thẳng tới hồ sơ mới giải được.
 *
 * Dùng createClient() chứ KHÔNG dùng service role, nên RLS vẫn có hiệu lực:
 * giáo viên chỉ tìm ra học viên và lớp của chính họ. Đây là điều kiện bắt buộc
 * trước khi mở tài khoản cho 17 giáo viên.
 */

export type KetQua = {
  loai: "hoc_vien" | "giao_vien" | "lop";
  id: string;
  ten: string;
  phu?: string | null;
  duong_dan: string;
};

const GIOI_HAN_MOI_LOAI = 6;

export async function timKiem(tu_khoa: string): Promise<KetQua[]> {
  const q = tu_khoa.trim();
  // Một ký tự thì gần như khớp mọi thứ, trả về danh sách vô nghĩa.
  if (q.length < 2) return [];

  // Chặn ký tự đặc biệt của LIKE để người gõ "%" không quét toàn bảng.
  const mau = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

  const supabase = await createClient();

  const [hocVien, giaoVien, lop] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, status")
      .ilike("full_name", mau)
      .limit(GIOI_HAN_MOI_LOAI),
    supabase
      .from("teachers")
      .select("id, full_name, status")
      .ilike("full_name", mau)
      .limit(GIOI_HAN_MOI_LOAI),
    supabase
      .from("classes")
      .select("id, name, status")
      .ilike("name", mau)
      .limit(GIOI_HAN_MOI_LOAI),
  ]);

  const ra: KetQua[] = [];

  for (const h of hocVien.data ?? []) {
    ra.push({
      loai: "hoc_vien",
      id: h.id,
      ten: h.full_name,
      phu: h.status,
      duong_dan: `/students/${h.id}`,
    });
  }
  for (const l of lop.data ?? []) {
    ra.push({
      loai: "lop",
      id: l.id,
      ten: l.name,
      phu: l.status,
      duong_dan: `/classes/${l.id}`,
    });
  }
  // Chưa có trang chi tiết từng giáo viên, nên trỏ về danh sách.
  for (const g of giaoVien.data ?? []) {
    ra.push({
      loai: "giao_vien",
      id: g.id,
      ten: g.full_name,
      phu: g.status,
      duong_dan: "/teachers",
    });
  }

  return ra;
}
