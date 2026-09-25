'use client'

import Link from 'next/link'
import { Printer, ArrowLeft, Eye } from 'lucide-react'

/**
 * Thanh công cụ trên bản in — chỉ hiện trên màn hình, `no-print` bỏ khi in.
 *
 * Nút in gọi window.print(); Founder chọn "Lưu thành PDF" trong hộp thoại in.
 * Không tự sinh PDF phía máy chủ: xem lý do ở phần BẢN IN trong globals.css.
 */
export function ThanhInAn({
  lessonId,
  isFounder,
  banNoiBo,
}: {
  lessonId: string
  isFounder: boolean
  banNoiBo: boolean
}) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-2 rounded-card border border-navy-100 bg-white px-4 py-3 shadow-card">
      <Link
        href={`/reports/${lessonId}`}
        className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="size-4" /> Về báo cáo
      </Link>

      <span className="ml-auto text-[0.75rem] text-navy-500">
        {banNoiBo ? 'Đang xem bản nội bộ' : 'Đang xem bản gửi phụ huynh'}
      </span>

      {isFounder ? (
        <Link
          href={banNoiBo ? `/bao-cao/${lessonId}` : `/bao-cao/${lessonId}?ban=noi-bo`}
          className="inline-flex items-center gap-1.5 rounded-md border border-navy-200 px-3 py-1.5 text-[0.8125rem] font-medium text-navy-700 hover:bg-navy-50"
        >
          <Eye className="size-4" />
          {banNoiBo ? 'Xem bản gửi phụ huynh' : 'Xem bản nội bộ'}
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-md bg-navy-800 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white hover:bg-navy-900"
      >
        <Printer className="size-4" /> In / Lưu PDF
      </button>
    </div>
  )
}
