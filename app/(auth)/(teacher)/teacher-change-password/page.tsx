import ChangePassword from '@/components/application/teacher-portal/change-password/ChangePasswordPage'
import React, { Suspense } from 'react'

function page() {
     
   return <Suspense fallback={<div>Loading verification details...</div>}>
      <ChangePassword />
  </Suspense>
  
}

export default page
