'use client'

import { Box, Text, Group, Divider, Anchor } from '@mantine/core'
import { APP_NAME } from '@/lib/constants'

const AÑO = new Date().getFullYear()

export function Footer() {
  return (
    <Box
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        padding: '12px 24px',
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">

        {/* Izquierda — marca */}
        <Group gap="xs">
          <Text size="xs" fw={600} c="dimmed">{APP_NAME}</Text>
          <Text size="xs" c="dimmed">©</Text>
          <Text size="xs" c="dimmed">{AÑO}</Text>
          <Divider orientation="vertical" visibleFrom="sm" />
          <Text size="xs" c="dimmed" visibleFrom="sm">Sistema de Gestión de Conocimiento Dinámico</Text>
        </Group>

        {/* Centro — links */}
        <Group gap="md" visibleFrom="sm">
          <Anchor href="/noticias" size="xs" c="dimmed" underline="hover">Noticias</Anchor>
          <Anchor href="/configuracion/soporte" size="xs" c="dimmed" underline="hover">Soporte</Anchor>
          <Anchor href="/invitado" size="xs" c="dimmed" underline="hover">Consulta pública</Anchor>
        </Group>

        {/* Derecha — versión */}
        <Group gap="xs" visibleFrom="sm">
          <Text size="xs" c="dimmed">v1.0.0</Text>
          <Divider orientation="vertical" />
          <Text size="xs" c="dimmed">Desarrollado por</Text>
          <Text size="xs" fw={500} c="dimmed">Umbrella</Text>
        </Group>

      </Group>
    </Box>
  )
}
