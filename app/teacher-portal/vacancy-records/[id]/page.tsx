import VacancyRecordsById from "@/components/application/teacher-portal/vacancy-records/VacancyRecordsById";
import { requireTeacherAuth } from "@/utils/action/teacher/teacher.get"

async function page() {
    const session = await requireTeacherAuth();
  return <VacancyRecordsById teacher={session.teacher} />;
}

export default page
