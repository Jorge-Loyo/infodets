'use client'

import { Box, Stack, Text, Paper, Skeleton, Group } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import axiosInstance from '@/lib/axiosInstance'
import { useSessionStore } from '@/store/sessionStore'

interface HistorialItem {
  id: string
  pregunta: string
  creado_en: string
}

export function HistorialPanel() {
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [cargando, setCargando] = useState(true)
  const { usuario } = useSessionStore()

  useEffect(() => {
    if (!usuario?.rdsId) { setCargando(false); return }
    axiosInstance.get<HistorialItem[]>(`/chat/historial/usuario/${usuario.rdsId}`)
      .then((res) => setHistorial(res.data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [usuario?.rdsId])

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
        {cargando && [1, 2, 3].map((i) => <Skeleton key={i} height={52} radius="md" opacity={i === 3 ? 0.4 : 0.7} />)}

        {!cargando && historial.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" mt="md">Sin consultas aún</Text>
        )}

        {historial.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <Paper p="xs" radius="md" withBorder style={{ cursor: 'pointer' }}>
              <Group gap={6} wrap="nowrap">
                <IconClock size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                <Text size="xs" c="dimmed" lineClamp={2}>{item.pregunta}</Text>
              </Group>
            </Paper>
          </motion.div>
        ))}
      </Stack>
    </Box>
  )
}
