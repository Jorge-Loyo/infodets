'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, Divider, LoadingOverlay, ScrollArea, Textarea,
  ActionIcon, Avatar,
} from '@mantine/core'
import { IconAlertCircle, IconMessageCircle, IconSend, IconRefresh } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { notifications } from '@mantine/notifications'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'
import axiosInstance from '@/lib/axiosInstance'
import { useUiStore } from '@/store/uiStore'

interface Ticket {
  id: string
  pregunta: string
  puntaje_confianza: number
  nivel: number
  requiere_respuesta: boolean
  mensajes_no_leidos: number
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
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

const NIVEL_COLOR: Record<number, string> = { 1: 'blue', 2: 'orange', 3: 'red' }
const NIVEL_LABEL: Record<number, string> = {
  1: 'Respondido con fuente oficial',
  2: 'Respondido con búsqueda web',
  3: 'Escalado a administrador',
}

function HiloTicket({ ticket, onLeido }: { ticket: Ticket, onLeido?: (id: string) => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axiosInstance.get<Mensaje[]>(`/tickets/${ticket.id}/mensajes`)
      .then(res => {
        setMensajes(res.data)
        // Marcar como leidos con PATCH explícito
        axiosInstance.patch(`/tickets/${ticket.id}/leer`)
          .then(() => onLeido?.(ticket.id))
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
    } catch {
      notifications.show({ color: 'red', message: 'Error al enviar mensaje' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Box mt="xs">
      <Divider mb="xs" />
      <ScrollArea h={200} viewportRef={scrollRef} mb="xs">
        <LoadingOverlay visible={cargando} />
        {mensajes.length === 0 && !cargando && (
          <Text size="xs" c="dimmed" ta="center" py="md">
            {ticket.nivel === 3
              ? 'Tu consulta fue escalada. Un administrador te responderá pronto.'
              : 'Sin mensajes aún.'}
          </Text>
        )}
        <Stack gap="xs" p="xs">
          {mensajes.map((m) => (
            <Group key={m.id} justify={m.rol === 'usuario' ? 'flex-end' : 'flex-start'} align="flex-start">
              {m.rol === 'admin' && (
                <Avatar size="xs" radius="xl" color="violet" variant="filled">A</Avatar>
              )}
              <Paper p="xs" radius="md" maw="75%" style={{
                backgroundColor: m.rol === 'usuario' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-2)',
                color: m.rol === 'usuario' ? 'white' : 'inherit',
              }}>
                {m.rol === 'admin' && (
                  <Text size="xs" fw={600} mb={2} c="violet">Administrador</Text>
                )}
                <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</Text>
                <Text size="xs" opacity={0.6} ta="right">{formatFecha(m.creado_en)}</Text>
              </Paper>
              {m.rol === 'usuario' && (
                <Avatar size="xs" radius="xl" color="blue" variant="filled">Yo</Avatar>
              )}
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      <Group gap="xs" align="flex-end">
        <Textarea
          placeholder="Escribe un mensaje al administrador..."
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
    </Box>
  )
}

export default function MisConsultasPage() {
  const { checking } = useRequireAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState<string | null>(null)
  const { noLeidos, setNoLeidos } = useUiStore()

  const cargar = () => {
    setCargando(true)
    axiosInstance.get<Ticket[]>('/tickets/usuario/mis-tickets')
      .then(res => setTickets(res.data))
      .catch(() => notifications.show({ color: 'red', message: 'Error al cargar consultas' }))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const handleLeido = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, mensajes_no_leidos: 0 } : t))
    // Actualizar el badge global del Header/Sidebar
    setNoLeidos(Math.max(0, noLeidos - 1))
  }

  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Group justify="space-between" mb="xl">
              <div>
                <Title order={3} mb="xs">Mis Consultas</Title>
                <Text c="dimmed" size="sm">
                  Consultas que no pudieron responderse con documentación oficial. Podés comunicarte con el administrador.
                </Text>
              </div>
              <ActionIcon variant="light" radius="md" onClick={cargar}><IconRefresh size={16} /></ActionIcon>
            </Group>

            <Paper withBorder radius="md" p="xl" pos="relative">
              <LoadingOverlay visible={cargando} />

              {!cargando && tickets.length === 0 && (
                <Stack align="center" py="xl">
                  <ThemeIcon size={48} variant="light" color="green" radius="xl">
                    <IconMessageCircle size={24} />
                  </ThemeIcon>
                  <Text c="dimmed" size="sm">No tenés consultas pendientes ✅</Text>
                </Stack>
              )}

              <Stack gap="sm">
                {tickets.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Paper withBorder radius="md" p="md"
                      bg={t.mensajes_no_leidos > 0 ? 'blue.0' : undefined}
                      style={{ borderColor: t.mensajes_no_leidos > 0 ? 'var(--mantine-color-blue-3)' : undefined }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <ThemeIcon size={36} radius="xl" variant="light" color={NIVEL_COLOR[t.nivel] ?? 'gray'}>
                            <IconAlertCircle size={18} />
                          </ThemeIcon>
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={600} lineClamp={2}>{t.pregunta}</Text>
                            <Group gap="xs" wrap="wrap">
                              <Badge size="xs" variant="light" color={NIVEL_COLOR[t.nivel] ?? 'gray'}>
                                {NIVEL_LABEL[t.nivel] ?? `Nivel ${t.nivel}`}
                              </Badge>
                              {t.mensajes_no_leidos > 0 && (
                                <Badge size="xs" color="blue" variant="filled">
                                  {t.mensajes_no_leidos} respuesta{t.mensajes_no_leidos > 1 ? 's' : ''} nueva{t.mensajes_no_leidos > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {t.estado === 'respondido' && t.mensajes_no_leidos === 0 && (
                                <Badge size="xs" color="green" variant="light">Respondido</Badge>
                              )}
                              <Text size="xs" c="dimmed">{formatFecha(t.creado_en)}</Text>
                            </Group>
                          </Stack>
                        </Group>
                        <ActionIcon
                          variant={abierto === t.id ? 'filled' : 'subtle'}
                          color="blue" size="sm"
                          onClick={() => setAbierto(abierto === t.id ? null : t.id)}
                        >
                          <IconMessageCircle size={14} />
                        </ActionIcon>
                      </Group>

                      {abierto === t.id && <HiloTicket ticket={t} onLeido={handleLeido} />}
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </Paper>
          </motion.div>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}
