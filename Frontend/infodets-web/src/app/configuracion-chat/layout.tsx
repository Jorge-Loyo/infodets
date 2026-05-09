'use client'

import { Box } from '@mantine/core'
import { IconBell, IconFiles, IconRobot } from '@tabler/icons-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { SubMenuLayout } from '@/components/layout/SubMenuLayout'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

const CONFIG_CHAT_MENU = [
  { label: 'Notificaciones',    icon: IconBell,  href: '/configuracion-chat/notificaciones' },
  { label: 'Documentación',     icon: IconFiles, href: '/configuracion-chat/documentacion' },
  { label: 'Identidad del Bot', icon: IconRobot, href: '/configuracion-chat/identidad-bot' },
]

export default function ConfiguracionChatLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth({})
  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <SubMenuLayout titulo="Configuración de Chat" menu={CONFIG_CHAT_MENU}>
          {children}
        </SubMenuLayout>
      </Box>
      <Footer />
    </Box>
  )
}
