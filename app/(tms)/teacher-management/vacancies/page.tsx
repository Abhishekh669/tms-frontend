import TeacherVacanciesPage from '@/components/application/tms/teacher-management/TeacherVacancies';
import { requireAuth } from '@/utils/action/auth/auth.get'

async function page() {
  const session = await requireAuth();
  return <TeacherVacanciesPage user={session?.user} />
}

export default page
