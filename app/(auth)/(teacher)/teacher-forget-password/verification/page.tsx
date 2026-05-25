import ForgotPasswordVerificationPage from '@/components/application/teacher-portal/forget-password/ForgetPasswordVerificationPage.'
import { Suspense } from 'react'

function page() {
  return <Suspense fallback={<div>Loading verification details...</div>}>
    <ForgotPasswordVerificationPage />
  </Suspense>

}

export default page
