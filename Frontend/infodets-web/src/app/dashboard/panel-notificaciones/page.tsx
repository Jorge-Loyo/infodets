'use client'

import { Box, Title, Text, Paper, Stack, Group, ThemeIcon, Badge, Switch, Divider, Button } from '@mantine/core'
import { IconBellRinging, IconMail, IconDeviceMobile, IconBrowser } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const CANALES = [
  { icon: IconMail, label: 'Correo electrónico', desc: 'Notificaciones por email institucional', activo: true, color: 'blue' },
  { icon: IconDeviceMobile, label: 'SMS', desc: 'Alertas por mensaje de texto', activo: false, color: 'teal' },
  { icon: IconBrowser, label: 'Notificaciones web', desc: 'Alertas en el navegador', activo: true, color: 'violet' },
]

const EVENTOS = [
  { label: 'Nuevo documento cargado', activo: true },
  { label: 'Usuario creado', activo: true },
  { label: 'Error en procesamiento', activo: true },
  { label: 'Consulta sin respuesta', activo: false },
  { label: 'Feedback negativo recibido', activo: true },
]

export default function PanelNotificacionesPage() {
  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Panel de notificaciones</Title>
        <Text c="dimmed" size="sm" mb="xl">Configura los canales y eventos de notificación del sistema.</Text>

        <Stack gap="lg">
          <Paper withBorder radius="md" p="xl">
            <Text fw={600} mb="md">Canales de notificación</Text>
            <Divider mb="md" />
            <Stack gap="md">
              {CANALES.map((canal, i) => (
                <motion.div key={canal.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <Group justify="space-between">
                    <Group gap="sm">
                      <ThemeIcon size={36} radius="md" variant="light" color={canal.color}>
                        <canal.icon size={18} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={500}>{canal.label}</Text>
                        <Text size="xs" c="dimmed">{canal.desc}</Text>
                      </div>
                    </Group>
                    <Switch checked={canal.activo} disabled />
                  </Group>
                </motion.div>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="md" p="xl">
            <Text fw={600} mb="md">Eventos que generan notificación</Text>
            <Divider mb="md" />
            <Stack gap="sm">
              {EVENTOS.map((evento, i) => (
                <motion.div key={evento.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconBellRinging size={14} opacity={0.5} />
                      <Text size="sm">{evento.label}</Text>
                    </Group>
                    <Switch checked={evento.activo} disabled />
                  </Group>
                </motion.div>
              ))}
            </Stack>
          </Paper>

          <Group justify="flex-end">
            <Button radius="md" disabled>Guardar configuración</Button>
          </Group>
        </Stack>
      </motion.div>
    </Box>
  )
}
