'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default function AuthCallbackPage() {
  const router = useRouter()
  useEffect(() => { router.replace(ROUTES.HOME) }, [])
  return null
}
