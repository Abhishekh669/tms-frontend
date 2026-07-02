import VacancyRecordsManagementPage from '@/components/application/tms/teacher-management/vacancy/VacancyRecordsManagementPage';
import { requireAuth } from '@/utils/action/auth/auth.get'

async function page() {
  const session = await requireAuth();
  return <VacancyRecordsManagementPage user={session?.user}/>
}

export default page
