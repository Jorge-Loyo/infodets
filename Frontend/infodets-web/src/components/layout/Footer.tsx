'use client'

import { Box, Text, Group, Divider, Anchor, Image } from '@mantine/core'
import { APP_NAME, APP_VERSION } from '@/lib/constants'
import { useUiStore } from '@/store/uiStore'

const AÑO = new Date().getFullYear()

export function Footer() {
  const { headerColor } = useUiStore()
  const isDark = headerColor !== '#ffffff' && headerColor !== ''

  return (
    <Box
      style={{
        borderTop: isDark ? 'none' : '1px solid var(--mantine-color-default-border)',
        backgroundColor: headerColor === '#ffffff' ? 'var(--mantine-color-body)' : headerColor,
        padding: '20px 24px',
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">

        {/* Izquierda — marca */}
        <Group gap="xs">
          <Image src="/infodets-logo.png" alt={APP_NAME} h={50} w="auto" fit="contain" style={{ backgroundColor: 'white', borderRadius: 4, padding: 2 }} />
          <Text size="xs" c={isDark ? 'white' : 'dimmed'}>©</Text>
          <Text size="xs" c={isDark ? 'white' : 'dimmed'}>{AÑO}</Text>
          <Divider orientation="vertical" visibleFrom="sm" />
          <Text size="xs" c={isDark ? 'rgba(255,255,255,0.7)' : 'dimmed'} visibleFrom="sm">Sistema de Gestión de Conocimiento Dinámico</Text>
        </Group>

        {/* Centro — links */}
        <Group gap="md" visibleFrom="sm">
          <Anchor href="/noticias" size="xs" c={isDark ? 'rgba(255,255,255,0.8)' : 'dimmed'} underline="hover">Noticias</Anchor>
          <Anchor href="/configuracion/soporte" size="xs" c={isDark ? 'rgba(255,255,255,0.8)' : 'dimmed'} underline="hover">Soporte</Anchor>
          <Anchor href="/invitado" size="xs" c={isDark ? 'rgba(255,255,255,0.8)' : 'dimmed'} underline="hover">Consulta pública</Anchor>
        </Group>

        {/* Derecha — versión */}
        <Group gap="xs" visibleFrom="sm">
          <Text size="xs" c={isDark ? 'rgba(255,255,255,0.7)' : 'dimmed'}>v{APP_VERSION}</Text>
          <Divider orientation="vertical" />
          <Text size="xs" c={isDark ? 'white' : 'dimmed'}>Desarrollado por</Text>
          <Image src="/umbrella-logo.png" alt="Umbrella" h={50} w="auto" fit="contain" />
        </Group>

      </Group>
    </Box>
  )
}
