'use client'

import { Box, Stack, Text, Paper, Skeleton } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const HISTORIAL_MOCK = [
  { id: '1', pregunta: '¿Cuál es el procedimiento para solicitar un permiso?' },
  { id: '2', pregunta: '¿Cuáles son los requisitos para la licitación?' },
  { id: '3', pregunta: '¿Dónde puedo ver las normativas vigentes?' },
]

export function HistorialPanel() {
  return (
    <Box
      style={{
        width: 260,
        flexShrink: 0,
        borderLeft: '1px solid var(--mantine-color-gray-2)',
        backgroundColor: 'var(--mantine-color-gray-0)',
        height: '100%',
        overflowY: 'auto',
        padding: 16,
      }}
    >
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
        Consultas recientes
      </Text>

      <Stack gap="xs">
        {HISTORIAL_MOCK.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Paper
              p="xs"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
            >
              <IconClock size={12} style={{ marginRight: 6, opacity: 0.4 }} />
              <Text size="xs" c="dimmed" lineClamp={2}>
                {item.pregunta}
              </Text>
            </Paper>
          </motion.div>
        ))}

        <Skeleton height={52} radius="md" />
        <Skeleton height={52} radius="md" opacity={0.5} />
      </Stack>
    </Box>
  )
}
