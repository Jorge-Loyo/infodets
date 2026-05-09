'use client'

import { Box, NavLink, Stack, Text, Badge, Drawer } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconHome, IconFilePlus, IconShieldHalf, IconNews, IconMessageCircle, IconSettings, IconMessageCog } from '@tabler/icons-react'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/lib/constants'

const MENU_ITEMS = [
  { label: 'ChatBot',                icon: IconHome,          href: ROUTES.CONSULTA,       key: 'consulta' },
  { label: 'Nueva documentación',    icon: IconFilePlus,      href: '/documentacion',      key: 'documentacion' },
  { label: 'Mis consultas',          icon: IconMessageCircle, href: '/mis-consultas',      key: 'mis_consultas' },
  { label: 'Noticias generales',     icon: IconNews,          href: '/noticias',           key: 'noticias' },
  { label: 'Configuración de Chat',  icon: IconMessageCog,    href: '/configuracion-chat', key: 'configuracion_chat' },
  { label: 'Administrador',          icon: IconShieldHalf,    href: ROUTES.DASHBOARD,      key: 'dashboard' },
  { label: 'Configuración',          icon: IconSettings,      href: '/configuracion',      key: 'configuracion' },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { tienePermiso } = useSessionStore()
  const { noLeidos, noticiasNoLeidas, marcarNoticiasVistas } = useUiStore()
  const pathname = usePathname()
  const router = useRouter()

  const itemsVisibles = MENU_ITEMS.filter(item => tienePermiso(item.key))

  return (
    <Stack gap={0} p="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            onNavigate?.()
          }}
          style={{ cursor: 'pointer', borderRadius: 8 }}
        />
      ))}
    </Stack>
  )
}

export function Sidebar() {
  const { sidebarAbierto, setSidebar } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 48em)')

  // Mobile — Drawer overlay
  if (isMobile) {
    return (
      <Drawer
        opened={sidebarAbierto}
        onClose={() => setSidebar(false)}
        size={260}
        padding={0}
        withCloseButton={false}
        styles={{ body: { padding: 0, height: '100%' } }}
      >
        <SidebarContent onNavigate={() => setSidebar(false)} />
      </Drawer>
    )
  }

  // Desktop — fijo
  if (!sidebarAbierto) return null

  return (
    <Box
      style={{
        borderRight: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
        width: 240,
      }}
    >
      <SidebarContent />
    </Box>
  )
}
