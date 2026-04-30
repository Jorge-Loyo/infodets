'use client'

import { Group, Text, Avatar, ActionIcon, Burger, Box, Indicator, Tooltip, Badge } from '@mantine/core'
import { IconLogout, IconUser, IconMessageCircle, IconBell } from '@tabler/icons-react'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { APP_NAME } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axiosInstance'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'

export function Header() {
  const { usuario, logout } = useAuth()
  const { toggleSidebar } = useSidebar()
  const { isAuthenticated } = useSessionStore()
  const [mounted, setMounted] = useState(false)
  const { noLeidos, setNoLeidos, noticiasNoLeidas, setNoticiasNoLeidas, ultimaVisitaNoticias } = useUiStore()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isAuthenticated()) return
    const fetchNoLeidos = () => {
      axiosInstance.get<{ count: number }>('/tickets/usuario/no-leidos')
        .then(res => setNoLeidos(res.data.count))
        .catch(() => {})
    }
    fetchNoLeidos()
    const interval = setInterval(fetchNoLeidos, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const fetchNoticias = () => {
      axiosInstance.get<{ count: number }>(`/noticias/nuevas/count?desde=${encodeURIComponent(ultimaVisitaNoticias)}`)
        .then(res => setNoticiasNoLeidas(res.data.count))
        .catch(() => {})
    }
    fetchNoticias()
    const interval = setInterval(fetchNoticias, 60000)
    return () => clearInterval(interval)
  }, [ultimaVisitaNoticias])

  return (
    <Box
      style={{
        height: 60,
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        backgroundColor: 'var(--mantine-color-white)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Group gap="sm">
        {mounted && <Burger size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar" />}
        <Text fw={700} size="lg" c="blue">{APP_NAME}</Text>
      </Group>

      <Group gap="sm">
        {mounted && (
          <Tooltip label={noLeidos > 0 ? `${noLeidos} respuesta${noLeidos > 1 ? 's' : ''} nueva${noLeidos > 1 ? 's' : ''}` : 'Mis consultas'} withArrow>
            <Indicator disabled={noLeidos === 0} label={noLeidos} size={16} color="red" processing={noLeidos > 0}>
              <ActionIcon variant="light" color="blue" radius="xl" onClick={() => router.push('/mis-consultas')}>
                <IconMessageCircle size={16} />
              </ActionIcon>
            </Indicator>
          </Tooltip>
        )}
        {mounted && (
          <Tooltip label={noticiasNoLeidas > 0 ? `${noticiasNoLeidas} noticia${noticiasNoLeidas > 1 ? 's' : ''} nueva${noticiasNoLeidas > 1 ? 's' : ''}` : 'Noticias'} withArrow>
            <Indicator disabled={noticiasNoLeidas === 0} label={noticiasNoLeidas} size={16} color="orange" processing={noticiasNoLeidas > 0}>
              <ActionIcon variant="light" color="orange" radius="xl" onClick={() => router.push('/noticias')}>
                <IconBell size={16} />
              </ActionIcon>
            </Indicator>
          </Tooltip>
        )}
        <Avatar radius="xl" size="sm" color="blue">
          <IconUser size={14} />
        </Avatar>
        {mounted && (
          <Box visibleFrom="sm">
            <Text size="sm" fw={500} lh={1.2}>{usuario?.nombre ?? 'Usuario'}</Text>
            <Text size="xs" c="dimmed">{usuario?.rol ?? ''}</Text>
          </Box>
        )}
        <ActionIcon variant="light" color="red" radius="xl" onClick={logout} title="Cerrar sesión">
          <IconLogout size={16} />
        </ActionIcon>
      </Group>
    </Box>
  )
}
