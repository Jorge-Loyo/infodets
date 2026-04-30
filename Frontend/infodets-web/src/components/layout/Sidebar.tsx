'use client'

import { Box, NavLink, Stack, Text, Divider, Badge } from '@mantine/core'
import { IconHome, IconUser, IconFilePlus, IconShieldHalf, IconNews, IconMessageCircle } from '@tabler/icons-react'
import { AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/lib/constants'

const MENU_ITEMS = [
  { label: 'Home',               icon: IconHome,          href: ROUTES.CONSULTA,  key: 'consulta' },
  { label: 'Perfil',             icon: IconUser,          href: '/perfil',        key: 'perfil' },
  { label: 'Nueva documentación',icon: IconFilePlus,      href: '/documentacion', key: 'documentacion' },
  { label: 'Mis consultas',      icon: IconMessageCircle, href: '/mis-consultas', key: 'consulta' },
  { label: 'Administrador',      icon: IconShieldHalf,    href: ROUTES.DASHBOARD, key: 'dashboard' },
  { label: 'Noticias generales', icon: IconNews,          href: '/noticias',      key: 'noticias' },
]

export function Sidebar() {
  const { sidebarAbierto } = useSidebar()
  const { tienePermiso } = useSessionStore()
  const { noLeidos, noticiasNoLeidas, marcarNoticiasVistas } = useUiStore()
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
                rightSection={
                  item.href === '/mis-consultas' && noLeidos > 0
                    ? <Badge size="xs" color="red" variant="filled" circle>{noLeidos}</Badge>
                    : item.href === '/noticias' && noticiasNoLeidas > 0
                    ? <Badge size="xs" color="orange" variant="filled" circle>{noticiasNoLeidas}</Badge>
                    : undefined
                }
                active={pathname === item.href}
                onClick={() => {
                  if (item.href === '/noticias') marcarNoticiasVistas()
                  router.push(item.href)
                }}
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
