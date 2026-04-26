'use client'

import { Box, NavLink, Stack, Text, Divider } from '@mantine/core'
import { IconHome, IconUser, IconFilePlus, IconShieldHalf, IconNews } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { ROUTES } from '@/lib/constants'

const MENU_ITEMS = [
  { label: 'Home', icon: IconHome, href: ROUTES.CONSULTA, adminOnly: false },
  { label: 'Perfil', icon: IconUser, href: '/perfil', adminOnly: false },
  { label: 'Nueva documentación', icon: IconFilePlus, href: '/documentacion', adminOnly: false },
  { label: 'Administrador', icon: IconShieldHalf, href: ROUTES.DASHBOARD, adminOnly: true },
  { label: 'Noticias generales', icon: IconNews, href: '/noticias', adminOnly: false },
]

export function Sidebar() {
  const { sidebarAbierto } = useSidebar()
  const { isAdmin } = useSessionStore()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <AnimatePresence>
      {sidebarAbierto && (
        <Box
          component={motion.div}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            borderRight: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'var(--mantine-color-white)',
            height: '100%',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Stack gap={0} p="sm" style={{ minWidth: 240 }}>
            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">
              Menú
            </Text>

            {MENU_ITEMS.filter(item => !item.adminOnly || isAdmin()).map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={pathname === item.href}
                onClick={() => router.push(item.href)}
                style={{ cursor: 'pointer', borderRadius: 8 }}
              />
            ))}

            <Divider my="sm" />

            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">
              Historial
            </Text>
          </Stack>
        </Box>
      )}
    </AnimatePresence>
  )
}
