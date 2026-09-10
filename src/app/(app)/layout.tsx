import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/Nav'

const ROLE_LABEL: Record<string, string> = {
  founder: 'Founder / Quản trị',
  teacher: 'Giáo viên',
  staff: 'Nhân viên',
  parent: 'Phụ huynh',
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const supabase = await createClient()

  const isFounder = user.role_code === 'founder'

  // RLS tự lọc: giáo viên chỉ đếm được báo cáo và cảnh báo thuộc phạm vi mình.
  // Đếm MỌI loại cảnh báo đang mở, không chỉ báo cáo thiếu — từ khi có thêm
  // cảnh báo thiếu giờ dạy, học vượt buổi và chưa gửi phụ huynh thì lọc theo
  // một loại sẽ làm con số trên thanh điều hướng thấp hơn thực tế.
  const [alerts, reports, review] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['new', 'acknowledged']),
    supabase
      .from('teaching_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'incomplete']),
    isFounder
      ? supabase.from('v_data_review').select('entity_id', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Nav
        role={user.role_code}
        userName={user.full_name}
        roleLabel={ROLE_LABEL[user.role_code] ?? user.role_code}
        openAlerts={alerts.count ?? 0}
        pendingReports={reports.count ?? 0}
        needsReview={review.count ?? 0}
      />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
