'use client'

import { Box, NavLink, Stack, Text, ThemeIcon, Divider } from '@mantine/core'
import {
  IconUsers, IconShieldCheck, IconIdBadge,
  IconBellRinging, IconBell, IconFiles, IconNews, IconTable,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

const ADMIN_MENU = [
  { label: 'Administrar usuarios', icon: IconUsers, href: '/dashboard/usuarios' },
  { label: 'Derechos de usuarios', icon: IconShieldCheck, href: '/dashboard/derechos' },
  { label: 'Administración de perfiles', icon: IconIdBadge, href: '/dashboard/perfiles' },
  { label: 'Panel de notificaciones', icon: IconBellRinging, href: '/dashboard/panel-notificaciones' },
  { label: 'Notificaciones', icon: IconBell, href: '/dashboard/notificaciones' },
  { label: 'Administración de documentación', icon: IconFiles, href: '/dashboard/documentacion' },
  { label: 'Administrador de Noticias', icon: IconNews, href: '/dashboard/noticias' },
  { label: 'Administrar tablas', icon: IconTable, href: '/dashboard/tablas' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth({ adminOnly: true })
  const pathname = usePathname()
  const router = useRouter()

  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />

        <Box
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'var(--mantine-color-white)',
            overflowY: 'auto',
            padding: 12,
          }}
        >
          <Stack gap={0}>
            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">
              Panel Administrativo
            </Text>
            <Divider mb="xs" />
            {ADMIN_MENU.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <NavLink
                  label={item.label}
                  leftSection={
                    <ThemeIcon
                      size="sm"
                      variant={pathname === item.href ? 'filled' : 'light'}
                      color="blue"
                      radius="sm"
                    >
                      <item.icon size={12} />
                    </ThemeIcon>
                  }
                  active={pathname === item.href}
                  onClick={() => router.push(item.href)}
                  style={{ cursor: 'pointer', borderRadius: 8, marginBottom: 2 }}
                />
              </motion.div>
            ))}
          </Stack>
        </Box>

        <Box style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--mantine-color-gray-0)' }}>
          {children}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
