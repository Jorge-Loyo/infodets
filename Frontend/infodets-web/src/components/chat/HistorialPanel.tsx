'use client'

import { Box, Stack, Text, Skeleton, Group, Tooltip, ActionIcon } from '@mantine/core'
import { IconMessageCircle, IconTrash, IconPlus, IconPin, IconPinFilled, IconSparkles } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '@/lib/axiosInstance'
import { notifications } from '@mantine/notifications'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'

interface MensajeItem {
  pregunta: string
  respuesta: string
  confianza: number
  creado_en: string
}

interface ConversacionItem {
  id: string
  titulo: string
  fijada: boolean
  creado_en: string
  mensajes: MensajeItem[]
}

const formatFecha = (iso: string) => {
  const diff = Date.now() - new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Ahora'
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return `${Math.floor(d / 7)}sem`
}

const MAX_NORMALES = 5
const MAX_FIJADAS = 5

function ConvCard({ conv, seleccionado, onSelect, onBorrar, onTogglePin }: {
  conv: ConversacionItem
  seleccionado: string | null
  onSelect: (c: ConversacionItem) => void
  onBorrar: (e: React.MouseEvent, id: string) => void
  onTogglePin: (e: React.MouseEvent, id: string, fijada: boolean) => void
}) {
  const isSelected = seleccionado === conv.id

  return (
    <Box
      onClick={() => onSelect(conv)}
      style={{ width: '100%', cursor: 'pointer' }}
    >
      <Box
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          backgroundColor: isSelected
            ? 'var(--mantine-color-blue-6)'
            : conv.fijada
            ? 'var(--mantine-color-green-0)'
            : 'var(--mantine-color-default-hover)',
          border: `1px solid ${
            isSelected
              ? 'var(--mantine-color-blue-5)'
              : conv.fijada
              ? 'var(--mantine-color-green-2)'
              : 'var(--mantine-color-default-border)'
          }`,
          transition: 'all 0.15s ease',
        }}
        className="conv-card"
      >
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text
            size="xs"
            fw={isSelected ? 600 : 400}
            lineClamp={1}
            style={{
              flex: 1,
              color: isSelected ? 'white' : 'var(--mantine-color-text)',
            }}
          >
            {conv.titulo}
          </Text>
          <Group gap={2} wrap="nowrap" style={{ opacity: 0, transition: 'opacity 0.15s' }} className="conv-actions">
            <Tooltip label={conv.fijada ? 'Desfijar' : 'Fijar'} withArrow>
              <ActionIcon
                size={16} variant="transparent"
                color={isSelected ? 'white' : conv.fijada ? 'green' : 'gray'}
                onClick={(e) => onTogglePin(e, conv.id, conv.fijada)}
              >
                {conv.fijada ? <IconPinFilled size={11} /> : <IconPin size={11} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Eliminar" withArrow>
              <ActionIcon
                size={16} variant="transparent"
                color={isSelected ? 'white' : 'red'}
                onClick={(e) => onBorrar(e, conv.id)}
              >
                <IconTrash size={11} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <Group gap={6} mt={2}>
          <Text
            size="xs"
            style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--mantine-color-dimmed)' }}
          >
            {formatFecha(conv.creado_en)}
          </Text>
          <Text
            size="xs"
            style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : 'var(--mantine-color-dimmed)' }}
          >
            · {conv.mensajes.length} msg
          </Text>
          {conv.fijada && !isSelected && (
            <IconPinFilled size={9} color="var(--mantine-color-green-5)" />
          )}
        </Group>
      </Box>
    </Box>
  )
}

