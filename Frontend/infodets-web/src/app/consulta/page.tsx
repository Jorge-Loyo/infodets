'use client'

import { Box } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { HistorialPanel } from '@/components/chat/HistorialPanel'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function HomePage() {
  const { checking } = useRequireAuth()
  const isMobile = useMediaQuery('(max-width: 62em)')

  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <ChatPanel />
        {!isMobile && <HistorialPanel />}
      </Box>
      <Footer />
    </Box>
  )
}
