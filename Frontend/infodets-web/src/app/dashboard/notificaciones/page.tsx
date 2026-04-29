'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, ActionIcon, Divider, LoadingOverlay, Button, Tabs,
} from '@mantine/core'
import { IconBell, IconCheck, IconTrash, IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import axiosInstance from '@/lib/axiosInstance'

interface Ticket {
  id: string
  pregunta: string
  usuario_id?: string
  puntaje_confianza: number
  estado: string
  creado_en: string
}

const formatFecha = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Hace unos minutos'
  if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  return `Hace ${d} día${d > 1 ? 's' : ''}`
}

export default function NotificacionesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<string>('pendiente')

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await axiosInstance.get<Ticket[]>('/tickets')
      setTickets(res.data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar tickets' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const marcarRevisado = async (id: string) => {
    try {
      const res = await axiosInstance.put<Ticket>(`/tickets/${id}/revisar`)
      setTickets((prev) => prev.map((t) => t.id === res.data.id ? res.data : t))
      notifications.show({ color: 'green', message: 'Ticket marcado como revisado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar ticket' })
    }
  }

  const eliminar = async (id: string) => {
    try {
      await axiosInstance.delete(`/tickets/${id}`)
      setTickets((prev) => prev.filter((t) => t.id !== id))
      notifications.show({ color: 'green', message: 'Ticket eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar ticket' })
    }
  }

  const filtrados = tickets.filter((t) => t.estado === tab)
  const pendientes = tickets.filter((t) => t.estado === 'pendiente').length

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3} mb="xs">Tickets de vacío de información</Title>
            <Text c="dimmed" size="sm">
              Consultas que no encontraron documentación oficial (confianza &lt; 30%). Requieren atención del equipo.
            </Text>
          </div>
          <Group gap="sm">
            {pendientes > 0 && <Badge color="red" size="lg">{pendientes} pendiente{pendientes > 1 ? 's' : ''}</Badge>}
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
              Actualizar
            </Button>
          </Group>
        </Group>

        <Tabs value={tab} onChange={(v) => setTab(v ?? 'pendiente')} mb="md">
          <Tabs.List>
            <Tabs.Tab value="pendiente" leftSection={<IconAlertCircle size={14} />}>
              Pendientes {pendientes > 0 && <Badge size="xs" color="red" ml={4}>{pendientes}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="revisado" leftSection={<IconCheck size={14} />}>
              Revisados
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="green" radius="xl">
                <IconBell size={24} />
              </ThemeIcon>
              <Text c="dimmed" size="sm">
                {tab === 'pendiente' ? 'No hay tickets pendientes ✅' : 'No hay tickets revisados'}
              </Text>
            </Stack>
          )}

          <Stack gap={0}>
            {filtrados.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <Group
                  gap="md"
                  style={{
                    backgroundColor: t.estado === 'pendiente' ? 'var(--mantine-color-red-0)' : 'transparent',
                    borderRadius: 8,
                    padding: '12px 8px',
                    opacity: t.estado === 'revisado' ? 0.7 : 1,
                  }}
                >
                  <ThemeIcon size={36} radius="xl" variant="light" color={t.estado === 'pendiente' ? 'red' : 'gray'}>
                    <IconAlertCircle size={18} />
                  </ThemeIcon>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text size="sm" fw={t.estado === 'pendiente' ? 600 : 400} lineClamp={2}>
                        {t.pregunta}
                      </Text>
                      {t.estado === 'pendiente' && <Badge size="xs" color="red" variant="filled">Sin respuesta</Badge>}
                    </Group>
                    <Group gap="xs">
                      <Badge size="xs" variant="light" color="orange">
                        {Math.round(t.puntaje_confianza * 100)}% confianza
                      </Badge>
                      <Text size="xs" c="dimmed">{formatFecha(t.creado_en)}</Text>
                      {t.usuario_id && <Text size="xs" c="dimmed">Usuario: {t.usuario_id.slice(0, 8)}...</Text>}
                    </Group>
                  </Stack>
                  <Group gap={4}>
                    {t.estado === 'pendiente' && (
                      <ActionIcon variant="subtle" color="green" size="sm" title="Marcar como revisado" onClick={() => marcarRevisado(t.id)}>
                        <IconCheck size={14} />
                      </ActionIcon>
                    )}
                    <ActionIcon variant="subtle" color="red" size="sm" title="Eliminar" onClick={() => eliminar(t.id)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
                {i < filtrados.length - 1 && <Divider />}
              </motion.div>
            ))}
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  )
}
