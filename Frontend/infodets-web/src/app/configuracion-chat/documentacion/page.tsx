'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Select, Button, Badge, FileInput,
  Table, ActionIcon, ThemeIcon, Divider, LoadingOverlay,
  Progress, Tabs, Switch, Tooltip,
} from '@mantine/core'
import {
  IconUpload, IconFileTypePdf, IconTrash,
  IconSearch, IconFolderOpen, IconRefresh, IconBrain,
  IconLink, IconPlus, IconWorld,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { ingestaService } from '@/services/api/ingestaService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import axiosInstance from '@/lib/axiosInstance'
import type { DocumentoListItem } from '@/types/ingesta.types'

const ESTADO_COLOR: Record<string, string> = {
  procesado: 'green',
  pendiente: 'yellow',
  error: 'red',
}

interface UrlOficial {
  id: string
  url: string
  descripcion?: string
  activa: boolean
  creado_en: string
}

export default function DocumentacionPage() {
  const [tab, setTab] = useState('documentos')

  // ── Documentos ──
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [dependencia, setDependencia] = useState('')
  const [anio, setAnio] = useState('')
  const opcionesCategorias = useTablaOpciones('categorias')
  const opcionesDependencias = useTablaOpciones('dependencias')

  // ── URLs ──
  const [urls, setUrls] = useState<UrlOficial[]>([])
  const [cargandoUrls, setCargandoUrls] = useState(false)
  const [nuevaUrl, setNuevaUrl] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [agregandoUrl, setAgregandoUrl] = useState(false)

  const cargarDocumentos = async () => {
    setCargando(true)
    try {
      setDocumentos(await ingestaService.listar())
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar documentos' })
    } finally {
      setCargando(false)
    }
  }

  const cargarUrls = async () => {
    setCargandoUrls(true)
    try {
      const res = await axiosInstance.get<UrlOficial[]>('/urls')
      setUrls(res.data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar URLs' })
    } finally {
      setCargandoUrls(false)
    }
  }

  useEffect(() => { cargarDocumentos() }, [])
  useEffect(() => { if (tab === 'urls') cargarUrls() }, [tab])

  const eliminarDocumento = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}" de Qdrant y RDS?`)) return
    try {
      await axiosInstance.delete(`/admin/ingesta/${id}`)
      setDocumentos(prev => prev.filter(d => d.id !== id))
      notifications.show({ color: 'green', message: 'Documento eliminado de la IA' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar documento' })
    }
  }

  const filtrados = documentos.filter(d =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const limpiarFormulario = () => {
    setArchivo(null); setTitulo(''); setCategoria(''); setDependencia(''); setAnio(''); setProgreso(0)
  }

  const handleSubir = async () => {
    if (!archivo || !titulo.trim() || !categoria) {
      notifications.show({ color: 'orange', message: 'Completa título, categoría y selecciona un PDF' })
      return
    }
    setSubiendo(true); setProgreso(10)
    try {
      setProgreso(30)
      const resultado = await ingestaService.cargar(archivo, { titulo: titulo.trim(), categoria, dependencia, anio: anio ? parseInt(anio) : undefined })
      setProgreso(100)
      notifications.show({ color: 'green', title: '✅ Documento procesado', message: `"${resultado.titulo}" — ${resultado.vector_id}` })
      limpiarFormulario()
      cargarDocumentos()
    } catch (e: unknown) {
      notifications.show({ color: 'red', title: 'Error al procesar', message: (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'No se pudo procesar el documento' })
      setProgreso(0)
    } finally {
      setSubiendo(false)
    }
  }

  const agregarUrl = async () => {
    if (!nuevaUrl.trim().startsWith('http')) {
      notifications.show({ color: 'orange', message: 'Ingresá una URL válida (debe comenzar con http)' })
      return
    }
    setAgregandoUrl(true)
    try {
      const res = await axiosInstance.post<UrlOficial>('/urls', { url: nuevaUrl.trim(), descripcion: nuevaDesc.trim() || null })
      setUrls(prev => [res.data, ...prev])
      setNuevaUrl(''); setNuevaDesc('')
      notifications.show({ color: 'green', message: 'URL agregada correctamente' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al agregar URL (puede que ya exista)' })
    } finally {
      setAgregandoUrl(false)
    }
  }

  const toggleUrl = async (id: string, activa: boolean) => {
    try {
      const res = await axiosInstance.put<UrlOficial>(`/urls/${id}`, { activa })
      setUrls(prev => prev.map(u => u.id === id ? res.data : u))
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar URL' })
    }
  }

  const eliminarUrl = async (id: string) => {
    try {
      await axiosInstance.delete(`/urls/${id}`)
      setUrls(prev => prev.filter(u => u.id !== id))
      notifications.show({ color: 'green', message: 'URL eliminada' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar URL' })
    }
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Documentación</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Gestioná los documentos PDF y las URLs oficiales que usa la IA para responder consultas.
        </Text>

        <Tabs value={tab} onChange={v => setTab(v ?? 'documentos')} mb="xl">
          <Tabs.List>
            <Tabs.Tab value="documentos" leftSection={<IconFileTypePdf size={14} />}>Documentos PDF</Tabs.Tab>
            <Tabs.Tab value="urls" leftSection={<IconWorld size={14} />}>
              URLs Oficiales
              {urls.filter(u => u.activa).length > 0 && <Badge size="xs" color="blue" ml={4}>{urls.filter(u => u.activa).length}</Badge>}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* ── TAB DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper withBorder radius="md" p="xl">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md"><IconBrain size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Cargar documento para entrenar IA</Text>
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
                  <TextInput label="Título del documento *" placeholder="Ej: Resolución 001-2024" value={titulo} onChange={e => setTitulo(e.target.value)} radius="md" required />
                  <Select label="Categoría *" placeholder="Selecciona una categoría" data={opcionesCategorias} value={categoria} onChange={v => setCategoria(v ?? '')} radius="md" required />
                  <Select label="Dependencia" placeholder="Selecciona la dependencia" data={opcionesDependencias} value={dependencia} onChange={v => setDependencia(v ?? '')} radius="md" clearable />
                  <TextInput label="Año" placeholder="Ej: 2024" value={anio} onChange={e => setAnio(e.target.value)} radius="md" maxLength={4} />
                  {subiendo && progreso > 0 && (
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">Procesando documento...</Text>
                      <Progress value={progreso} animated radius="md" />
                    </Stack>
                  )}
                  <Button leftSection={<IconUpload size={16} />} radius="md" fullWidth loading={subiendo} disabled={!archivo || !titulo.trim() || !categoria} onClick={handleSubir}>
                    Procesar e indexar en IA
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper withBorder radius="md" p="xl" pos="relative">
                <LoadingOverlay visible={cargando} />
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="blue" radius="md"><IconFileTypePdf size={16} /></ThemeIcon>
                      <Text fw={600} size="sm">Documentos indexados</Text>
                    </Group>
                    <Group gap="sm">
                      <Badge variant="light" color="blue">{documentos.length} documentos</Badge>
                      <ActionIcon variant="light" radius="md" onClick={cargarDocumentos}><IconRefresh size={16} /></ActionIcon>
                    </Group>
                  </Group>
                  <TextInput placeholder="Buscar documento..." leftSection={<IconSearch size={16} />} value={busqueda} onChange={e => setBusqueda(e.currentTarget.value)} radius="md" />
                  <Divider />
                  <Table highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Título</Table.Th>
                        <Table.Th>Categoría</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtrados.map((doc, i) => (
                        <motion.tr key={doc.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ display: 'table-row' }}>
                          <Table.Td><Text size="sm" lineClamp={1} maw={200}>{doc.titulo}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="dimmed">{doc.categoria || '—'}</Text></Table.Td>
                          <Table.Td><Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado] ?? 'gray'}>{doc.estado}</Badge></Table.Td>
                          <Table.Td>
                            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarDocumento(doc.id, doc.titulo)}><IconTrash size={14} /></ActionIcon>
                          </Table.Td>
                        </motion.tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  {!cargando && filtrados.length === 0 && (
                    <Stack align="center" py="xl" gap="xs">
                      <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
                      <Text size="sm" c="dimmed">{documentos.length === 0 ? 'No hay documentos indexados. Sube el primero.' : 'No se encontraron documentos'}</Text>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        )}

        {/* ── TAB URLs ── */}
        {tab === 'urls' && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper withBorder radius="md" p="xl">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="teal" radius="md"><IconLink size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Agregar URL oficial</Text>
                  </Group>
                  <Divider />
                  <Text size="xs" c="dimmed">
                    Las URLs activas se consultan como Nivel 1 del loop de retroalimentación cuando la IA no encuentra documentación local con confianza ≥ 70%.
                  </Text>
                  <TextInput
                    label="URL"
                    placeholder="https://www.ejemplo.gob.ar"
                    leftSection={<IconWorld size={16} />}
                    value={nuevaUrl}
                    onChange={e => setNuevaUrl(e.target.value)}
                    radius="md"
                  />
                  <TextInput
                    label="Descripción (opcional)"
                    placeholder="Ej: Portal oficial de la entidad"
                    value={nuevaDesc}
                    onChange={e => setNuevaDesc(e.target.value)}
                    radius="md"
                  />
                  <Button
                    leftSection={<IconPlus size={16} />}
                    radius="md"
                    fullWidth
                    loading={agregandoUrl}
                    disabled={!nuevaUrl.trim().startsWith('http')}
                    onClick={agregarUrl}
                    color="teal"
                  >
                    Agregar URL
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper withBorder radius="md" p="xl" pos="relative">
                <LoadingOverlay visible={cargandoUrls} />
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="teal" radius="md"><IconWorld size={16} /></ThemeIcon>
                      <Text fw={600} size="sm">URLs registradas</Text>
                    </Group>
                    <Group gap="sm">
                      <Badge variant="light" color="teal">{urls.filter(u => u.activa).length} activas</Badge>
                      <ActionIcon variant="light" radius="md" onClick={cargarUrls}><IconRefresh size={16} /></ActionIcon>
                    </Group>
                  </Group>
                  <Divider />
                  {urls.length === 0 && !cargandoUrls && (
                    <Stack align="center" py="xl" gap="xs">
                      <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconLink size={20} /></ThemeIcon>
                      <Text size="sm" c="dimmed">No hay URLs registradas. Agrega la primera.</Text>
                    </Stack>
                  )}
                  <Stack gap="sm">
                    {urls.map((u, i) => (
                      <motion.div key={u.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <Paper withBorder p="sm" radius="md" bg={u.activa ? 'teal.0' : 'gray.0'}>
                          <Group justify="space-between">
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={500} lineClamp={1}>{u.url}</Text>
                              {u.descripcion && <Text size="xs" c="dimmed">{u.descripcion}</Text>}
                            </Stack>
                            <Group gap="xs">
                              <Tooltip label={u.activa ? 'Desactivar' : 'Activar'}>
                                <Switch checked={u.activa} onChange={e => toggleUrl(u.id, e.currentTarget.checked)} size="sm" color="teal" />
                              </Tooltip>
                              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarUrl(u.id)}>
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      </motion.div>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        )}
      </motion.div>
    </Box>
  )
}
