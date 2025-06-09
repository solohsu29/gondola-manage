import OtpVerifyForgotPassword from '@/components/auth/otp-verify'
import React, { Suspense } from 'react'

const OtpVerifyForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtpVerifyForgotPassword/>
      
    </Suspense>
  )
}

export default OtpVerifyForgotPasswordPage
