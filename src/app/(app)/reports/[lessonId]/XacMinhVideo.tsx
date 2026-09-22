'use client'

import { useState, useTransition } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { xacMinhBuoiHoc, type XacMinhActionResult } from '../actions'

/**
 * Nút nhờ máy xem video và đo buổi học.
 *
 * Thay cho scripts/phan-tich-video/phan-tich.mjs — trước đây Founder phải mở
 * máy, đặt một biến môi trường thứ hai, rồi chạy lệnh. Giờ là một nút.
 *
 * Nói rõ ngay trên nút rằng lương và học phí KHÔNG đổi. Nếu không nói, Founder
 * sẽ ngại bấm vì không biết máy có tự sửa tiền hay không — và ngại bấm thì
 * chức năng này coi như không tồn tại.
 */
export function XacMinhVideo({
  lessonId,
  coYoutube,
  daXacMinh,
  phutKhai,
  phutThucTe,
}: {
  lessonId: string
  coYoutube: boolean
  daXacMinh: boolean
  phutKhai: number | null
  phutThucTe: number | null
}) {
  const [ketQua, setKetQua] = useState<XacMinhActionResult | null>(null)
  const [dangChay, batDau] = useTransition()

  const lech = phutKhai !== null && phutThucTe !== null ? phutThucTe - phutKhai : null

  return (
    <Card className="mb-5">
      <CardHeader
        title="Xác minh từ video"
        description="Máy xem bản ghi, đo số phút học thật, thời gian học viên nói và các lần gián đoạn."
      />
      <CardBody className="space-y-3">
        {daXacMinh ? (
          <p className="text-[0.8125rem] text-navy-700">
            Đã xác minh. Giáo viên khai <strong>{phutKhai ?? '?'} phút</strong>, máy đo được{' '}
            <strong>{phutThucTe ?? '?'} phút</strong>
            {lech !== null ? (
              <>
                {' '}
                — lệch{' '}
                <strong className={lech < 0 ? 'text-burgundy-700' : 'text-navy-900'}>
                  {lech > 0 ? '+' : ''}
                  {lech} phút
                </strong>
              </>
            ) : null}
            .
          </p>
        ) : null}

        {!coYoutube ? (
          <Alert kind="warning">
            Buổi này chưa có video YouTube. Zoom Clips là link riêng tư nên không dịch vụ nào tải về
            được — nhờ giáo viên tải bản ghi lên YouTube, để chế độ Unlisted là đủ.
          </Alert>
        ) : null}

        {ketQua ? (
          ketQua.ok ? (
            <Alert kind="success">
              {ketQua.message}
              {ketQua.canhBao.length > 0 ? (
                <span className="mt-1 block text-xs">
                  Đã bỏ vì vô lý: {ketQua.canhBao.join('; ')}.
                </span>
              ) : null}
            </Alert>
          ) : (
            <Alert kind="danger">{ketQua.error}</Alert>
          )
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!coYoutube || dangChay}
            onClick={() =>
              batDau(async () => {
                setKetQua(null)
                setKetQua(await xacMinhBuoiHoc(lessonId))
              })
            }
          >
            {dangChay ? 'Máy đang xem video…' : daXacMinh ? 'Xem lại và đo lại' : 'Nhờ máy xem video'}
          </Button>
          <p className="text-xs text-navy-500">
            Lương giáo viên và học phí học viên KHÔNG bị đổi. Máy chỉ cho thấy độ lệch.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
