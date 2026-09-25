import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  formatDate,
  formatDeadline,
  formatDuration,
  formatTime,
  toDateTimeLocal,
} from '@/lib/format'
import { CLASS_TYPE, REPORT_AUTHOR, REPORT_STATUS, missingFieldLabels, qcTone } from '@/lib/labels'
import { getOperatingSettings } from '@/lib/settings'
import { isAIConfigured } from '@/lib/ai/provider'
import { classifyVideoSource } from '@/lib/ai/feedback'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ReportForm } from './ReportForm'
import { ReportActions } from './ReportActions'
import { SuaXoaBuoiHoc } from './SuaXoaBuoiHoc'
import { XacMinhVideo } from './XacMinhVideo'
import { NhungVideo } from '@/components/NhungVideo'

export const metadata: Metadata = { title: 'Báo cáo giảng dạy' }

export default async function ReportFormPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const user = await requireUser()
  const { lessonId } = await params
  const supabase = await createClient()
  const settings = await getOperatingSettings()

  const { data: lesson } = await supabase
    .from('v_lesson_reports')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  // RLS: buổi học không thuộc phạm vi của người dùng ⇒ không có dòng nào.
  if (!lesson) notFound()

  const [
    { data: roster },
    { data: report },
    { data: feedback },
    { data: attendance },
    { data: homework },
    { data: recording },
  ] = await Promise.all([
    supabase
      .from('class_students')
      .select('student_id, students(id, full_name, nickname, student_code)')
      .eq('class_id', lesson.class_id!)
      .eq('status', 'active')
      .order('created_at'),
    lesson.report_id
      ? supabase.from('teaching_reports').select('*').eq('id', lesson.report_id).maybeSingle()
      : Promise.resolve({ data: null }),
    lesson.report_id
      ? supabase.from('teaching_report_students').select('*').eq('report_id', lesson.report_id)
      : Promise.resolve({ data: [] }),
    supabase.from('attendance').select('student_id, status').eq('lesson_id', lessonId),
    supabase
      .from('homework')
      .select('title, description, due_date, sentence_patterns')
      .eq('lesson_id', lessonId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    // Lấy TẤT CẢ bản ghi, không phải một. Một buổi thường được tách thành
    // hai phần video nối tiếp nhau; lấy .limit(1) thì phần sau biến mất.
    supabase
      .from('recordings')
      .select('url')
      .eq('lesson_id', lessonId)
      .eq('status', 'active')
      .order('created_at'),
  ])

  const students = (roster ?? [])
    .map(
      (r) =>
        r.students as {
          id: string
          full_name: string
          nickname: string | null
          student_code: string | null
        } | null,
    )
    .filter((s): s is NonNullable<typeof s> => s !== null)

  const isFounder = user.role_code === 'founder'

  // Chỉ Founder mới thấy khu vực sửa/xoá, nên chỉ Founder mới cần hai truy vấn
  // này. Giáo viên không phải trả giá cho một khu vực họ không nhìn thấy.
  const [{ data: payable }, { data: giaoVienList }, { data: diemDanh }] = isFounder
    ? await Promise.all([
        supabase
          .from('teacher_payable_lessons')
          .select('status')
          .eq('lesson_id', lessonId)
          .maybeSingle(),
        supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name'),
        supabase.from('attendance').select('is_billable, ly_do_mien_phi').eq('lesson_id', lessonId),
      ])
    : [{ data: null }, { data: [] }, { data: [] }]

  const dsBanGhi = recording ?? []

  // Gemini chỉ đọc được YouTube (Google tự tải từ phía họ). Zoom Clips là link
  // riêng tư nên không dịch vụ nào lấy được — kiểm ở đây để nút hiện đúng
  // trạng thái thay vì để Founder bấm rồi mới nhận lỗi.
  const coYoutube = dsBanGhi.some((r) => classifyVideoSource(r.url) === 'youtube')

  // Buổi coi là miễn phí khi MỌI dòng điểm danh đều không thu phí. Lớp nhóm có
  // thể một em chịu phí, các em còn lại đi kèm — trường hợp đó không phải buổi
  // miễn phí, nên không được hiện nút chuyển.
  const dsDiemDanh = diemDanh ?? []
  const mienPhi = dsDiemDanh.length > 0 && dsDiemDanh.every((d) => !d.is_billable)
  const lyDoMienPhi = dsDiemDanh.find((d) => d.ly_do_mien_phi)?.ly_do_mien_phi ?? null

  const daKhoaLuong = payable?.status === 'included' || payable?.status === 'paid'

  const deadline = formatDeadline(lesson.report_due_at)
  const reportMeta = lesson.report_status ? REPORT_STATUS[lesson.report_status] : null
  const missing = missingFieldLabels(lesson.missing_fields)
  const isApproved = lesson.report_status === 'approved'
  const canEdit = isFounder || !isApproved

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="size-4" /> Danh sách báo cáo
      </Link>

      <header className="mb-5">
        <h1 className="mnee-rule text-xl font-semibold text-navy-900">Báo cáo giảng dạy</h1>
        <div className="mt-3 space-y-0.5 text-[0.8125rem] text-navy-600">
          <p>
            <span className="mnee-label mr-1.5">Lớp</span>
            {lesson.class_name} · {lesson.class_type ? CLASS_TYPE[lesson.class_type].label : ''}
          </p>
          <p>
            <span className="mnee-label mr-1.5">Học viên</span>
            {lesson.student_names ?? '—'}
          </p>
          <p>
            <span className="mnee-label mr-1.5">Ngày</span>
            {formatDate(lesson.lesson_date)} · theo lịch {formatTime(lesson.scheduled_start_at)}–
            {formatTime(lesson.scheduled_end_at)} ({formatDuration(lesson.duration_minutes)})
          </p>
          <p>
            <span className="mnee-label mr-1.5">Giáo viên</span>
            {lesson.teacher_name ?? 'Chưa phân công'}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {reportMeta ? <Badge tone={reportMeta.tone}>{reportMeta.label}</Badge> : null}
          {deadline ? (
            <Badge tone={deadline.overdue ? 'danger' : 'info'}>Hạn nộp: {deadline.label}</Badge>
          ) : null}
          {report ? (
            <Badge tone={qcTone(report.qc_score)}>Chất lượng {report.qc_score ?? 0}/100</Badge>
          ) : null}
          {report && report.authored_by !== 'teacher' ? (
            <Badge tone="info">{REPORT_AUTHOR[report.authored_by]}</Badge>
          ) : null}
          {report?.sent_to_parent_at ? <Badge tone="success">Đã gửi phụ huynh</Badge> : null}
          {lesson.submitted_at ? (
            <span className="text-xs text-navy-400">
              Nộp lần đầu {formatDate(lesson.submitted_at)}
            </span>
          ) : null}
        </div>
      </header>

      {missing.length > 0 ? (
        <Alert
          kind={deadline?.overdue ? 'danger' : 'warning'}
          title="Báo cáo chưa đầy đủ"
          className="mb-4"
        >
          Còn thiếu: {missing.join(', ')}.
          {deadline?.overdue
            ? ` Buổi học đã quá hạn ${settings.reportDeadlineHours} giờ nên đang được tính là INCOMPLETE và có cảnh báo gửi tới Founder.`
            : ' Hoàn tất trước hạn để không phát sinh cảnh báo.'}
        </Alert>
      ) : null}

      {isApproved && user.role_code !== 'founder' ? (
        <Alert kind="info" className="mb-4">
          Báo cáo đã được Founder duyệt nên không sửa được nữa. Cần điều chỉnh, hãy liên hệ Founder.
        </Alert>
      ) : null}

      {report ? (
        <ReportActions
          reportId={report.id}
          isFounder={isFounder}
          isApproved={isApproved}
          sentToParentAt={report.sent_to_parent_at}
        />
      ) : null}

      <ReportForm
        lessonId={lessonId}
        canEdit={canEdit}
        isFounder={isFounder}
        aiEnabled={isAIConfigured()}
        qcMinScore={settings.qcMinScore}
        deadlineHours={settings.reportDeadlineHours}
        students={students}
        defaults={{
          start_time: toDateTimeLocal(
            report?.start_time ?? lesson.actual_start_at ?? lesson.scheduled_start_at,
          ),
          end_time: toDateTimeLocal(
            report?.end_time ?? lesson.actual_end_at ?? lesson.scheduled_end_at,
          ),
          lesson_content: report?.lesson_content ?? '',
          teacher_comments: report?.teacher_comments ?? '',
          next_lesson_recommendation: report?.next_lesson_recommendation ?? '',
          homework_title: homework?.title ?? '',
          homework_description: homework?.description ?? '',
          homework_due_date: homework?.due_date ?? '',
          homework_sentence_patterns: homework?.sentence_patterns ?? '',
          recording_url: dsBanGhi[0]?.url ?? '',
          video_timestamp: report?.video_timestamp ?? '',
          student_quote: report?.student_quote ?? '',
          strengths: report?.strengths ?? '',
          improvements: report?.improvements ?? '',
          qc_strengths_deep: report?.qc_strengths_deep ?? null,
          qc_improvements_deep: report?.qc_improvements_deep ?? null,
          lessonCompleted: lesson.lesson_status === 'completed',
        }}
        attendance={Object.fromEntries((attendance ?? []).map((a) => [a.student_id, a.status]))}
        feedback={Object.fromEntries(
          (feedback ?? []).map((f) => [
            f.student_id,
            {
              attitude: f.attitude ?? '',
              performance: f.performance ?? '',
              comments: f.comments ?? '',
              homework_completion: f.homework_completion ?? '',
            },
          ]),
        )}
      />

      <NhungVideo urls={dsBanGhi.map((r) => r.url)} mocThoiGian={report?.video_timestamp ?? null} />

      {isFounder && lesson.lesson_id ? (
        <XacMinhVideo
          lessonId={lesson.lesson_id}
          coYoutube={coYoutube}
          daXacMinh={report?.phut_thuc_te != null}
          phutKhai={lesson.duration_minutes}
          phutThucTe={report?.phut_thuc_te ?? null}
        />
      ) : null}

      {isFounder && lesson.lesson_id ? (
        <SuaXoaBuoiHoc
          lessonId={lesson.lesson_id}
          lessonDate={lesson.lesson_date ?? ''}
          durationMinutes={lesson.duration_minutes}
          status={lesson.lesson_status ?? 'completed'}
          daKhoaLuong={daKhoaLuong}
          teacherId={lesson.teacher_id ?? null}
          giaoVienList={giaoVienList ?? []}
          mienPhi={mienPhi}
          lyDoMienPhi={lyDoMienPhi}
        />
      ) : null}
    </div>
  )
}
