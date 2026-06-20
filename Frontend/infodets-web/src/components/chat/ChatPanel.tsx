'use client'

import {
  Box, Stack, Text, Paper, Textarea, ActionIcon,
  Group, ThemeIcon, ScrollArea, Avatar, Loader,
  Badge, Anchor, Tooltip,
} from '@mantine/core'
import { IconSend, IconRobot, IconUser, IconExternalLink, IconThumbUp, IconThumbDown } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'
import type { FuenteDocumento } from '@/types/consulta.types'

interface Mensaje {
  id: string
  rol: 'usuario' | 'asistente'
  texto: string
  fuentes?: FuenteDocumento[]
  confianza?: number
  tipo_respuesta?: string
  nivel?: number
  cargando?: boolean
  consulta_id?: string
  feedback?: 'correcto' | 'incorrecto' | null
}



function BotWelcome({ nombre, imagen_url }: { nombre: string; imagen_url: string }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      {imagen_url ? (
        <Avatar src={imagen_url} size={100} radius="xl" style={{ boxShadow: '0 12px 40px rgba(34,139,230,0.25)' }} />
      ) : (
        <ThemeIcon size={100} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} style={{ boxShadow: '0 12px 40px rgba(34,139,230,0.25)' }}>
          <IconRobot size={50} />
        </ThemeIcon>
      )}
    </motion.div>
  )
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/v1'

interface BotConfig { nombre: string, imagen_url: string }

