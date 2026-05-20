import VacancyRecordManagement from '@/components/application/teacher-portal/vacancy-records/VacancyRecordManagement'
import { requireTeacherAuth } from '@/utils/action/teacher/teacher.get'
import React from 'react'

async function page() {
  const session = await requireTeacherAuth();
  return <VacancyRecordManagement  teacher={session.teacher}/>
}

export default page
