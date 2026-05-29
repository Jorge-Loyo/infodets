'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Select, Button, Badge, FileInput,
  Table, ThemeIcon, Divider, ActionIcon, LoadingOverlay, Progress, Anchor,
  Modal, Textarea,
} from '@mantine/core'
import {
  IconUpload, IconFileTypePdf, IconSearch,
  IconFolderOpen, IconBrain, IconEye, IconRefresh, IconNotes, IconEdit,
  IconSparkles, IconCheck,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { ingestaService } from '@/services/api/ingestaService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import axiosInstance from '@/lib/axiosInstance'
import type { DocumentoListItem } from '@/types/ingesta.types'

const ESTADO_COLOR: Record<string, string> = {
  procesado: 'green', pendiente: 'yellow', error: 'red',
}

const DOCS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:8000'

export default function DocumentacionPage() {
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [analizado, setAnalizado] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [busqueda, setBusqueda] = useState('')

  // Resumen modal
  const [resumenDoc, setResumenDoc] = useState<DocumentoListItem | null>(null)
  const [resumenTexto, setResumenTexto] = useState('')
  const [editandoResumen, setEditandoResumen] = useState(false)
  const [guardandoResumen, setGuardandoResumen] = useState(false)

  // Formulario
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

  const cargar = async () => {
    setCargando(true)
    try {
      setDocumentos(await ingestaService.listarRecientes())
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar documentos' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = documentos.filter((d) =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const limpiar = () => {
    setArchivo(null); setTitulo(''); setCategoria(''); setDependencia('')
    setAnio(''); setNroResolucion(''); setNroDecreto(''); setAutor('')
    setDescripcion(''); setProgreso(0); setAnalizado(false)
  }

  // Al seleccionar archivo, analizar automáticamente
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
    setSubiendo(true)
    setProgreso(20)
    try {
      setProgreso(50)
      const resultado = await ingestaService.cargar(archivo, {
        titulo: titulo.trim(), categoria, dependencia,
        anio: anio ? parseInt(anio) : undefined,
        nro_resolucion: nroResolucion.trim() || undefined,
        nro_decreto: nroDecreto.trim() || undefined,
        autor: autor.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
      })
      setProgreso(100)
      notifications.show({
        color: 'green',
        title: '✅ Documento procesado',
        message: `"${resultado.titulo}" indexado correctamente`,
      })
      limpiar()
      cargar()
    } catch (e: any) {
      notifications.show({
        color: 'red',
        title: 'Error al procesar',
        message: e?.response?.data?.detail ?? 'No se pudo procesar el documento',
      })
      setProgreso(0)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--mantine-color-default-hover)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            <Title order={3} mb="xs">Nueva Documentación</Title>
            <Text c="dimmed" size="sm" mb="xl">
              Carga documentos PDF para que la IA pueda responder consultas basadas en ellos.
            </Text>

            <Grid>
              {/* Panel izquierdo — Formulario */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper withBorder radius="md" p="xl" pos="relative">
                  <LoadingOverlay visible={analizando} loaderProps={{ children: <Stack align="center" gap="xs"><IconSparkles size={24} /><Text size="sm">Analizando documento con IA...</Text></Stack> }} />
                  <Stack gap="md">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="blue" radius="md"><IconBrain size={16} /></ThemeIcon>
                      <Text fw={600} size="sm">Cargar documento para la IA</Text>
                    </Group>
                    <Divider />

                    <FileInput
                      label="Archivo PDF"
                      placeholder="Selecciona un PDF"
                      accept=".pdf"
                      leftSection={<IconFolderOpen size={16} />}
                      value={archivo}
                      onChange={handleArchivoChange}
                      radius="md"
                      clearable
                    />

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

                    <TextInput label="Título *" placeholder="Ej: Resolución 001-2024" value={titulo} onChange={(e) => setTitulo(e.target.value)} radius="md" required />
                    <Select label="Categoría *" placeholder="Selecciona" data={opcionesCategorias} value={categoria} onChange={(v) => setCategoria(v ?? '')} radius="md" required searchable />
                    <Select label="Dependencia" placeholder="Selecciona" data={opcionesDependencias} value={dependencia} onChange={(v) => setDependencia(v ?? '')} radius="md" clearable searchable />
                    <TextInput label="Año" placeholder="Ej: 2024" value={anio} onChange={(e) => setAnio(e.target.value)} radius="md" maxLength={4} />
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput label="Nro. Resolución" placeholder="Ej: 001-2024" value={nroResolucion} onChange={(e) => setNroResolucion(e.target.value)} radius="md" />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput label="Nro. Decreto" placeholder="Ej: 1990/97" value={nroDecreto} onChange={(e) => setNroDecreto(e.target.value)} radius="md" />
                      </Grid.Col>
                    </Grid>
                    <TextInput label="Autor / Organismo" placeholder="Ej: Ministerio de Educación" value={autor} onChange={(e) => setAutor(e.target.value)} radius="md" />

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

                    <Button
                      leftSection={<IconUpload size={16} />}
                      radius="md" fullWidth
                      loading={subiendo}
                      disabled={!archivo || !titulo.trim() || !categoria}
                      onClick={handleSubir}
                    >
                      Procesar e indexar en IA
                    </Button>
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Panel derecho — Listado */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Paper withBorder radius="md" p="xl" pos="relative">
                  <LoadingOverlay visible={cargando} />
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <ThemeIcon variant="light" color="blue" radius="md"><IconFileTypePdf size={16} /></ThemeIcon>
                        <Text fw={600} size="sm">Últimos documentos disponibles</Text>
                      </Group>
                      <Group gap="sm">
                        <Badge variant="light" color="blue">{documentos.length} recientes</Badge>
                        <ActionIcon variant="light" radius="md" onClick={cargar}><IconRefresh size={16} /></ActionIcon>
                      </Group>
                    </Group>

                    <TextInput
                      placeholder="Buscar documento..."
                      leftSection={<IconSearch size={16} />}
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.currentTarget.value)}
                      radius="md"
                    />
                    <Divider />

                    <Box style={{ overflowX: 'auto' }}>
                      <Table highlightOnHover verticalSpacing="sm" style={{ minWidth: 480 }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th w={60} />
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Categoría</Table.Th>
                            <Table.Th>Dependencia</Table.Th>
                            <Table.Th>Estado</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filtrados.map((doc, i) => (
                            <motion.tr key={doc.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ display: 'table-row' }}>
                              <Table.Td>
                                <Group gap={4} wrap="nowrap">
                                  <Anchor href={`${DOCS_URL}/v1/admin/ingesta/ver/${doc.id}`} target="_blank" size="xs">
                                    <ActionIcon variant="subtle" color="blue" size="sm"><IconEye size={14} /></ActionIcon>
                                  </Anchor>
                                  <ActionIcon variant="subtle" color="violet" size="sm" onClick={() => { setResumenDoc(doc); setResumenTexto(doc.descripcion || 'Sin resumen. Suba el documento nuevamente para generar uno.'); setEditandoResumen(false) }}>
                                    <IconNotes size={14} />
                                  </ActionIcon>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <ThemeIcon size="sm" variant="light" color="red" radius="sm"><IconFileTypePdf size={12} /></ThemeIcon>
                                  <Text size="sm" lineClamp={1} maw={160}>{doc.titulo}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td><Text size="sm" c="dimmed">{doc.categoria || '—'}</Text></Table.Td>
                              <Table.Td><Text size="sm" c="dimmed">{doc.dependencia || '—'}</Text></Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado] ?? 'gray'}>{doc.estado}</Badge>
                              </Table.Td>
                            </motion.tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>

                    {!cargando && filtrados.length === 0 && (
                      <Stack align="center" py="xl" gap="xs">
                        <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
                        <Text size="sm" c="dimmed">
                          {documentos.length === 0 ? 'No hay documentos disponibles aún.' : 'No se encontraron documentos'}
                        </Text>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </motion.div>
        </Box>
      </Box>
      <Footer />

      {/* Modal Resumen */}
      <Modal opened={!!resumenDoc} onClose={() => setResumenDoc(null)} title={`Resumen IA — ${resumenDoc?.titulo ?? ''}`} radius="md" size="lg">
        <Stack gap="md">
          {editandoResumen ? (
            <Textarea
              value={resumenTexto}
              onChange={(e) => setResumenTexto(e.target.value)}
              minRows={4}
              autosize
              radius="md"
            />
          ) : (
            <Paper withBorder p="md" radius="md" bg="violet.0">
              <Text size="sm">{resumenTexto || 'Sin resumen disponible.'}</Text>
            </Paper>
          )}
          <Group justify="flex-end" gap="sm">
            {editandoResumen ? (
              <>
                <Button variant="subtle" color="gray" onClick={() => setEditandoResumen(false)}>Cancelar</Button>
                <Button loading={guardandoResumen} onClick={async () => {
                  if (!resumenDoc) return
                  setGuardandoResumen(true)
                  try {
                    const fd = new FormData()
                    fd.append('descripcion', resumenTexto)
                    await axiosInstance.put(`/admin/ingesta/${resumenDoc.id}/resumen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                    setDocumentos(prev => prev.map(d => d.id === resumenDoc.id ? { ...d, descripcion: resumenTexto } : d))
                    notifications.show({ color: 'green', message: 'Resumen actualizado' })
                    setEditandoResumen(false)
                  } catch {
                    notifications.show({ color: 'red', message: 'Error al guardar resumen' })
                  } finally { setGuardandoResumen(false) }
                }}>Guardar</Button>
              </>
            ) : (
              <Button variant="light" leftSection={<IconEdit size={14} />} onClick={() => setEditandoResumen(true)}>Editar resumen</Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
