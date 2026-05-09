'use client'

import { Box } from '@mantine/core'
import { IconUser, IconHeadset } from '@tabler/icons-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { SubMenuLayout } from '@/components/layout/SubMenuLayout'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

const CONFIG_MENU = [
  { label: 'Perfil',   icon: IconUser,    href: '/configuracion/perfil' },
  { label: 'Soporte',  icon: IconHeadset, href: '/configuracion/soporte' },
]

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth({})
  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <SubMenuLayout titulo="Configuración" menu={CONFIG_MENU}>
          {children}
        </SubMenuLayout>
      </Box>
      <Footer />
    </Box>
  )
}
