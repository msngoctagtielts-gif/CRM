import type { Metadata } from 'next'
import { requireFounder } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StudentForm } from '../StudentForm'

export const metadata: Metadata = { title: 'Thêm học viên' }

export default async function NewStudentPage() {
  await requireFounder()
  const supabase = await createClient()

  const [{ data: programs }, { data: levels }] = await Promise.all([
    supabase.from('programs').select('id, name_vi').eq('status', 'active').order('sort_order'),
    supabase.from('levels').select('id, code, name_vi').eq('status', 'active').order('sort_order'),
  ])

  return (
    <>
      <PageHeader
        title="Thêm học viên"
        description="Thông tin phụ huynh là tuỳ chọn — học viên người lớn có thể bỏ trống."
      />
      <StudentForm programs={programs ?? []} levels={levels ?? []} mode="create" />
    </>
  )
}
