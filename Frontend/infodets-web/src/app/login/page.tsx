'use client'

import { useEffect } from 'react'
import { signInWithRedirect } from 'aws-amplify/auth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function LoginPage() {
  useEffect(() => {
    console.log('POOL ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID)
    console.log('CLIENT ID:', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID)
    console.log('REDIRECT:', process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN)
    signInWithRedirect().catch((err) => console.error('signInWithRedirect error:', err))
  }, [])

  return <PageLoader />
}
