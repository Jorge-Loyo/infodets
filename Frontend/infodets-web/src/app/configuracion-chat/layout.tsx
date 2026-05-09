'use client'

import { Box, NavLink, Stack, Text, ThemeIcon, Divider } from '@mantine/core'
import { IconBell, IconFiles } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'

const CONFIG_CHAT_MENU = [
  { label: 'Notificaciones', icon: IconBell,  href: '/configuracion-chat/notificaciones' },
  { label: 'Documentación',  icon: IconFiles, href: '/configuracion-chat/documentacion' },
]

export default function ConfiguracionChatLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth({})
  const pathname = usePathname()
  const router = useRouter()

  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)', overflowY: 'auto', padding: 12 }}>
          <Stack gap={0}>
            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">Configuración de Chat</Text>
            <Divider mb="xs" />
            {CONFIG_CHAT_MENU.map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <NavLink
                  label={item.label}
                  leftSection={<ThemeIcon size="sm" variant={pathname === item.href ? 'filled' : 'light'} color="blue" radius="sm"><item.icon size={12} /></ThemeIcon>}
                  active={pathname === item.href}
                  onClick={() => router.push(item.href)}
                  style={{ cursor: 'pointer', borderRadius: 8, marginBottom: 2 }}
                />
              </motion.div>
            ))}
          </Stack>
        </Box>
        <Box style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--mantine-color-default-hover)' }}>
          {children}
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}