export function ChatPanel() {
  const [pregunta, setPregunta] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [enviando, setEnviando] = useState(false)
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [botConfig, setBotConfig] = useState<BotConfig>({ nombre: 'Infobot', imagen_url: '' })
  const [feedbackEnviando, setFeedbackEnviando] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { usuario, token } = useSessionStore()
  const { incrementarConsultas, conversacionCargada, limpiarConversacion } = useUiStore()

  useEffect(() => {
    fetch(`${API_URL}/bot`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setBotConfig({ nombre: d.nombre || 'Infobot', imagen_url: d.imagen_url || '' }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [mensajes])

  // Cargar conversación desde historial
  useEffect(() => {
    if (conversacionCargada) {
      setConversacionId(conversacionCargada.conversacionId)
      setMensajes(conversacionCargada.mensajes.flatMap((m, i) => [
        { id: `h-u-${i}`, rol: 'usuario' as const, texto: m.pregunta },
        { id: `h-a-${i}`, rol: 'asistente' as const, texto: m.respuesta, confianza: m.confianza },
      ]))
      limpiarConversacion()
    }
  }, [conversacionCargada])

  const enviar = async (texto: string) => {
    if (!texto.trim() || enviando) return
    const preguntaTexto = texto.trim()
    setPregunta('')
    setEnviando(true)

    // Si no hay conversación activa, crear una nueva
    let convId = conversacionId
    if (!convId) {
      try {
        const res = await fetch(`${API_URL}/chat/conversacion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ pregunta: preguntaTexto }),
        })
        if (res.ok) {
          const data = await res.json()
          convId = data.conversacion_id
          setConversacionId(convId)
        }
      } catch {}
    }

    const msgUsuario: Mensaje = { id: Date.now().toString(), rol: 'usuario', texto: preguntaTexto }
    const msgAsistente: Mensaje = { id: (Date.now() + 1).toString(), rol: 'asistente', texto: '', cargando: true }
    setMensajes((prev) => [...prev, msgUsuario, msgAsistente])

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          mensaje: preguntaTexto,
          usuario_id: usuario?.rdsId ?? usuario?.id ?? '',
          conversacion_id: convId,
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
                m.id === msgAsistente.id ? { ...m, texto: m.texto + evento.texto, cargando: false } : m
              ))
            } else if (evento.tipo === 'final') {
              setMensajes((prev) => prev.map((m) =>
                m.id === msgAsistente.id
                  ? { ...m, fuentes: evento.fuentes, confianza: evento.confianza, tipo_respuesta: evento.tipo_respuesta, nivel: evento.nivel, consulta_id: evento.consulta_id, cargando: false }
                  : m
              ))
            } else if (evento.tipo === 'error') {
              setMensajes((prev) => prev.map((m) =>
                m.id === msgAsistente.id ? { ...m, texto: `❌ ${evento.mensaje}`, cargando: false } : m
              ))
            }
          } catch {}
        }
      }
    } catch {
      setMensajes((prev) => prev.map((m) =>
        m.id === msgAsistente.id ? { ...m, texto: '❌ Error al conectar con el servidor.', cargando: false } : m
      ))
    } finally {
      setEnviando(false)
      incrementarConsultas()
    }
  }

  const enviarFeedback = async (msg: Mensaje, tipo: 'correcto' | 'incorrecto') => {
    if (!msg.consulta_id) return
    setFeedbackEnviando(msg.id)
    try {
      await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          consulta_id: msg.consulta_id,
          usuario_id: usuario?.rdsId ?? usuario?.id ?? '',
          tipo,
        }),
      })
      setMensajes((prev) => prev.map((m) =>
        m.id === msg.id ? { ...m, feedback: tipo } : m
      ))
    } catch {}
    setFeedbackEnviando(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(pregunta) }
  }

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef}>
        <Box p={24}>
          {mensajes.length === 0 && (
            <Stack align="center" gap="xl" mt={60}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                <BotWelcome nombre={botConfig.nombre} imagen_url={botConfig.imagen_url} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Stack align="center" gap={8}>
                  <Text fw={700} size="xl" ta="center" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    ¡Hola! Soy {botConfig.nombre}
                  </Text>
                  <Text c="dimmed" size="md" ta="center" maw={400} lh={1.6}>
                    Tu asistente virtual. Escribí tu pregunta abajo y te ayudo al instante 💬
                  </Text>
                </Stack>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Text size="xs" c="dimmed" ta="center">
                  ⬇️ Escribí lo que necesitás saber
                </Text>
              </motion.div>
            </Stack>
          )}

          <AnimatePresence>
            {mensajes.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ marginBottom: 16 }}>
                <Group align="flex-start" gap="sm" justify={msg.rol === 'usuario' ? 'flex-end' : 'flex-start'}>
                  {msg.rol === 'asistente' && (
                    <Avatar size="sm" radius="xl" color="blue" variant="filled" src={botConfig.imagen_url || undefined}>
                      {!botConfig.imagen_url && <IconRobot size={14} />}
                    </Avatar>
                  )}
                  <Stack gap={6} style={{ maxWidth: '75%' }}>
                    <Paper p="sm" radius="md" style={{
                      backgroundColor: msg.rol === 'usuario' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-default-hover)',
                      color: msg.rol === 'usuario' ? 'white' : 'inherit',
                    }}>
                      {msg.cargando ? (
                        <Group gap="xs"><Loader size="xs" color="gray" /><Text size="sm" c="dimmed">Pensando...</Text></Group>
                      ) : (
                        <>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.texto}</Text>
                          {msg.tipo_respuesta === 'externo' && msg.nivel === 2 && (
                            <Text size="xs" c="dimmed" mt={8} style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 6, lineHeight: 1.4 }}>
                              ⚠️ Esta información proviene de una búsqueda web y no representa documentación oficial verificada de la entidad.
                            </Text>
                          )}
                          {msg.tipo_respuesta === 'externo' && msg.nivel === 1 && (
                            <Text size="xs" c="dimmed" mt={8} style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 6, lineHeight: 1.4 }}>
                              ℹ️ Esta información proviene de una fuente oficial externa. Considerá agregar documentación interna sobre este tema.
                            </Text>
                          )}
                        </>
                      )}
                    </Paper>
                    {!msg.cargando && msg.rol === 'asistente' && msg.texto && !msg.texto.startsWith('❌') && (
                      <Stack gap={4}>
                        <Group gap="xs">
                          {msg.confianza !== undefined && (
                            <Badge size="xs" variant="light"
                              color={msg.confianza >= 0.75 ? 'green' : msg.confianza >= 0.4 ? 'orange' : 'red'}>
                              {Math.round(msg.confianza * 100)}% confianza
                            </Badge>
                          )}
                          {msg.tipo_respuesta === 'local' && <Badge size="xs" variant="dot" color="green">Documentación oficial</Badge>}
                          {msg.tipo_respuesta === 'externo' && <Badge size="xs" variant="dot" color="orange">Fuente externa</Badge>}
                          {msg.tipo_respuesta === 'escalamiento' && <Badge size="xs" variant="dot" color="red">Escalado</Badge>}
                        </Group>
                        {msg.fuentes && msg.fuentes.length > 0 && (
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={600}>Fuentes:</Text>
                            {msg.fuentes.map((f, i) => (
                              <Group key={i} gap={4}>
                                <IconExternalLink size={12} opacity={0.5} />
                                {f.url?.startsWith('/v1/') ? (
                                  <Anchor
                                    href={`${process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:8000'}${f.url}`}
                                    target="_blank" size="xs" c="blue"
                                  >
                                    {f.nombre}{f.pagina ? ` (p. ${f.pagina})` : ''} — Ver documento 📄
                                  </Anchor>
                                ) : (
                                  <Anchor href={f.url ?? '#'} target="_blank" size="xs" c="blue">
                                    {f.url}
                                  </Anchor>
                                )}
                              </Group>
                            ))}
                          </Stack>
                        )}
                        {/* Feedback 👍/👎 */}
                        <Group gap={4} mt={4}>
                          {msg.feedback ? (
                            <Badge size="xs" variant="light" color={msg.feedback === 'correcto' ? 'green' : 'red'}>
                              {msg.feedback === 'correcto' ? '👍 Útil' : '👎 Reportada'}
                            </Badge>
                          ) : (
                            <>
                              <Tooltip label="Respuesta útil">
                                <ActionIcon
                                  size="xs" variant="subtle" color="green"
                                  loading={feedbackEnviando === msg.id}
                                  onClick={() => enviarFeedback(msg, 'correcto')}
                                >
                                  <IconThumbUp size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Respuesta incorrecta">
                                <ActionIcon
                                  size="xs" variant="subtle" color="red"
                                  loading={feedbackEnviando === msg.id}
                                  onClick={() => enviarFeedback(msg, 'incorrecto')}
                                >
                                  <IconThumbDown size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                  {msg.rol === 'usuario' && (
                    <Avatar size="sm" radius="xl" color="gray" variant="filled"><IconUser size={14} /></Avatar>
                  )}
                </Group>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </ScrollArea>

      <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', padding: 16, backgroundColor: 'var(--mantine-color-body)' }}>
        <Group align="flex-end" gap="xs">
          <Textarea
            placeholder="Escribe tu consulta aquí... (Enter para enviar)"
            value={pregunta}
            onChange={(e) => setPregunta(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize minRows={1} maxRows={4}
            radius="md" style={{ flex: 1 }}
            disabled={enviando}
          />
          <ActionIcon size="lg" radius="md" variant="filled" color="blue"
            disabled={!pregunta.trim() || enviando} loading={enviando}
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
