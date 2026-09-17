import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function RootPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Phụ huynh và học viên KHÔNG dùng website này. Cổng thông tin của họ là một
  // website riêng, tên miền riêng, bản build riêng — hệ quản trị không chứa một
  // dòng mã nào của cổng. Đưa họ về trang báo sai cửa thay vì vào đây.
  if (user.role_code === 'parent') redirect('/unauthorized')
  redirect(user.role_code === 'teacher' ? '/reports' : '/dashboard')
}
