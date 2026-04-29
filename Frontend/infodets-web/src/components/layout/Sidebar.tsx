'use client'

import { Box, NavLink, Stack, Text, Divider } from '@mantine/core'
import { IconHome, IconUser, IconFilePlus, IconShieldHalf, IconNews } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { ROUTES } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { permisoService } from '@/services/api/permisoService'

const MENU_ITEMS = [
  { label: 'Home', icon: IconHome, href: ROUTES.CONSULTA, adminOnly: false, key: 'consulta' },
  { label: 'Perfil', icon: IconUser, href: '/perfil', adminOnly: false, key: 'perfil' },
  { label: 'Nueva documentación', icon: IconFilePlus, href: '/documentacion', adminOnly: false, key: 'documentacion' },
  { label: 'Administrador', icon: IconShieldHalf, href: ROUTES.DASHBOARD, adminOnly: true, key: 'dashboard' },
  { label: 'Noticias generales', icon: IconNews, href: '/noticias', adminOnly: false, key: 'noticias' },
]

export function Sidebar() {
  const { sidebarAbierto } = useSidebar()
  const { isAdmin, usuario } = useSessionStore()
  const pathname = usePathname()
  const router = useRouter()
  const [montado, setMontado] = useState(false)
  const [permisos, setPermisos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMontado(true)
    const cargarPermisos = () => {
      const id = usuario?.rdsId
      if (id) {
        permisoService.obtener(id).then(setPermisos).catch(() => {})
      }
    }
    cargarPermisos()
    window.addEventListener('permisos-actualizados', cargarPermisos)
    return () => window.removeEventListener('permisos-actualizados', cargarPermisos)
  }, [usuario?.rdsId])

  const esAdmin = montado && isAdmin()
  const tienePermiso = (key: string) => !montado || permisos[key] !== false

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
            <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">
              Menú
            </Text>

            {MENU_ITEMS.filter(item => (!item.adminOnly || esAdmin) && tienePermiso(item.key)).map((item) => (
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
