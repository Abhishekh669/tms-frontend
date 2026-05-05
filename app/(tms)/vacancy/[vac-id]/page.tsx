import VacancyByIdPage from '@/components/application/tms/vacancy/VacancyIdPage'
import { requireAuth } from '@/utils/action/auth/auth.get';

async function page() {
  const session = await requireAuth();
  return<VacancyByIdPage user={session?.user} />
}

export default page
