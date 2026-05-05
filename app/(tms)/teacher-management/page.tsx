import TeacherManagementPage from '@/components/application/tms/teacher-management/TeacherManagementPage'
import { requireAuth } from '@/utils/action/auth/auth.get'

async function page() {
  const session = await requireAuth();
  return <TeacherManagementPage  user={session?.user}/>
}

export default page
