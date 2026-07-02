import VacancyManagementPage from '@/components/application/tms/vacancy/VacancyManagementPage'
import { requireAuth } from '@/utils/action/auth/auth.get'

async function page() {
  await requireAuth();
  return <VacancyManagementPage />
}

export default page
