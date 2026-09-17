import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function RootPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Phụ huynh và học viên vào cổng riêng, không vào hệ quản trị.
  if (user.role_code === 'parent') redirect('/portal')
  redirect(user.role_code === 'teacher' ? '/reports' : '/dashboard')
}
