'use client'

import { Group, Text, Avatar, ActionIcon, Burger, Box } from '@mantine/core'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSidebar } from '@/hooks/ui/useSidebar'
import { APP_NAME } from '@/lib/constants'

export function Header() {
  const { usuario, logout } = useAuth()
  const { toggleSidebar } = useSidebar()

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
        <Burger size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar" />
        <Text fw={700} size="lg" c="blue">
          {APP_NAME}
        </Text>
      </Group>

      <Group gap="sm">
        <Avatar radius="xl" size="sm" color="blue">
          <IconUser size={14} />
        </Avatar>
        <Box visibleFrom="sm">
          <Text size="sm" fw={500} lh={1.2}>{usuario?.nombre ?? 'Usuario'}</Text>
          <Text size="xs" c="dimmed">{usuario?.rol ?? ''}</Text>
        </Box>
        <ActionIcon variant="light" color="red" radius="xl" onClick={logout} title="Cerrar sesión">
          <IconLogout size={16} />
        </ActionIcon>
      </Group>
    </Box>
  )
}
