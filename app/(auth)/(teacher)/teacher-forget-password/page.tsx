import ForgotPasswordPage from '@/components/application/teacher-portal/forget-password/ForgetPassowrdPage'
import { teacherAuth } from '@/utils/action/teacher/teacher.get'
import React from 'react'

async function page() {
    const session = await teacherAuth();
  return <ForgotPasswordPage teacher={session?.teacher} />
}

export default page
