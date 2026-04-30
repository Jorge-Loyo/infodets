'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, ActionIcon, Divider, LoadingOverlay, Button, Tabs, ScrollArea,
} from '@mantine/core'
import { IconBell, IconCheck, IconTrash, IconAlertCircle, IconRefresh, IconBrain, IconX } from '@tabler/icons-react'
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

interface Validacion {
  id: string
  pregunta: string
  respuesta: string
  puntaje_confianza: number
  fuente: string
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
  const [validaciones, setValidaciones] = useState<Validacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<string>('tickets')
  const [tabTicket, setTabTicket] = useState<string>('pendiente')

  const cargar = async () => {
    setCargando(true)
    try {
      const [resTickets, resVal] = await Promise.all([
        axiosInstance.get<Ticket[]>('/tickets'),
        axiosInstance.get<Validacion[]>('/validaciones?estado=pendiente'),
      ])
      setTickets(resTickets.data)
      setValidaciones(resVal.data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar notificaciones' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const marcarRevisado = async (id: string) => {
    try {
      const res = await axiosInstance.put<Ticket>(`/tickets/${id}/revisar`)
      setTickets(prev => prev.map(t => t.id === res.data.id ? res.data : t))
      notifications.show({ color: 'green', message: 'Ticket marcado como revisado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar ticket' })
    }
  }

  const eliminarTicket = async (id: string) => {
    try {
      await axiosInstance.delete(`/tickets/${id}`)
      setTickets(prev => prev.filter(t => t.id !== id))
      notifications.show({ color: 'green', message: 'Ticket eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar ticket' })
    }
  }

  const aprobarValidacion = async (id: string) => {
    try {
      await axiosInstance.post(`/validaciones/${id}/aprobar`)
      setValidaciones(prev => prev.filter(v => v.id !== id))
      notifications.show({ color: 'green', message: 'Respuesta aprobada e indexada en la IA ✅' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al aprobar' })
    }
  }

  const rechazarValidacion = async (id: string) => {
    try {
      await axiosInstance.post(`/validaciones/${id}/rechazar`)
      setValidaciones(prev => prev.filter(v => v.id !== id))
      notifications.show({ color: 'orange', message: 'Respuesta rechazada' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al rechazar' })
    }
  }

  const ticketsFiltrados = tickets.filter(t => t.estado === tabTicket)
  const pendientesTickets = tickets.filter(t => t.estado === 'pendiente').length

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3} mb="xs">Notificaciones</Title>
            <Text c="dimmed" size="sm">Tickets de vacío de información y validaciones para entrenamiento de la IA.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
            Actualizar
          </Button>
        </Group>

        <Tabs value={tab} onChange={v => setTab(v ?? 'tickets')} mb="md">
          <Tabs.List>
            <Tabs.Tab value="tickets" leftSection={<IconAlertCircle size={14} />}>
              Tickets vacíos
              {pendientesTickets > 0 && <Badge size="xs" color="red" ml={4}>{pendientesTickets}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="validaciones" leftSection={<IconBrain size={14} />}>
              Validaciones IA
              {validaciones.length > 0 && <Badge size="xs" color="blue" ml={4}>{validaciones.length}</Badge>}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          {/* ── TAB TICKETS ── */}
          {tab === 'tickets' && (
            <>
              <Tabs value={tabTicket} onChange={v => setTabTicket(v ?? 'pendiente')} mb="md">
                <Tabs.List>
                  <Tabs.Tab value="pendiente">Pendientes {pendientesTickets > 0 && <Badge size="xs" color="red" ml={4}>{pendientesTickets}</Badge>}</Tabs.Tab>
                  <Tabs.Tab value="revisado">Revisados</Tabs.Tab>
                </Tabs.List>
              </Tabs>
              {!cargando && ticketsFiltrados.length === 0 && (
                <Stack align="center" py="xl">
                  <ThemeIcon size={48} variant="light" color="green" radius="xl"><IconBell size={24} /></ThemeIcon>
                  <Text c="dimmed" size="sm">{tabTicket === 'pendiente' ? 'No hay tickets pendientes ✅' : 'No hay tickets revisados'}</Text>
                </Stack>
              )}
              <Stack gap={0}>
                {ticketsFiltrados.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Group gap="md" style={{ backgroundColor: t.estado === 'pendiente' ? 'var(--mantine-color-red-0)' : 'transparent', borderRadius: 8, padding: '12px 8px', opacity: t.estado === 'revisado' ? 0.7 : 1 }}>
                      <ThemeIcon size={36} radius="xl" variant="light" color={t.estado === 'pendiente' ? 'red' : 'gray'}><IconAlertCircle size={18} /></ThemeIcon>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="sm" fw={t.estado === 'pendiente' ? 600 : 400} lineClamp={2}>{t.pregunta}</Text>
                        <Group gap="xs">
                          <Badge size="xs" variant="light" color="orange">{Math.round(t.puntaje_confianza * 100)}% confianza</Badge>
                          <Text size="xs" c="dimmed">{formatFecha(t.creado_en)}</Text>
                        </Group>
                      </Stack>
                      <Group gap={4}>
                        {t.estado === 'pendiente' && (
                          <ActionIcon variant="subtle" color="green" size="sm" title="Marcar revisado" onClick={() => marcarRevisado(t.id)}><IconCheck size={14} /></ActionIcon>
                        )}
                        <ActionIcon variant="subtle" color="red" size="sm" title="Eliminar" onClick={() => eliminarTicket(t.id)}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Group>
                    {i < ticketsFiltrados.length - 1 && <Divider />}
                  </motion.div>
                ))}
              </Stack>
            </>
          )}

          {/* ── TAB VALIDACIONES ── */}
          {tab === 'validaciones' && (
            <>
              <Text size="sm" c="dimmed" mb="md">
                Consultas con confianza entre 50% y 85% que requieren revisión manual antes de indexarse en la IA.
                Las consultas con confianza ≥ 85% se indexan automáticamente.
              </Text>
              {!cargando && validaciones.length === 0 && (
                <Stack align="center" py="xl">
                  <ThemeIcon size={48} variant="light" color="blue" radius="xl"><IconBrain size={24} /></ThemeIcon>
                  <Text c="dimmed" size="sm">No hay validaciones pendientes ✅</Text>
                </Stack>
              )}
              <Stack gap="md">
                {validaciones.map((v, i) => (
                  <motion.div key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Paper withBorder p="md" radius="md" bg="blue.0">
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <Badge size="xs" color="blue" variant="light">{v.fuente}</Badge>
                          <Badge size="xs" color="teal" variant="light">{Math.round(v.puntaje_confianza * 100)}% confianza</Badge>
                          <Text size="xs" c="dimmed">{formatFecha(v.creado_en)}</Text>
                        </Group>
                        <Group gap={4}>
                          <ActionIcon variant="filled" color="green" size="sm" title="Aprobar e indexar en IA" onClick={() => aprobarValidacion(v.id)}><IconCheck size={14} /></ActionIcon>
                          <ActionIcon variant="filled" color="red" size="sm" title="Rechazar" onClick={() => rechazarValidacion(v.id)}><IconX size={14} /></ActionIcon>
                        </Group>
                      </Group>
                      <Text size="sm" fw={600} mb={4}>❓ {v.pregunta}</Text>
                      <ScrollArea h={80}>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{v.respuesta}</Text>
                      </ScrollArea>
                    </Paper>
                    {i < validaciones.length - 1 && <Divider />}
                  </motion.div>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
