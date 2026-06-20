'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Select, Button, Badge, FileInput,
  Table, ActionIcon, ThemeIcon, Divider, LoadingOverlay,
  Progress, Tabs, Switch, Tooltip, Modal, Textarea,
} from '@mantine/core'
import {
  IconUpload, IconFileTypePdf, IconTrash,
  IconSearch, IconFolderOpen, IconRefresh, IconBrain,
  IconLink, IconPlus, IconWorld, IconEye, IconEdit,
  IconCloudUpload, IconHistory, IconSparkles, IconCheck,
} from '@tabler/icons-react'

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:8000'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { ingestaService } from '@/services/api/ingestaService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import axiosInstance from '@/lib/axiosInstance'
import type { DocumentoListItem } from '@/types/ingesta.types'

const ESTADO_COLOR: Record<string, string> = {
  procesado: 'green', pendiente: 'yellow', error: 'red',
}

interface UrlOficial {
  id: string
  url: string
  descripcion?: string
  activa: boolean
  creado_en: string
}

export default function DocumentacionPage() {
  // Pestañas principales
  const [pestana, setPestana] = useState('carga')
  // Sub-pestañas de historial
  const [tabHistorial, setTabHistorial] = useState('documentos')

  // ── Documentos ──
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [analizado, setAnalizado] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [dependencia, setDependencia] = useState('')
  const [anio, setAnio] = useState('')
  const [nroResolucion, setNroResolucion] = useState('')
  const [nroDecreto, setNroDecreto] = useState('')
  const [autor, setAutor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const opcionesCategorias = useTablaOpciones('categorias', true)
  const opcionesDependencias = useTablaOpciones('dependencias', true)

  // ── URLs ──
  const [urls, setUrls] = useState<UrlOficial[]>([])
  const [cargandoUrls, setCargandoUrls] = useState(false)
  const [nuevaUrl, setNuevaUrl] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [agregandoUrl, setAgregandoUrl] = useState(false)

  // ── Edición ──
  const [editando, setEditando] = useState<DocumentoListItem | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [editDependencia, setEditDependencia] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const abrirEdicion = (doc: DocumentoListItem) => {
    setEditando(doc)
    setEditTitulo(doc.titulo)
    setEditCategoria(doc.categoria ?? '')
    setEditDependencia(doc.dependencia ?? '')
  }

  const guardarEdicion = async () => {
    if (!editando || !editTitulo.trim()) return
    setGuardandoEdit(true)
    try {
      const fd = new FormData()
      fd.append('titulo', editTitulo.trim())
      if (editCategoria) fd.append('categoria', editCategoria)
      fd.append('dependencia', editDependencia)
      await axiosInstance.put(`/admin/ingesta/${editando.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDocumentos(prev => prev.map(d => d.id === editando.id
        ? { ...d, titulo: editTitulo, categoria: editCategoria, dependencia: editDependencia }
        : d
      ))
      notifications.show({ color: 'green', message: 'Documento actualizado' })
      setEditando(null)
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar documento' })
    } finally {
      setGuardandoEdit(false)
    }
  }

  const cargarDocumentos = async () => {
    setCargando(true)
    try { setDocumentos(await ingestaService.listar()) }
    catch { notifications.show({ color: 'red', message: 'Error al cargar documentos' }) }
    finally { setCargando(false) }
  }

  const cargarUrls = async () => {
    setCargandoUrls(true)
    try {
      const res = await axiosInstance.get<UrlOficial[]>('/urls')
      setUrls(res.data)
    } catch { notifications.show({ color: 'red', message: 'Error al cargar URLs' }) }
    finally { setCargandoUrls(false) }
  }

  useEffect(() => { cargarDocumentos() }, [])
  useEffect(() => { if (pestana === 'historial' && tabHistorial === 'urls') cargarUrls() }, [pestana, tabHistorial])

  const eliminarDocumento = async (id: string, tit: string) => {
    if (!confirm(`¿Eliminar "${tit}" de Qdrant y RDS?`)) return
    try {
      await axiosInstance.delete(`/admin/ingesta/${id}`)
      setDocumentos(prev => prev.filter(d => d.id !== id))
      notifications.show({ color: 'green', message: 'Documento eliminado de la IA' })
    } catch { notifications.show({ color: 'red', message: 'Error al eliminar documento' }) }
  }

  const filtrados = documentos.filter(d =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const limpiarFormulario = () => {
    setArchivo(null); setTitulo(''); setCategoria(''); setDependencia(''); setAnio(''); setNroResolucion(''); setNroDecreto(''); setAutor(''); setDescripcion(''); setProgreso(0); setAnalizado(false)
  }

  // Al seleccionar archivo, analizar automáticamente con IA
  const handleArchivoChange = async (file: File | null) => {
    setArchivo(file)
    setAnalizado(false)
    if (!file) return

    setAnalizando(true)
    try {
      const resultado = await ingestaService.analizar(file)
      if (resultado.titulo) setTitulo(resultado.titulo)
      if (resultado.categoria) {
        const match = opcionesCategorias.find((o: any) =>
          typeof o === 'string' ? o === resultado.categoria : o.value === resultado.categoria || o.label === resultado.categoria
        )
        if (match) setCategoria(typeof match === 'string' ? match : match.value)
      }
      if (resultado.dependencia) setDependencia(resultado.dependencia)
      if (resultado.anio) setAnio(String(resultado.anio))
      if (resultado.nro_resolucion) setNroResolucion(resultado.nro_resolucion)
      if (resultado.nro_decreto) setNroDecreto(resultado.nro_decreto)
      if (resultado.autor) setAutor(resultado.autor)
      if (resultado.descripcion) setDescripcion(resultado.descripcion)
      setAnalizado(true)
      notifications.show({ color: 'blue', title: '🤖 Análisis completado', message: 'Revisá los campos autocompletados y corregí lo necesario.' })
    } catch {
      notifications.show({ color: 'orange', message: 'No se pudo analizar el PDF. Completá los campos manualmente.' })
    } finally {
      setAnalizando(false)
    }
  }

  const handleSubir = async () => {
    if (!archivo || !titulo.trim() || !categoria) {
      notifications.show({ color: 'orange', message: 'Completa título, categoría y selecciona un PDF' })
      return
    }
    setSubiendo(true); setProgreso(10)
    try {
      setProgreso(30)
      const resultado = await ingestaService.cargar(archivo, {
        titulo: titulo.trim(), categoria, dependencia,
        anio: anio ? parseInt(anio) : undefined,
        nro_resolucion: nroResolucion.trim() || undefined,
        nro_decreto: nroDecreto.trim() || undefined,
        autor: autor.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
      })
      setProgreso(100)
      notifications.show({ color: 'green', title: '✅ Documento procesado', message: `"${resultado.titulo}" indexado correctamente` })
      limpiarFormulario()
      cargarDocumentos()
    } catch (e: unknown) {
      notifications.show({ color: 'red', title: 'Error al procesar', message: (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'No se pudo procesar el documento' })
      setProgreso(0)
    } finally { setSubiendo(false) }
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
    } catch { notifications.show({ color: 'red', message: 'Error al agregar URL (puede que ya exista)' }) }
    finally { setAgregandoUrl(false) }
  }

  const toggleUrl = async (id: string, activa: boolean) => {
    try {
      const res = await axiosInstance.put<UrlOficial>(`/urls/${id}`, { activa })
      setUrls(prev => prev.map(u => u.id === id ? res.data : u))
    } catch { notifications.show({ color: 'red', message: 'Error al actualizar URL' }) }
  }

  const eliminarUrl = async (id: string) => {
    try {
      await axiosInstance.delete(`/urls/${id}`)
      setUrls(prev => prev.filter(u => u.id !== id))
      notifications.show({ color: 'green', message: 'URL eliminada' })
    } catch { notifications.show({ color: 'red', message: 'Error al eliminar URL' }) }
  }

  return (
    <Box p={{ base: 16, sm: 32 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Documentación</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Gestioná los documentos PDF y las URLs oficiales que usa la IA para responder consultas.
        </Text>

        {/* ── Pestañas principales ── */}
        <Tabs value={pestana} onChange={v => setPestana(v ?? 'carga')} mb="xl">
          <Tabs.List>
            <Tabs.Tab value="carga" leftSection={<IconCloudUpload size={16} />}>
              Carga
            </Tabs.Tab>
            <Tabs.Tab value="historial" leftSection={<IconHistory size={16} />}>
              Historial
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* ══ PESTAÑA CARGA ══ */}
        {pestana === 'carga' && (
          <Grid>
            {/* Cargar PDF */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder radius="md" p="xl" h="100%" pos="relative">
                <LoadingOverlay visible={analizando} loaderProps={{ children: <Stack align="center" gap="xs"><IconSparkles size={24} /><Text size="sm">Analizando documento con IA...</Text></Stack> }} />
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md"><IconBrain size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Cargar documento PDF</Text>
                  </Group>
                  <Divider />
                  <FileInput label="Archivo PDF" placeholder="Selecciona un PDF" accept=".pdf" leftSection={<IconFolderOpen size={16} />} value={archivo} onChange={handleArchivoChange} radius="md" clearable />
                  {archivo && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <Paper withBorder p="sm" radius="md" bg={analizado ? 'green.0' : 'blue.0'}>
                        <Group gap="sm">
                          <ThemeIcon variant="light" color={analizado ? 'green' : 'red'} radius="md" size="lg">
                            {analizado ? <IconCheck size={16} /> : <IconFileTypePdf size={16} />}
                          </ThemeIcon>
                          <Stack gap={0} style={{ flex: 1 }}>
                            <Text size="sm" fw={500} lineClamp={1}>{archivo.name}</Text>
                            <Text size="xs" c="dimmed">
                              {(archivo.size / 1024 / 1024).toFixed(2)} MB
                              {analizado && ' — Campos autocompletados por IA'}
                            </Text>
                          </Stack>
                        </Group>
                      </Paper>
                    </motion.div>
                  )}
                  <Divider label="Metadatos" labelPosition="left" />
                  <TextInput label="Título *" placeholder="Ej: Resolución 001-2024" value={titulo} onChange={e => setTitulo(e.target.value)} radius="md" required />
                  <Select label="Categoría *" placeholder="Selecciona" data={opcionesCategorias} value={categoria} onChange={v => setCategoria(v ?? '')} radius="md" required searchable />
                  <Select label="Dependencia" placeholder="Selecciona" data={opcionesDependencias} value={dependencia} onChange={v => setDependencia(v ?? '')} radius="md" clearable searchable />
                  <TextInput label="Año" placeholder="Ej: 2024" value={anio} onChange={e => setAnio(e.target.value)} radius="md" maxLength={4} />
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput label="Nro. Resolución" placeholder="Ej: 001-2024" value={nroResolucion} onChange={e => setNroResolucion(e.target.value)} radius="md" />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput label="Nro. Decreto" placeholder="Ej: 1990/97" value={nroDecreto} onChange={e => setNroDecreto(e.target.value)} radius="md" />
                    </Grid.Col>
                  </Grid>
                  <TextInput label="Autor / Organismo" placeholder="Ej: Ministerio de Educación" value={autor} onChange={e => setAutor(e.target.value)} radius="md" />
                  <Divider label="Resumen IA" labelPosition="left" />
                  <Textarea
                    label="Descripción / Resumen"
                    placeholder="Se genera automáticamente al analizar el PDF..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    minRows={3}
                    autosize
                    radius="md"
                  />
                  {subiendo && progreso > 0 && (
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">Procesando e indexando...</Text>
                      <Progress value={progreso} animated radius="md" />
                    </Stack>
                  )}
                  <Button leftSection={<IconUpload size={16} />} radius="md" fullWidth loading={subiendo} disabled={!archivo || !titulo.trim() || !categoria} onClick={handleSubir}>
                    Procesar e indexar en IA
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Agregar URL */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder radius="md" p="xl" h="100%">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="teal" radius="md"><IconLink size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Agregar URL oficial</Text>
                  </Group>
                  <Divider />
                  <Text size="xs" c="dimmed">
                    Las URLs activas se consultan como Nivel 1 del loop de retroalimentación cuando la IA no encuentra documentación local con confianza ≥ 70%.
                  </Text>
                  <TextInput label="URL" placeholder="https://www.ejemplo.gob.ar" leftSection={<IconWorld size={16} />} value={nuevaUrl} onChange={e => setNuevaUrl(e.target.value)} radius="md" />
                  <TextInput label="Descripción (opcional)" placeholder="Ej: Portal oficial de la entidad" value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} radius="md" />
                  <Button leftSection={<IconPlus size={16} />} radius="md" fullWidth loading={agregandoUrl} disabled={!nuevaUrl.trim().startsWith('http')} onClick={agregarUrl} color="teal">
                    Agregar URL
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        )}

        {/* ══ PESTAÑA HISTORIAL ══ */}
        {pestana === 'historial' && (
          <>
            <Tabs value={tabHistorial} onChange={v => setTabHistorial(v ?? 'documentos')} mb="md">
              <Tabs.List>
                <Tabs.Tab value="documentos" leftSection={<IconFileTypePdf size={14} />}>
                  Documentos PDF
                </Tabs.Tab>
                <Tabs.Tab value="urls" leftSection={<IconWorld size={14} />}>
                  URLs Oficiales
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            {/* Documentos */}
            {tabHistorial === 'documentos' && (
              <Paper withBorder radius="md" p="xl" pos="relative">
                <LoadingOverlay visible={cargando} />
                <Stack gap="md">
                  <Group justify="space-between" wrap="wrap" gap="sm">
                    <TextInput placeholder="Buscar documento..." leftSection={<IconSearch size={16} />} value={busqueda} onChange={e => setBusqueda(e.currentTarget.value)} radius="md" style={{ flex: 1, minWidth: 200 }} />
                    <Group gap="sm">
                      <Badge variant="light" color="blue">{documentos.length} documentos</Badge>
                      <ActionIcon variant="light" radius="md" onClick={cargarDocumentos}><IconRefresh size={16} /></ActionIcon>
                    </Group>
                  </Group>
                  <Divider />
                  <Box style={{ overflowX: 'auto' }}>
                    <Table highlightOnHover verticalSpacing="sm" style={{ minWidth: 500 }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th w={40} />
                          <Table.Th>Título</Table.Th>
                          <Table.Th>Categoría</Table.Th>
                          <Table.Th>Dependencia</Table.Th>
                          <Table.Th>Estado</Table.Th>
                          <Table.Th />
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filtrados.map((doc, i) => (
                          <motion.tr key={doc.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ display: 'table-row' }}>
                            <Table.Td>
                              <ActionIcon variant="subtle" color="blue" size="sm" component="a" href={`${DOCS_URL}/v1/admin/ingesta/ver/${doc.id}`} download>
                                <IconEye size={14} />
                              </ActionIcon>
                            </Table.Td>
                            <Table.Td><Text size="sm" lineClamp={1} maw={200}>{doc.titulo}</Text></Table.Td>
                            <Table.Td><Text size="sm" c="dimmed">{doc.categoria || '—'}</Text></Table.Td>
                            <Table.Td><Text size="sm" c="dimmed">{doc.dependencia || '—'}</Text></Table.Td>
                            <Table.Td><Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado] ?? 'gray'}>{doc.estado}</Badge></Table.Td>
                            <Table.Td>
                              <Group gap={4} wrap="nowrap">
                                <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => abrirEdicion(doc)}><IconEdit size={14} /></ActionIcon>
                                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarDocumento(doc.id, doc.titulo)}><IconTrash size={14} /></ActionIcon>
                              </Group>
                            </Table.Td>
                          </motion.tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Box>
                  {!cargando && filtrados.length === 0 && (
                    <Stack align="center" py="xl" gap="xs">
                      <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
                      <Text size="sm" c="dimmed">{documentos.length === 0 ? 'No hay documentos indexados. Sube el primero.' : 'No se encontraron documentos'}</Text>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}

            {/* URLs */}
            {tabHistorial === 'urls' && (
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
                      <Text size="sm" c="dimmed">No hay URLs registradas.</Text>
                    </Stack>
                  )}
                  <Stack gap="sm">
                    {urls.map((u, i) => (
                      <motion.div key={u.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <Paper withBorder p="sm" radius="md" bg={u.activa ? 'teal.0' : 'var(--mantine-color-default-hover)'}>
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
            )}
          </>
        )}
      </motion.div>

      {/* Modal edición */}
      <Modal opened={!!editando} onClose={() => setEditando(null)} title="Editar metadatos del documento" radius="md" size="md">
        <Stack gap="md">
          <TextInput label="Título *" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} radius="md" required />
          <Select label="Categoría" data={opcionesCategorias} value={editCategoria} onChange={v => setEditCategoria(v ?? '')} radius="md" clearable />
          <Select label="Dependencia" data={opcionesDependencias} value={editDependencia} onChange={v => setEditDependencia(v ?? '')} radius="md" clearable />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button loading={guardandoEdit} disabled={!editTitulo.trim()} leftSection={<IconEdit size={14} />} onClick={guardarEdicion}>Guardar cambios</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
