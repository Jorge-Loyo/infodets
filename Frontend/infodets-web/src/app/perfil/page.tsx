'use client'

import { Box } from '@mantine/core'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { PerfilPanel } from '@/components/perfil/PerfilPanel'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function PerfilPage() {
  const { checking } = useRequireAuth({})
  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <PerfilPanel />
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}
