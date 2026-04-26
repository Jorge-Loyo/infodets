'use client'

import { Box } from '@mantine/core'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { HistorialPanel } from '@/components/chat/HistorialPanel'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function HomePage() {
  const { checking } = useRequireAuth()
  if (checking) return <PageLoader />
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <Header />

      {/* Cuerpo principal: sidebar + chat + historial */}
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar izquierdo — menú de navegación */}
        <Sidebar />

        {/* Centro — chat con IA */}
        <ChatPanel />

        {/* Derecha — historial de consultas */}
        <HistorialPanel />

      </Box>

      {/* Footer */}
      <Footer />

    </Box>
  )
}
