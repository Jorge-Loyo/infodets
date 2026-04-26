'use client'

import { useEffect } from 'react'
import { signInWithRedirect, fetchAuthSession } from 'aws-amplify/auth'
import { useRouter } from 'next/navigation'
import { PageLoader } from '@/components/layout/PageLoader'
import { ROUTES } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    fetchAuthSession({ forceRefresh: false })
      .then((session) => {
        if (session.tokens?.accessToken) {
          router.replace(ROUTES.CONSULTA)
        } else {
          signInWithRedirect()
        }
      })
      .catch(() => signInWithRedirect())
  }, [])

  return <PageLoader />
}