export function HistorialPanel() {
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const { usuario } = useSessionStore()
  const { consultasCount, cargarConversacion } = useUiStore()

  const cargar = useCallback(() => {
    if (!usuario?.rdsId && !usuario?.id) { setCargando(false); return }
    axiosInstance.get<ConversacionItem[]>(`/chat/conversaciones/${usuario.rdsId ?? usuario.id}`)
      .then((res) => setConversaciones(res.data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [usuario?.rdsId, usuario?.id])

  useEffect(() => { cargar() }, [cargar, consultasCount])

  const handleSelect = (conv: ConversacionItem) => {
    setSeleccionado(conv.id)
    cargarConversacion({ conversacionId: conv.id, mensajes: conv.mensajes })
  }

  const handleBorrar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await axiosInstance.delete(`/chat/conversacion/${id}`)
      setConversaciones(prev => prev.filter(c => c.id !== id))
      if (seleccionado === id) setSeleccionado(null)
    } catch {}
  }

  const handleTogglePin = async (e: React.MouseEvent, id: string, fijada: boolean) => {
    e.stopPropagation()
    try {
      await axiosInstance.patch(`/chat/conversacion/${id}/fijar`, { fijada: !fijada })
      setConversaciones(prev =>
        prev.map(c => c.id === id ? { ...c, fijada: !fijada } : c)
          .sort((a, b) => (b.fijada ? 1 : 0) - (a.fijada ? 1 : 0))
      )
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 400) {
        notifications.show({ color: 'orange', message: 'Límite de 5 conversaciones fijadas alcanzado' })
      }
    }
  }

  const handleNueva = () => {
    setSeleccionado(null)
    cargarConversacion({ conversacionId: '', mensajes: [] })
  }

  const fijadas = conversaciones.filter(c => c.fijada)
  const normales = conversaciones.filter(c => !c.fijada)

  return (
    <Box style={{
      width: 240, flexShrink: 0,
      borderLeft: '1px solid var(--mantine-color-default-border)',
      backgroundColor: 'var(--mantine-color-body)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <Box style={{ padding: '14px 12px 8px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="space-between" align="center">
          <Group gap={6}>
            <IconMessageCircle size={14} opacity={0.4} />
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              Conversaciones
            </Text>
          </Group>
          <Tooltip label="Nueva conversación" withArrow>
            <ActionIcon
              size="sm" variant="subtle" color="blue" radius="md"
              onClick={handleNueva}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Contadores */}
        <Group gap={8} mt={6}>
          {fijadas.length > 0 && (
            <Group gap={3}>
              <IconPinFilled size={10} color="var(--mantine-color-green-5)" />
              <Text size="xs" c="dimmed">{fijadas.length}/{MAX_FIJADAS}</Text>
            </Group>
          )}
          <Group gap={3}>
            <IconMessageCircle size={10} opacity={0.4} />
            <Text size="xs" c={normales.length >= MAX_NORMALES ? 'red' : 'dimmed'}>
              {normales.length}/{MAX_NORMALES}
            </Text>
          </Group>
        </Group>
      </Box>

      {/* Lista */}
      <Box style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        <Stack gap={2}>
          {cargando && [1, 2, 3].map((i) => (
            <Skeleton key={i} height={48} radius="md" opacity={i === 3 ? 0.3 : 0.6} />
          ))}

          {!cargando && conversaciones.length === 0 && (
            <Stack align="center" gap={6} py="xl">
              <IconSparkles size={20} opacity={0.3} />
              <Text size="xs" c="dimmed" ta="center">Sin conversaciones aún</Text>
            </Stack>
          )}

          {/* Fijadas */}
          <AnimatePresence>
            {fijadas.length > 0 && (
              <>
                <Text size="xs" c="dimmed" fw={600} px={4} py={4} style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
                  📌 Fijadas
                </Text>
                {fijadas.map((conv, i) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                    <ConvCard conv={conv} seleccionado={seleccionado} onSelect={handleSelect} onBorrar={handleBorrar} onTogglePin={handleTogglePin} />
                  </motion.div>
                ))}
                {fijadas.length > 0 && (
                  <Box style={{ height: 1, background: 'var(--mantine-color-default-border)', margin: '6px 4px' }} />
                )}
              </>
            )}
          </AnimatePresence>

          {/* Recientes */}
          <AnimatePresence>
            {normales.length > 0 && (
              <>
                {fijadas.length > 0 && (
                  <Text size="xs" c="dimmed" fw={600} px={4} py={4} style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
                    Recientes
                  </Text>
                )}
                {normales.map((conv, i) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                    <ConvCard conv={conv} seleccionado={seleccionado} onSelect={handleSelect} onBorrar={handleBorrar} onTogglePin={handleTogglePin} />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </Stack>
      </Box>

      <style>{`
        .conv-card:hover { background: var(--mantine-color-blue-1) !important; border-color: var(--mantine-color-blue-3) !important; }
        .conv-card:hover .conv-actions { opacity: 1 !important; }
      `}</style>
    </Box>
  )
}
