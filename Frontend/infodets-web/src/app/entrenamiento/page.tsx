'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, Group, Button,
  ThemeIcon, Divider, Progress, Tabs,
  FileInput, TextInput, Select, Textarea,
} from '@mantine/core'
import {
  IconBrain, IconUpload, IconFileTypePdf, IconFolderOpen, IconSparkles,
  IconChartBar, IconMessageQuestion, IconShieldCheck,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { PageLoader } from '@/components/layout/PageLoader'
import { ingestaService } from '@/services/api/ingestaService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import axiosInstance from '@/lib/axiosInstance'

interface Stats {
  total_consultas: number
  total_documentos: number
  consultas_sin_respuesta: number
}

export default function EntrenamientoPage() {
  const { checking } = useRequireAuth({ adminOnly: true })

  // ── Ingesta ──
  const [archivo, setArchivo] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [dependencia, setDependencia] = useState('')
  const [anio, setAnio] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const opcionesCategorias = useTablaOpciones('categorias')
  const opcionesDependencias = useTablaOpciones('dependencias')

  // ── Stats ──
  const [stats, setStats] = useState<Stats | null>(null)

  // ── Entrenamiento manual ──
  const [preguntaManual, setPreguntaManual] = useState('')
  const [respuestaManual, setRespuestaManual] = useState('')
  const [indexando, setIndexando] = useState(false)

  const cargarStats = async () => {
    try {
      const res = await axiosInstance.get<Stats>('/admin/dashboard')
      setStats(res.data)
    } catch { }
  }

  useEffect(() => { cargarStats() }, [])

  const handleSubir = async () => {
    if (!archivo || !titulo.trim() || !categoria) {
      notifications.show({ color: 'orange', message: 'Completa título, categoría y selecciona un PDF' })
      return
    }
    setSubiendo(true); setProgreso(20)
    try {
      setProgreso(50)
      const resultado = await ingestaService.cargar(archivo, {
        titulo: titulo.trim(), categoria, dependencia,
        anio: anio ? parseInt(anio) : undefined,
        tipo: 'entrenamiento',
      })
      setProgreso(100)
      notifications.show({ color: 'green', title: '✅ Documento indexado', message: `"${resultado.titulo}" — ${resultado.vector_id}` })
      setArchivo(null); setTitulo(''); setCategoria(''); setDependencia(''); setAnio(''); setProgreso(0)
      cargarStats()
    } catch (e: unknown) {
      notifications.show({ color: 'red', message: (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al procesar' })
      setProgreso(0)
    } finally { setSubiendo(false) }
  }

  const indexarManual = async () => {
    if (!preguntaManual.trim() || !respuestaManual.trim()) {
      notifications.show({ color: 'orange', message: 'Completá la pregunta y la respuesta' })
      return
    }
    setIndexando(true)
    try {
      await axiosInstance.post('/validaciones/manual', {
        pregunta: preguntaManual.trim(),
        respuesta: respuestaManual.trim(),
      })
      notifications.show({ color: 'green', message: 'Par pregunta-respuesta indexado en la IA ✅' })
      setPreguntaManual(''); setRespuestaManual('')
    } catch {
      notifications.show({ color: 'orange', message: 'Función disponible próximamente' })
    } finally { setIndexando(false) }
  }

  if (checking) return <PageLoader />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-default-hover)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            <Group mb="xs" gap="sm">
              <ThemeIcon size={40} radius="md" variant="light" color="violet">
                <IconBrain size={22} />
              </ThemeIcon>
              <div>
                <Title order={3}>Entrenamiento de la IA</Title>
                <Text c="dimmed" size="sm">Gestioná el conocimiento del asistente virtual.</Text>
              </div>
            </Group>

            <Divider mb="xl" />

            {/* Stats */}
            {stats && (
              <Grid mb="xl">
                {[
                  { label: 'Consultas totales',          value: stats.total_consultas,          color: 'blue',   icon: IconMessageQuestion },
                  { label: 'Documentos indexados',       value: stats.total_documentos,         color: 'green',  icon: IconFileTypePdf },
                  { label: 'Sin respuesta documentada',  value: stats.consultas_sin_respuesta,  color: 'orange', icon: IconChartBar },
                ].map((s, i) => (
                  <Grid.Col key={i} span={{ base: 6, sm: 4 }}>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group gap="sm">
                          <ThemeIcon size={36} radius="md" variant="light" color={s.color}>
                            <s.icon size={18} />
                          </ThemeIcon>
                          <div>
                            <Text size="xl" fw={700}>{s.value}</Text>
                            <Text size="xs" c="dimmed">{s.label}</Text>
                          </div>
                        </Group>
                      </Paper>
                    </motion.div>
                  </Grid.Col>
                ))}
              </Grid>
            )}

            <Tabs defaultValue="documentos">
              <Tabs.List mb="xl">
                <Tabs.Tab value="documentos" leftSection={<IconUpload size={14} />}>
                  Subir documento
                </Tabs.Tab>
                <Tabs.Tab value="manual" leftSection={<IconSparkles size={14} />}>
                  Entrenamiento manual
                </Tabs.Tab>
              </Tabs.List>

              {/* ── TAB DOCUMENTOS ── */}
              <Tabs.Panel value="documentos">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper withBorder radius="md" p="xl">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon variant="light" color="blue" radius="md"><IconBrain size={16} /></ThemeIcon>
                          <Text fw={600} size="sm">Indexar documento PDF en la IA</Text>
                        </Group>
                        <Divider />
                        <FileInput label="Archivo PDF" placeholder="Selecciona un PDF" accept=".pdf" leftSection={<IconFolderOpen size={16} />} value={archivo} onChange={setArchivo} radius="md" clearable />
                        {archivo && (
                          <Paper withBorder p="sm" radius="md" bg="blue.0">
                            <Group gap="sm">
                              <ThemeIcon variant="light" color="red" radius="md" size="lg"><IconFileTypePdf size={16} /></ThemeIcon>
                              <Stack gap={0} style={{ flex: 1 }}>
                                <Text size="sm" fw={500} lineClamp={1}>{archivo.name}</Text>
                                <Text size="xs" c="dimmed">{(archivo.size / 1024 / 1024).toFixed(2)} MB</Text>
                              </Stack>
                            </Group>
                          </Paper>
                        )}
                        <Divider label="Metadatos" labelPosition="left" />
                        <TextInput label="Título *" placeholder="Ej: Resolución 001-2024" value={titulo} onChange={e => setTitulo(e.target.value)} radius="md" required />
                        <Select label="Categoría *" placeholder="Selecciona" data={opcionesCategorias} value={categoria} onChange={v => setCategoria(v ?? '')} radius="md" required />
                        <Select label="Dependencia" placeholder="Selecciona" data={opcionesDependencias} value={dependencia} onChange={v => setDependencia(v ?? '')} radius="md" clearable />
                        <TextInput label="Año" placeholder="Ej: 2024" value={anio} onChange={e => setAnio(e.target.value)} radius="md" maxLength={4} />
                        {subiendo && progreso > 0 && (
                          <Stack gap={4}>
                            <Text size="xs" c="dimmed">Procesando e indexando en Qdrant...</Text>
                            <Progress value={progreso} animated radius="md" color="violet" />
                          </Stack>
                        )}
                        <Button leftSection={<IconUpload size={16} />} radius="md" fullWidth color="violet" loading={subiendo} disabled={!archivo || !titulo.trim() || !categoria} onClick={handleSubir}>
                          Indexar en la IA
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder radius="md" p="xl" h="100%">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon variant="light" color="violet" radius="md"><IconBrain size={16} /></ThemeIcon>
                          <Text fw={600} size="sm">¿Cómo funciona el entrenamiento?</Text>
                        </Group>
                        <Divider />
                        {[
                          { paso: '1', titulo: 'Subís el PDF', desc: 'El sistema extrae el texto completo del documento.' },
                          { paso: '2', titulo: 'Fragmentación', desc: 'El texto se divide en chunks de 1000 caracteres con overlap de 200.' },
                          { paso: '3', titulo: 'Embeddings', desc: 'Cada chunk se convierte en un vector de 3072 dimensiones con Gemini.' },
                          { paso: '4', titulo: 'Indexado en Qdrant', desc: 'Los vectores se almacenan en la base de datos vectorial.' },
                          { paso: '5', titulo: 'Disponible', desc: 'La IA puede responder consultas basadas en ese documento.' },
                        ].map((s, i) => (
                          <Group key={i} gap="sm" align="flex-start">
                            <ThemeIcon size={28} radius="xl" variant="filled" color="violet" style={{ flexShrink: 0 }}>
                              <Text size="xs" fw={700}>{s.paso}</Text>
                            </ThemeIcon>
                            <div>
                              <Text size="sm" fw={600}>{s.titulo}</Text>
                              <Text size="xs" c="dimmed">{s.desc}</Text>
                            </div>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              {/* ── TAB MANUAL ── */}
              <Tabs.Panel value="manual">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder radius="md" p="xl">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon variant="light" color="teal" radius="md"><IconSparkles size={16} /></ThemeIcon>
                          <div>
                            <Text fw={600} size="sm">Entrenamiento manual</Text>
                            <Text size="xs" c="dimmed">Agregá un par pregunta-respuesta directamente a la base de conocimiento.</Text>
                          </div>
                        </Group>
                        <Divider />
                        <Textarea label="Pregunta" placeholder="¿Cuál es el proceso para solicitar un permiso de construcción?" value={preguntaManual} onChange={e => setPreguntaManual(e.target.value)} radius="md" autosize minRows={2} maxRows={4} />
                        <Textarea label="Respuesta oficial" placeholder="Para solicitar un permiso de construcción debe presentar..." value={respuestaManual} onChange={e => setRespuestaManual(e.target.value)} radius="md" autosize minRows={4} maxRows={8} />
                        <Button leftSection={<IconBrain size={16} />} radius="md" fullWidth color="teal" loading={indexando} disabled={!preguntaManual.trim() || !respuestaManual.trim()} onClick={indexarManual}>
                          Indexar en la IA
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder radius="md" p="xl" h="100%">
                      <Stack gap="md">
                        <Group gap="xs">
                          <ThemeIcon variant="light" color="orange" radius="md"><IconSparkles size={16} /></ThemeIcon>
                          <Text fw={600} size="sm">¿Cuándo usar el entrenamiento manual?</Text>
                        </Group>
                        <Divider />
                        {[
                          { titulo: 'Preguntas frecuentes', desc: 'Cuando sabés que una pregunta se repite y querés una respuesta precisa.' },
                          { titulo: 'Información no documentada', desc: 'Cuando la información existe pero no está en ningún PDF.' },
                          { titulo: 'Correcciones', desc: 'Para corregir respuestas incorrectas que la IA está dando.' },
                          { titulo: 'Información urgente', desc: 'Cuando necesitás que la IA responda algo de inmediato sin subir un documento.' },
                        ].map((s, i) => (
                          <Group key={i} gap="sm" align="flex-start">
                            <ThemeIcon size={8} radius="xl" variant="filled" color="orange" mt={6} style={{ flexShrink: 0 }} />
                            <div>
                              <Text size="sm" fw={600}>{s.titulo}</Text>
                              <Text size="xs" c="dimmed">{s.desc}</Text>
                            </div>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Tabs>

          </motion.div>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}
