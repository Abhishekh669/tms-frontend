import DashboardManagementPage from '@/components/application/teacher-portal/dashboard/DashboardManagementPage';
import { requireTeacherAuth } from '@/utils/action/teacher/teacher.get'

async function page() {
  const session = await requireTeacherAuth();
  return <DashboardManagementPage teacher={session?.teacher} />
}

export default page
