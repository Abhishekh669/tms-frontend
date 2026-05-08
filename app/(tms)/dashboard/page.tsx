import ReportManagementPage from '@/components/application/tms/dashboard/ReportManagementPage';
import { requireAuth } from '@/utils/action/auth/auth.get'

async function page() {
  const session = await requireAuth();
  return <ReportManagementPage user={session?.user} />
}

export default page
