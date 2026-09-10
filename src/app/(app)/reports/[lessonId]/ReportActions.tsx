'use client'

import { useActionState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Textarea } from '@/components/ui/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { FormMessage } from '@/components/FormMessage'
import type { ActionResult } from '@/lib/actions'
import { approveReport, markReportSentToParent } from '../actions'

/**
 * Hai hành động sau khi báo cáo đã có nội dung:
 *
 *   · Gửi phụ huynh — BƯỚC RIÊNG do người bấm, không tự động, kể cả khi nội
 *     dung do AI viết (giả định A13). Quá hạn chưa bấm sẽ sinh cảnh báo.
 *   · Duyệt — chỉ Founder. Duyệt rồi thì giáo viên không sửa được nữa (RLS).
 *
 * Tách khỏi ReportForm vì đây là form riêng: bấm duyệt không nên kéo theo việc
 * lưu lại toàn bộ nội dung đang gõ dở.
 */
export function ReportActions({
  reportId,
  isFounder,
  isApproved,
  sentToParentAt,
}: {
  reportId: string
  isFounder: boolean
  isApproved: boolean
  sentToParentAt: string | null
}) {
  return (
    <div className="mb-5 space-y-5">
      {sentToParentAt ? null : <SendToParent reportId={reportId} />}
      {isFounder && !isApproved ? <Approve reportId={reportId} /> : null}
    </div>
  )
}

function SendToParent({ reportId }: { reportId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    markReportSentToParent,
    null,
  )
  return (
    <form action={action}>
      <input type="hidden" name="report_id" value={reportId} />
      <FormMessage state={state} />
      <Card>
        <CardHeader
          title="Gửi phụ huynh"
          description="Bấm sau khi đã thực sự gửi. Hệ thống không tự gửi thay bạn."
          action={
            <SubmitButton variant="secondary" size="sm" pendingLabel="Đang ghi nhận…">
              Đánh dấu đã gửi
            </SubmitButton>
          }
        />
      </Card>
    </form>
  )
}

function Approve({ reportId }: { reportId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(approveReport, null)
  return (
    <form action={action}>
      <input type="hidden" name="report_id" value={reportId} />
      <FormMessage state={state} />
      <Card>
        <CardHeader
          title="Duyệt báo cáo"
          description="Sau khi duyệt, giáo viên không sửa được nội dung nữa."
        />
        <CardBody className="space-y-3">
          <Field label="Ghi chú duyệt" hint="Không bắt buộc">
            <Textarea name="review_notes" rows={2} />
          </Field>
          <SubmitButton variant="gold" pendingLabel="Đang duyệt…">
            Duyệt báo cáo
          </SubmitButton>
        </CardBody>
      </Card>
    </form>
  )
}
