'use client'

import { Box } from '@mantine/core'
import { IconUsers, IconShieldCheck, IconNews, IconTable, IconPalette, IconActivity, IconFileText } from '@tabler/icons-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { SubMenuLayout } from '@/components/layout/SubMenuLayout'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

const ADMIN_MENU = [
  { label: 'Administrar usuarios',    icon: IconUsers,       href: '/dashboard/usuarios' },
  { label: 'Derechos y perfiles',     icon: IconShieldCheck, href: '/dashboard/derechos' },
  { label: 'Administrador de Noticias', icon: IconNews,      href: '/dashboard/noticias' },
  { label: 'Administrar tablas',      icon: IconTable,       href: '/dashboard/tablas' },
  { label: 'Temas y Visualización',   icon: IconPalette,     href: '/dashboard/temas' },
  { label: 'Log de Usuarios',         icon: IconActivity,    href: '/dashboard/log-usuarios' },
  { label: 'Log de Documentos',       icon: IconFileText,    href: '/dashboard/log-documentos' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth({ adminOnly: true })
  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <SubMenuLayout titulo="Panel Administrativo" menu={ADMIN_MENU}>
          {children}
        </SubMenuLayout>
      </Box>
      <Footer />
    </Box>
  )
}
