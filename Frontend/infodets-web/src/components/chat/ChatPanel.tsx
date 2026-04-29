'use client'

import {
  Box, Stack, Text, Paper, Textarea, ActionIcon,
  Group, ThemeIcon, ScrollArea, Avatar, Loader,
  Badge, Anchor,
} from '@mantine/core'
import { IconSend, IconRobot, IconUser, IconExternalLink } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import type { FuenteDocumento } from '@/types/consulta.types'

interface Mensaje {
  id: string
  rol: 'usuario' | 'asistente'
  texto: string
  fuentes?: FuenteDocumento[]
  confianza?: number
  tipo_respuesta?: string
  cargando?: boolean
}

const SUGERENCIAS = [
  '¿Cuál es el proceso de licitación?',
  '¿Qué normativas aplican para permisos?',
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/v1'

export function ChatPanel() {
  const [pregunta, setPregunta] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { usuario, token } = useSessionStore()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [mensajes])

  const enviar = async (texto: string) => {
    if (!texto.trim() || enviando) return
    const preguntaTexto = texto.trim()
    setPregunta('')
    setEnviando(true)

    const msgUsuario: Mensaje = { id: Date.now().toString(), rol: 'usuario', texto: preguntaTexto }
    const msgAsistente: Mensaje = { id: (Date.now() + 1).toString(), rol: 'asistente', texto: '', cargando: true }

    setMensajes((prev) => [...prev, msgUsuario, msgAsistente])

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mensaje: preguntaTexto,
          usuario_id: usuario?.rdsId ?? usuario?.id ?? '',
        }),
      })

      if (!res.ok || !res.body) throw new Error(`Error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evento = JSON.parse(line.slice(6))
            if (evento.tipo === 'chunk') {
              setMensajes((prev) => prev.map((m) =>
                m.id === msgAsistente.id
                  ? { ...m, texto: m.texto + evento.texto, cargando: false }
                  : m
              ))
            } else if (evento.tipo === 'final') {
              setMensajes((prev) => prev.map((m) =>
                m.id === msgAsistente.id
                  ? { ...m, fuentes: evento.fuentes, confianza: evento.confianza, tipo_respuesta: evento.tipo_respuesta, cargando: false }
                  : m
              ))
            } else if (evento.tipo === 'error') {
              setMensajes((prev) => prev.map((m) =>
                m.id === msgAsistente.id
                  ? { ...m, texto: `❌ ${evento.mensaje}`, cargando: false }
                  : m
              ))
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMensajes((prev) => prev.map((m) =>
        m.id === msgAsistente.id
          ? { ...m, texto: '❌ Error al conectar con el servidor.', cargando: false }
          : m
      ))
    } finally {
      setEnviando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar(pregunta)
    }
  }

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Área de mensajes */}
      <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef}>
        <Box p={24}>
          {mensajes.length === 0 && (
            <Stack align="center" gap="md" mt={60}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                  <IconRobot size={28} />
                </ThemeIcon>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Stack align="center" gap={4}>
                  <Text fw={600} size="lg">¿En qué puedo ayudarte?</Text>
                  <Text c="dimmed" size="sm" ta="center" maw={400}>
                    Realiza una consulta en lenguaje natural sobre normativas, procedimientos o documentos institucionales.
                  </Text>
                </Stack>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ width: '100%', maxWidth: 500 }}>
                <Stack gap="xs">
                  {SUGERENCIAS.map((s, i) => (
                    <Paper key={i} p="sm" radius="md" withBorder style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => enviar(s)}>
                      <Text size="sm" c="dimmed">{s}</Text>
                    </Paper>
                  ))}
                </Stack>
              </motion.div>
            </Stack>
          )}

          <AnimatePresence>
            {mensajes.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 16 }}
              >
                <Group align="flex-start" gap="sm" justify={msg.rol === 'usuario' ? 'flex-end' : 'flex-start'}>
                  {msg.rol === 'asistente' && (
                    <Avatar size="sm" radius="xl" color="blue" variant="filled">
                      <IconRobot size={14} />
                    </Avatar>
                  )}

                  <Stack gap={6} style={{ maxWidth: '75%' }}>
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        backgroundColor: msg.rol === 'usuario'
                          ? 'var(--mantine-color-blue-6)'
                          : 'var(--mantine-color-gray-1)',
                        color: msg.rol === 'usuario' ? 'white' : 'inherit',
                      }}
                    >
                      {msg.cargando ? (
                        <Group gap="xs">
                          <Loader size="xs" color="gray" />
                          <Text size="sm" c="dimmed">Pensando...</Text>
                        </Group>
                      ) : (
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.texto}
                        </Text>
                      )}
                    </Paper>

                    {/* Fuentes y confianza */}
                    {msg.fuentes && msg.fuentes.length > 0 && (
                      <Stack gap={4}>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed" fw={600}>Fuentes:</Text>
                          {msg.confianza !== undefined && (
                            <Badge size="xs" variant="light" color={msg.confianza >= 0.7 ? 'green' : 'orange'}>
                              {Math.round(msg.confianza * 100)}% confianza
                            </Badge>
                          )}
                        </Group>
                        {msg.fuentes.map((f, i) => (
                          <Group key={i} gap={4}>
                            <IconExternalLink size={12} opacity={0.5} />
                            <Anchor
                              href={f.url ? (f.url.startsWith('http') ? f.url : `http://localhost:8000${f.url}`) : '#'}
                              target="_blank"
                              size="xs"
                              c="blue"
                            >
                              {f.nombre}{f.pagina ? ` (p. ${f.pagina})` : ''}
                            </Anchor>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Stack>

                  {msg.rol === 'usuario' && (
                    <Avatar size="sm" radius="xl" color="gray" variant="filled">
                      <IconUser size={14} />
                    </Avatar>
                  )}
                </Group>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </ScrollArea>

      {/* Input */}
      <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)', padding: 16, backgroundColor: 'var(--mantine-color-white)' }}>
        <Group align="flex-end" gap="xs">
          <Textarea
            placeholder="Escribe tu consulta aquí... (Enter para enviar)"
            value={pregunta}
            onChange={(e) => setPregunta(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={4}
            radius="md"
            style={{ flex: 1 }}
            disabled={enviando}
          />
          <ActionIcon
            size="lg"
            radius="md"
            variant="filled"
            color="blue"
            disabled={!pregunta.trim() || enviando}
            loading={enviando}
            onClick={() => enviar(pregunta)}
          >
            <IconSend size={16} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" mt={6} ta="center">
          Las respuestas se basan en documentos oficiales verificados. Enter para enviar, Shift+Enter para nueva línea.
        </Text>
      </Box>
    </Box>
  )
}
