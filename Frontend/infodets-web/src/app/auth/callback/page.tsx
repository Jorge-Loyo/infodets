'use client'

import { useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useRouter } from 'next/navigation'
import { Center, Loader } from '@mantine/core'
import { ROUTES } from '@/lib/constants'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      const session = await fetchAuthSession({ forceRefresh: false }).catch(() => null)
      if (session?.tokens?.accessToken) {
        clearInterval(interval)
        router.replace(ROUTES.CONSULTA)
      }
    }, 500)

    setTimeout(() => {
      clearInterval(interval)
      router.replace(ROUTES.LOGIN)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Center h="100vh">
      <Loader size="md" />
    </Center>
  )
}
