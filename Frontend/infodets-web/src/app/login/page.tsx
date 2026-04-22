'use client'

import { useEffect } from 'react'
import { signInWithRedirect } from 'aws-amplify/auth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function LoginPage() {
  useEffect(() => {
    signInWithRedirect()
  }, [])

  return <PageLoader />
}
