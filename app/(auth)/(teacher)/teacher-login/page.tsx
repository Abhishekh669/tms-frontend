import TeacherLoginCard from '@/components/application/teacher-platform/TeacherLoginPage'
import {  teacherAuth } from '@/utils/action/teacher/teacher.get'
import { redirect } from 'next/navigation';

async function page() {
  const session = await  teacherAuth();
  if(session) {
    redirect("/teacher-portal/dashboard")
  }
  return <TeacherLoginCard />
}

export default page
