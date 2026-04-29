'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Select, Button, Badge, FileInput,
  Table, ActionIcon, ThemeIcon, Divider, LoadingOverlay,
  Progress,
} from '@mantine/core'
import {
  IconUpload, IconFileTypePdf, IconTrash,
  IconSearch, IconFolderOpen, IconRefresh, IconBrain,
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

export default function DocumentacionPage() {
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

  const cargarDocumentos = async () => {
    setCargando(true)
    try {
      const data = await ingestaService.listar()
      setDocumentos(data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar documentos' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDocumentos() }, [])

  const eliminarDocumento = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}" de Qdrant y RDS?`)) return
    try {
      await axiosInstance.delete(`/admin/ingesta/${id}`)
      setDocumentos((prev) => prev.filter((d) => d.id !== id))
      notifications.show({ color: 'green', message: 'Documento eliminado de la IA' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar documento' })
    }
  }

  const filtrados = documentos.filter((d) =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const limpiarFormulario = () => {
    setArchivo(null)
    setTitulo('')
    setCategoria('')
    setDependencia('')
    setAnio('')
    setProgreso(0)
  }

  const handleSubir = async () => {
    if (!archivo || !titulo.trim() || !categoria) {
      notifications.show({ color: 'orange', message: 'Completa título, categoría y selecciona un PDF' })
      return
    }
    setSubiendo(true)
    setProgreso(10)
    try {
      setProgreso(30)
      const resultado = await ingestaService.cargar(archivo, {
        titulo: titulo.trim(),
        categoria,
        dependencia,
        anio: anio ? parseInt(anio) : undefined,
      })
      setProgreso(100)
      notifications.show({
        color: 'green',
        title: '✅ Documento procesado',
        message: `"${resultado.titulo}" — ${resultado.vector_id}`,
      })
      limpiarFormulario()
      cargarDocumentos()
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
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Documentación</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Carga documentos PDF para entrenar la IA. Cada documento se fragmenta, vectoriza y almacena en Qdrant.
        </Text>

        <Grid>
          {/* Panel izquierdo — Formulario de carga */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper withBorder radius="md" p="xl">
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="blue" radius="md"><IconBrain size={16} /></ThemeIcon>
                  <Text fw={600} size="sm">Cargar documento para entrenar IA</Text>
                </Group>
                <Divider />

                {/* Zona de carga */}
                <FileInput
                  label="Archivo PDF"
                  placeholder="Selecciona un PDF"
                  accept=".pdf"
                  leftSection={<IconFolderOpen size={16} />}
                  value={archivo}
                  onChange={setArchivo}
                  radius="md"
                  clearable
                />

                {archivo && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper withBorder p="sm" radius="md" bg="blue.0">
                      <Group gap="sm">
                        <ThemeIcon variant="light" color="red" radius="md" size="lg">
                          <IconFileTypePdf size={16} />
                        </ThemeIcon>
                        <Stack gap={0} style={{ flex: 1 }}>
                          <Text size="sm" fw={500} lineClamp={1}>{archivo.name}</Text>
                          <Text size="xs" c="dimmed">{(archivo.size / 1024 / 1024).toFixed(2)} MB</Text>
                        </Stack>
                      </Group>
                    </Paper>
                  </motion.div>
                )}

                <Divider label="Metadatos" labelPosition="left" />

                <TextInput
                  label="Título del documento *"
                  placeholder="Ej: Resolución 001-2024"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  radius="md"
                  required
                />
                <Select
                  label="Categoría *"
                  placeholder="Selecciona una categoría"
                  data={opcionesCategorias}
                  value={categoria}
                  onChange={(v) => setCategoria(v ?? '')}
                  radius="md"
                  required
                />
                <Select
                  label="Dependencia"
                  placeholder="Selecciona la dependencia"
                  data={opcionesDependencias}
                  value={dependencia}
                  onChange={(v) => setDependencia(v ?? '')}
                  radius="md"
                  clearable
                />
                <TextInput
                  label="Año"
                  placeholder="Ej: 2024"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  radius="md"
                  maxLength={4}
                />

                {subiendo && progreso > 0 && (
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">Procesando documento...</Text>
                    <Progress value={progreso} animated radius="md" />
                  </Stack>
                )}

                <Button
                  leftSection={<IconUpload size={16} />}
                  radius="md"
                  fullWidth
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
                    <Text fw={600} size="sm">Documentos indexados</Text>
                  </Group>
                  <Group gap="sm">
                    <Badge variant="light" color="blue">{documentos.length} documentos</Badge>
                    <ActionIcon variant="light" radius="md" onClick={cargarDocumentos}><IconRefresh size={16} /></ActionIcon>
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

                <Table highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Título</Table.Th>
                      <Table.Th>Categoría</Table.Th>
                      <Table.Th>Dependencia</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Chunks</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtrados.map((doc, i) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ display: 'table-row' }}
                      >
                        <Table.Td>
                          <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="red" radius="sm">
                              <IconFileTypePdf size={12} />
                            </ThemeIcon>
                            <Text size="sm" lineClamp={1} maw={160}>{doc.titulo}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{doc.categoria || '—'}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{doc.dependencia || '—'}</Text></Table.Td>
                        <Table.Td>
                          <Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado] ?? 'gray'}>
                            {doc.estado}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{doc.vector_id?.replace('qdrant:', '') || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarDocumento(doc.id, doc.titulo)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </motion.tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {!cargando && filtrados.length === 0 && (
                  <Stack align="center" py="xl" gap="xs">
                    <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
                    <Text size="sm" c="dimmed">
                      {documentos.length === 0 ? 'No hay documentos indexados. Sube el primero.' : 'No se encontraron documentos'}
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Box>
  )
}
