'use client'

import { Box, Title, Text, Paper, Stack, Group, ThemeIcon, Badge, ActionIcon, Divider } from '@mantine/core'
import { IconBell, IconCheck, IconTrash, IconAlertCircle, IconInfoCircle, IconCircleCheck } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const NOTIFICACIONES_MOCK = [
  { id: '1', tipo: 'info', titulo: 'Nuevo documento procesado', desc: 'Resolución 001-2024.pdf fue procesado correctamente.', fecha: 'Hace 5 min', leida: false },
  { id: '2', tipo: 'success', titulo: 'Usuario creado', desc: 'El usuario carlos.lopez fue creado exitosamente.', fecha: 'Hace 1 hora', leida: false },
  { id: '3', tipo: 'warning', titulo: 'Consulta sin respuesta', desc: 'Una consulta no pudo ser respondida por falta de documentación.', fecha: 'Hace 3 horas', leida: true },
  { id: '4', tipo: 'error', titulo: 'Error en procesamiento', desc: 'El archivo circular_2024.pdf no pudo ser procesado.', fecha: 'Ayer', leida: true },
]

const TIPO_CONFIG: Record<string, { color: string; icon: typeof IconBell }> = {
  info: { color: 'blue', icon: IconInfoCircle },
  success: { color: 'green', icon: IconCircleCheck },
  warning: { color: 'yellow', icon: IconAlertCircle },
  error: { color: 'red', icon: IconAlertCircle },
}

export default function NotificacionesPage() {
  const noLeidas = NOTIFICACIONES_MOCK.filter((n) => !n.leida).length

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3} mb="xs">Notificaciones</Title>
            <Text c="dimmed" size="sm">Visualiza las notificaciones activas del sistema.</Text>
          </div>
          {noLeidas > 0 && <Badge color="red" size="lg">{noLeidas} sin leer</Badge>}
        </Group>

        <Paper withBorder radius="md" p="xl">
          <Stack gap={0}>
            {NOTIFICACIONES_MOCK.map((n, i) => {
              const config = TIPO_CONFIG[n.tipo]
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Group
                    gap="md"
                    py="md"
                    style={{
                      opacity: n.leida ? 0.6 : 1,
                      backgroundColor: !n.leida ? 'var(--mantine-color-blue-0)' : 'transparent',
                      borderRadius: 8,
                      padding: '12px 8px',
                    }}
                  >
                    <ThemeIcon size={36} radius="xl" variant="light" color={config.color}>
                      <config.icon size={18} />
                    </ThemeIcon>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="sm" fw={n.leida ? 400 : 600}>{n.titulo}</Text>
                        {!n.leida && <Badge size="xs" color="blue" variant="filled">Nueva</Badge>}
                      </Group>
                      <Text size="xs" c="dimmed">{n.desc}</Text>
                      <Text size="xs" c="dimmed">{n.fecha}</Text>
                    </Stack>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" color="green" size="sm" disabled><IconCheck size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" disabled><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Group>
                  {i < NOTIFICACIONES_MOCK.length - 1 && <Divider />}
                </motion.div>
              )
            })}
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  )
}
