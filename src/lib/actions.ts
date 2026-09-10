import 'server-only'

import { z } from 'zod'

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

/**
 * Kiểm tra dữ liệu form bằng zod và trả lỗi tiếng Việt gọn cho người dùng.
 * Không bao giờ trả nguyên văn lỗi từ Postgres ra giao diện.
 */
export function parseForm<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') raw[key] = value === '' ? undefined : value
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    const field = first?.path.join('.') ?? ''
    return { ok: false, error: field ? `${field}: ${first.message}` : first.message }
  }
  return { ok: true, data: result.data }
}

/** Ép chuỗi tiền từ form ("250.000" / "250000") về số. */
export const vndAmount = z
  .string()
  .transform((v) => Number(v.replace(/[^\d.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '')))
  .pipe(z.number().finite())

export const optionalUuid = z.string().uuid().optional()

/** Thông điệp lỗi thân thiện cho các lỗi Postgres thường gặp. */
export function friendlyDbError(message: string): string {
  if (/row-level security/i.test(message)) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'Dữ liệu này đã tồn tại.'
  }
  if (/violates foreign key/i.test(message)) {
    return 'Bản ghi liên quan không tồn tại hoặc đã bị xoá.'
  }
  if (/violates check constraint/i.test(message)) {
    return 'Dữ liệu không hợp lệ theo quy tắc của hệ thống.'
  }
  return 'Không lưu được. Vui lòng kiểm tra lại dữ liệu.'
}
