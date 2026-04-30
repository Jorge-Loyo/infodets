'use client'

import { Box, Stack, Text, Paper, Skeleton, Group, Badge, Tooltip, ActionIcon, Button, Divider } from '@mantine/core'
import { IconMessageCircle, IconClock, IconTrash, IconPlus, IconPin, IconPinFilled } from '@tabler/icons-react'
import { motion } from 'framer-motion'
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
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Ahora'
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
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
  return (
    <Paper
      p="sm" radius="md" withBorder
      onClick={() => onSelect(conv)}
      style={{
        cursor: 'pointer',
        backgroundColor: seleccionado === conv.id
          ? 'var(--mantine-color-blue-0)'
          : conv.fijada ? 'var(--mantine-color-green-0)' : undefined,
        borderColor: seleccionado === conv.id
          ? 'var(--mantine-color-blue-3)'
          : conv.fijada ? 'var(--mantine-color-green-3)' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap={4}>
        <Text size="xs" fw={600} lineClamp={1} style={{ flex: 1 }}>{conv.titulo}</Text>
        <Group gap={2} wrap="nowrap">
          <Tooltip label={conv.fijada ? 'Desfijar' : 'Fijar'} withArrow>
            <ActionIcon size="xs" variant="subtle" color={conv.fijada ? 'green' : 'gray'}
              onClick={(e) => onTogglePin(e, conv.id, conv.fijada)}>
              {conv.fijada ? <IconPinFilled size={11} /> : <IconPin size={11} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar" withArrow>
            <ActionIcon size="xs" variant="subtle" color="red"
              onClick={(e) => onBorrar(e, conv.id)}>
              <IconTrash size={11} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <Group justify="space-between" mt={4} gap={4}>
        <Group gap={4}>
          <IconClock size={10} opacity={0.4} />
          <Text size="xs" c="dimmed">{formatFecha(conv.creado_en)}</Text>
        </Group>
        <Text size="xs" c="dimmed">{conv.mensajes.length} msg</Text>
      </Group>
    </Paper>
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
    } catch (err: any) {
      if (err?.response?.status === 400) {
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
      width: 260, flexShrink: 0,
      borderLeft: '1px solid var(--mantine-color-gray-2)',
      backgroundColor: 'var(--mantine-color-gray-0)',
      height: '100%', overflowY: 'auto', padding: 16,
    }}>
      <Group justify="space-between" mb="xs">
        <Group gap={6}>
          <IconMessageCircle size={14} opacity={0.5} />
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Conversaciones</Text>
        </Group>
        <Group gap={4}>
          {fijadas.length > 0 && (
            <Badge size="xs" variant="light" color="green">{fijadas.length}/{MAX_FIJADAS} 📌</Badge>
          )}
          <Badge size="xs" variant="light" color={normales.length >= MAX_NORMALES ? 'red' : 'blue'}>
            {normales.length}/{MAX_NORMALES}
          </Badge>
        </Group>
      </Group>

      <Button size="xs" variant="light" radius="md" fullWidth leftSection={<IconPlus size={12} />} mb="sm" onClick={handleNueva}>
        Nueva conversación
      </Button>

      <Divider mb="sm" />

      <Stack gap="xs">
        {cargando && [1, 2, 3].map((i) => (
          <Skeleton key={i} height={62} radius="md" opacity={i === 3 ? 0.4 : 0.7} />
        ))}

        {!cargando && conversaciones.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" mt="md">Sin conversaciones aún</Text>
        )}

        {/* Fijadas */}
        {fijadas.length > 0 && (
          <>
            <Group gap={4} mb={2}>
              <IconPinFilled size={11} color="var(--mantine-color-green-6)" />
              <Text size="xs" c="dimmed" fw={600}>Fijadas</Text>
            </Group>
            {fijadas.map((conv, i) => (
              <motion.div key={conv.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ConvCard conv={conv} seleccionado={seleccionado} onSelect={handleSelect} onBorrar={handleBorrar} onTogglePin={handleTogglePin} />
              </motion.div>
            ))}
            {normales.length > 0 && <Divider my={4} />}
          </>
        )}

        {/* Recientes */}
        {normales.length > 0 && (
          <>
            {fijadas.length > 0 && (
              <Group gap={4} mb={2}>
                <IconMessageCircle size={11} opacity={0.5} />
                <Text size="xs" c="dimmed" fw={600}>Recientes</Text>
              </Group>
            )}
            {normales.map((conv, i) => (
              <motion.div key={conv.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ConvCard conv={conv} seleccionado={seleccionado} onSelect={handleSelect} onBorrar={handleBorrar} onTogglePin={handleTogglePin} />
              </motion.div>
            ))}
          </>
        )}
      </Stack>
    </Box>
  )
}
