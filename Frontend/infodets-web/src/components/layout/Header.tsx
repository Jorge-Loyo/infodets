'use client'

import { Group, Text, Avatar, ActionIcon, Burger, Box } from '@mantine/core'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { APP_NAME } from '@/lib/constants'
import { useState, useEffect } from 'react'

export function Header() {
  const { usuario, logout } = useAuth()
  const { toggleSidebar } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
