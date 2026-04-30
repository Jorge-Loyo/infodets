'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, ActionIcon, Divider, LoadingOverlay, Button,
  Tabs, ScrollArea, Textarea, Avatar,
} from '@mantine/core'
import {
  IconBell, IconCheck, IconTrash, IconAlertCircle, IconRefresh,
  IconBrain, IconX, IconSend, IconMessageCircle, IconAlertTriangle,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { notifications } from '@mantine/notifications'
import axiosInstance from '@/lib/axiosInstance'

interface Ticket {
  id: string
  pregunta: string
  usuario_id?: string
  usuario_nombre?: string
  usuario_email?: string
  puntaje_confianza: number
  nivel: number
  requiere_respuesta: boolean
  mensajes_no_leidos: number
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

interface Mensaje {
  id: string
  rol: 'admin' | 'usuario'
  texto: string
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

const NIVEL_COLOR: Record<number, string> = { 1: 'blue', 2: 'orange', 3: 'red' }
const NIVEL_LABEL: Record<number, string> = { 1: 'Nivel 1 - URL oficial', 2: 'Nivel 2 - Web', 3: 'Nivel 3 - Escalamiento' }

function HiloMensajes({ ticket, onClose, onResponded, onLeido }: { ticket: Ticket, onClose: () => void, onResponded: (id: string) => void, onLeido: (id: string) => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axiosInstance.get<Mensaje[]>(`/tickets/${ticket.id}/mensajes`)
      .then(res => {
        setMensajes(res.data)
        axiosInstance.patch(`/tickets/${ticket.id}/leer`)
          .then(() => onLeido(ticket.id))
          .catch(() => {})
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [ticket.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  const enviar = async () => {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      const res = await axiosInstance.post<Mensaje>(`/tickets/${ticket.id}/mensajes`, { texto: texto.trim() })
      setMensajes(prev => [...prev, res.data])
      setTexto('')
      if (res.data.rol === 'admin') onResponded(ticket.id)
    } catch {
      notifications.show({ color: 'red', message: 'Error al enviar mensaje' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Paper withBorder radius="md" p="md" mt="xs" bg="gray.0">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconMessageCircle size={14} />
          <Text size="sm" fw={600}>Respuesta al usuario</Text>
          {ticket.requiere_respuesta && (
            <Badge size="xs" color="red" variant="filled">Obligatorio</Badge>
          )}
        </Group>
        <ActionIcon size="xs" variant="subtle" onClick={onClose}><IconX size={12} /></ActionIcon>
      </Group>
      <Divider mb="xs" />

      <ScrollArea h={180} viewportRef={scrollRef} mb="xs">
        <LoadingOverlay visible={cargando} />
        {mensajes.length === 0 && !cargando && (
          <Text size="xs" c="dimmed" ta="center" py="md">Sin mensajes aún. Sé el primero en responder.</Text>
        )}
        <Stack gap="xs" p="xs">
          {mensajes.map((m) => (
            <Group key={m.id} justify={m.rol === 'admin' ? 'flex-end' : 'flex-start'} align="flex-start">
              {m.rol === 'usuario' && (
                <Avatar size="xs" radius="xl" color="blue" variant="filled">U</Avatar>
              )}
              <Paper p="xs" radius="md" maw="75%" style={{
                backgroundColor: m.rol === 'admin' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-2)',
                color: m.rol === 'admin' ? 'white' : 'inherit',
              }}>
                <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</Text>
                <Text size="xs" opacity={0.6} ta="right">{formatFecha(m.creado_en)}</Text>
              </Paper>
              {m.rol === 'admin' && (
                <Avatar size="xs" radius="xl" color="violet" variant="filled">A</Avatar>
              )}
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      <Group gap="xs" align="flex-end">
        <Textarea
          placeholder={ticket.requiere_respuesta ? 'Respuesta obligatoria para nivel 3...' : 'Escribe una respuesta al usuario...'}
          value={texto}
          onChange={e => setTexto(e.currentTarget.value)}
          autosize minRows={1} maxRows={3}
          radius="md" style={{ flex: 1 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
        />
        <ActionIcon size="lg" radius="md" variant="filled" color="blue"
          disabled={!texto.trim()} loading={enviando} onClick={enviar}>
          <IconSend size={14} />
        </ActionIcon>
      </Group>
    </Paper>
  )
}

export default function NotificacionesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [validaciones, setValidaciones] = useState<Validacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<string>('tickets')
  const [tabTicket, setTabTicket] = useState<string>('pendiente')
  const [ticketAbierto, setTicketAbierto] = useState<string | null>(null)

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
      if (ticketAbierto === id) setTicketAbierto(null)
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
    } catch {
      notifications.show({ color: 'red', message: 'Error al rechazar' })
    }
  }

  const ticketsFiltrados = tickets.filter(t =>
    tabTicket === 'pendiente' ? t.estado !== 'revisado' : t.estado === 'revisado'
  )
  const pendientesTickets = tickets.filter(t => t.estado !== 'revisado').length
  const requierenRespuesta = tickets.filter(t => t.requiere_respuesta && t.estado === 'pendiente').length

  const handleRespondido = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, estado: 'respondido', requiere_respuesta: false } : t))
  }

  const handleLeido = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, mensajes_no_leidos: 0 } : t))
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3} mb="xs">Notificaciones</Title>
            <Text c="dimmed" size="sm">Tickets del loop de retroalimentación y validaciones para entrenamiento de la IA.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
            Actualizar
          </Button>
        </Group>

        {requierenRespuesta > 0 && (
          <Paper withBorder radius="md" p="md" mb="md" bg="red.0" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
            <Group gap="xs">
              <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm" fw={600} c="red">{requierenRespuesta} ticket{requierenRespuesta > 1 ? 's' : ''} de nivel 3 requieren respuesta obligatoria</Text>
            </Group>
          </Paper>
        )}

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

          {tab === 'tickets' && (
            <>
              <Tabs value={tabTicket} onChange={v => setTabTicket(v ?? 'pendiente')} mb="md">
                <Tabs.List>
                  <Tabs.Tab value="pendiente">
                    Pendientes {pendientesTickets > 0 && <Badge size="xs" color="red" ml={4}>{pendientesTickets}</Badge>}
                  </Tabs.Tab>
                  <Tabs.Tab value="revisado">Revisados</Tabs.Tab>
                </Tabs.List>
              </Tabs>

              {!cargando && ticketsFiltrados.length === 0 && (
                <Stack align="center" py="xl">
                  <ThemeIcon size={48} variant="light" color="green" radius="xl"><IconBell size={24} /></ThemeIcon>
                  <Text c="dimmed" size="sm">{tabTicket === 'pendiente' ? 'No hay tickets pendientes ✅' : 'No hay tickets revisados'}</Text>
                </Stack>
              )}

              <Stack gap="xs">
                {ticketsFiltrados.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Paper withBorder radius="md" p="md" bg={t.requiere_respuesta && t.estado === 'pendiente' ? 'red.0' : t.estado === 'respondido' ? 'blue.0' : undefined}>
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <ThemeIcon size={36} radius="xl" variant="light" color={NIVEL_COLOR[t.nivel] ?? 'gray'}>
                            <IconAlertCircle size={18} />
                          </ThemeIcon>
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={600} lineClamp={2}>{t.pregunta}</Text>
                            {(t.usuario_nombre || t.usuario_email) && (
                              <Group gap={4}>
                                <Avatar size={16} radius="xl" color="blue" variant="filled">
                                  <Text size="xs">{(t.usuario_nombre ?? t.usuario_email ?? '?')[0].toUpperCase()}</Text>
                                </Avatar>
                                <Text size="xs" c="dimmed" fw={500}>
                                  {t.usuario_nombre ?? ''}
                                  {t.usuario_nombre && t.usuario_email && ' · '}
                                  {t.usuario_email ?? ''}
                                </Text>
                              </Group>
                            )}
                            {!t.usuario_id && (
                              <Text size="xs" c="dimmed">Invitado / sin cuenta</Text>
                            )}
                            <Group gap="xs" wrap="wrap">
                              <Badge size="xs" variant="light" color={NIVEL_COLOR[t.nivel] ?? 'gray'}>
                                {NIVEL_LABEL[t.nivel] ?? `Nivel ${t.nivel}`}
                              </Badge>
                              <Badge size="xs" variant="light" color="orange">{Math.round(t.puntaje_confianza * 100)}%</Badge>
                              {t.requiere_respuesta && t.estado === 'pendiente' && (
                                <Badge size="xs" color="red" variant="filled">Respuesta obligatoria</Badge>
                              )}
                              {t.estado === 'respondido' && (
                                <Badge size="xs" color="blue" variant="light">Respondido</Badge>
                              )}
                              {t.mensajes_no_leidos > 0 && (
                                <Badge size="xs" color="blue" variant="filled">{t.mensajes_no_leidos} nuevo{t.mensajes_no_leidos > 1 ? 's' : ''}</Badge>
                              )}
                              <Text size="xs" c="dimmed">{formatFecha(t.creado_en)}</Text>
                            </Group>
                          </Stack>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <ActionIcon
                            variant={ticketAbierto === t.id ? 'filled' : 'subtle'}
                            color="blue" size="sm"
                            title="Ver/responder"
                            onClick={() => setTicketAbierto(ticketAbierto === t.id ? null : t.id)}
                          >
                            <IconMessageCircle size={14} />
                          </ActionIcon>
                          {t.estado === 'pendiente' && (
                            <ActionIcon variant="subtle" color="green" size="sm" title="Marcar revisado" onClick={() => marcarRevisado(t.id)}>
                              <IconCheck size={14} />
                            </ActionIcon>
                          )}
                          <ActionIcon variant="subtle" color="red" size="sm" title="Eliminar" onClick={() => eliminarTicket(t.id)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      {ticketAbierto === t.id && (
                        <HiloMensajes ticket={t} onClose={() => setTicketAbierto(null)} onResponded={handleRespondido} onLeido={handleLeido} />
                      )}
                    </Paper>
                    {i < ticketsFiltrados.length - 1 && <Divider />}
                  </motion.div>
                ))}
              </Stack>
            </>
          )}

          {tab === 'validaciones' && (
            <>
              <Text size="sm" c="dimmed" mb="md">
                Consultas con confianza entre 50% y 85% que requieren revisión manual antes de indexarse en la IA.
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
                          <Badge size="xs" color="teal" variant="light">{Math.round(v.puntaje_confianza * 100)}%</Badge>
                          <Text size="xs" c="dimmed">{formatFecha(v.creado_en)}</Text>
                        </Group>
                        <Group gap={4}>
                          <ActionIcon variant="filled" color="green" size="sm" onClick={() => aprobarValidacion(v.id)}><IconCheck size={14} /></ActionIcon>
                          <ActionIcon variant="filled" color="red" size="sm" onClick={() => rechazarValidacion(v.id)}><IconX size={14} /></ActionIcon>
                        </Group>
                      </Group>
                      <Text size="sm" fw={600} mb={4}>❓ {v.pregunta}</Text>
                      <ScrollArea h={80}>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{v.respuesta}</Text>
                      </ScrollArea>
                    </Paper>
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
