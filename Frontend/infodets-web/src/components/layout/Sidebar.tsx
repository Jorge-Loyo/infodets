'use client'

import { Box, NavLink, Stack, Text, Divider } from '@mantine/core'
import { IconHome, IconUser, IconFilePlus, IconShieldHalf, IconNews } from '@tabler/icons-react'
import { AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { ROUTES } from '@/lib/constants'

const MENU_ITEMS = [
  { label: 'Home',               icon: IconHome,      href: ROUTES.CONSULTA, key: 'consulta' },
  { label: 'Perfil',             icon: IconUser,      href: '/perfil',       key: 'perfil' },
  { label: 'Nueva documentación',icon: IconFilePlus,  href: '/documentacion',key: 'documentacion' },
  { label: 'Administrador',      icon: IconShieldHalf,href: ROUTES.DASHBOARD,key: 'dashboard' },
  { label: 'Noticias generales', icon: IconNews,      href: '/noticias',     key: 'noticias' },
]

export function Sidebar() {
  const { sidebarAbierto } = useSidebar()
  const { tienePermiso } = useSessionStore()
  const pathname = usePathname()
  const router = useRouter()

  const itemsVisibles = MENU_ITEMS.filter(item => tienePermiso(item.key))

  return (
    <AnimatePresence>
      {sidebarAbierto && (
        <Box
          style={{
            borderRight: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'var(--mantine-color-white)',
            height: '100%',
            overflow: 'hidden',
            flexShrink: 0,
            width: 240,
          }}
        >
          <Stack gap={0} p="sm" style={{ minWidth: 240 }}>
            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">Menú</Text>

            {itemsVisibles.map(item => (
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

            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">Historial</Text>
          </Stack>
        </Box>
      )}
    </AnimatePresence>
  )
}
