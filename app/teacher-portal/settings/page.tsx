import ChangePasswordUI from '@/components/application/teacher-portal/settings/ChangePassword';
import PersonalInfoUpdate from '@/components/application/teacher-portal/settings/PersonalInfoUpdate';
import { requireTeacherAuth } from '@/utils/action/teacher/teacher.get'

async function page() {
  const session = await requireTeacherAuth();
  return<>
     <PersonalInfoUpdate teacher={session?.teacher} />
     <ChangePasswordUI teacher={session?.teacher} />
  </>
}

export default page
