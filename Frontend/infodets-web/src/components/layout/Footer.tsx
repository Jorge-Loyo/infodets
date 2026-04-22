'use client'

import { Box, Text, Group } from '@mantine/core'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

export function Footer() {
  return (
    <Box
      style={{
        height: 50,
        borderTop: '1px solid var(--mantine-color-gray-2)',
        backgroundColor: 'var(--mantine-color-white)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Group justify="space-between" w="100%">
        <Text size="xs" c="dimmed">{APP_NAME} — {APP_DESCRIPTION}</Text>
        <Text size="xs" c="dimmed">v1.0.0</Text>
      </Group>
    </Box>
  )
}
