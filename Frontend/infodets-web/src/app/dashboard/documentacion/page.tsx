'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Textarea, Select, Button, Badge,
  Table, ActionIcon, ThemeIcon, Divider, Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconUpload, IconFile, IconFileTypePdf, IconFileTypeDoc,
  IconTrash, IconEye, IconSearch, IconPlus, IconFolderOpen, IconEdit,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Documento {
  id: string
  nombre: string
  tipo: string
  categoria: string
  fecha: string
  estado: string
  descripcion?: string
}

const DOCUMENTOS_MOCK: Documento[] = [
  { id: '1', nombre: 'Resolución 001-2024.pdf', tipo: 'PDF', categoria: 'Resoluciones', fecha: '12/01/2024', estado: 'Procesado', descripcion: 'Resolución anual de presupuesto.' },
  { id: '2', nombre: 'Normativa de licitaciones.docx', tipo: 'DOCX', categoria: 'Normativas', fecha: '05/03/2024', estado: 'Procesado', descripcion: 'Normativa vigente para procesos de licitación.' },
  { id: '3', nombre: 'Circular interna 2024.pdf', tipo: 'PDF', categoria: 'Circulares', fecha: '20/04/2024', estado: 'Pendiente', descripcion: '' },
]

const ESTADO_COLOR: Record<string, string> = {
  Procesado: 'green',
  Pendiente: 'yellow',
  Error: 'red',
}

export default function NuevaDocumentacionPage() {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [docEditando, setDocEditando] = useState<Documento | null>(null)
  const [modalEditar, { open: openEditar, close: closeEditar }] = useDisclosure(false)

  const documentosFiltrados = DOCUMENTOS_MOCK.filter((d) =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleEditar = (doc: Documento) => {
    setDocEditando({ ...doc })
    openEditar()
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Nueva Documentación</Title>
        <Text c="dimmed" size="sm" mb="xl">Carga y administra los documentos institucionales del sistema.</Text>

        <Grid>
          {/* Panel izquierdo — Formulario de carga */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">

              <Paper withBorder radius="md" p="xl">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md">
                      <IconUpload size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">Cargar documento</Text>
                  </Group>

                  <Divider />

                  <Box
                    style={{
                      border: '2px dashed var(--mantine-color-blue-3)',
                      borderRadius: 12,
                      padding: 32,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--mantine-color-blue-0)',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setArchivoSeleccionado('documento_ejemplo.pdf')}
                  >
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                        <IconFolderOpen size={24} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>
                        {archivoSeleccionado ?? 'Haz clic o arrastra un archivo aquí'}
                      </Text>
                      <Text size="xs" c="dimmed">PDF, DOCX, TXT — máx. 20MB</Text>
                    </Stack>
                  </Box>

                  {archivoSeleccionado && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <Paper withBorder p="sm" radius="md">
                        <Group gap="sm">
                          <ThemeIcon variant="light" color="red" radius="md" size="lg">
                            <IconFileTypePdf size={16} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500} lineClamp={1}>{archivoSeleccionado}</Text>
                            <Text size="xs" c="dimmed">Listo para cargar</Text>
                          </div>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => setArchivoSeleccionado(null)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    </motion.div>
                  )}
                </Stack>
              </Paper>

              <Paper withBorder radius="md" p="xl">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md">
                      <IconFile size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">Metadatos del documento</Text>
                  </Group>

                  <Divider />

                  <TextInput label="Título del documento" placeholder="Ej: Resolución 001-2024" disabled />
                  <Select
                    label="Categoría"
                    placeholder="Selecciona una categoría"
                    data={['Resoluciones', 'Normativas', 'Circulares', 'Decretos', 'Informes']}
                    disabled
                  />
                  <Select
                    label="Dependencia"
                    placeholder="Selecciona la dependencia"
                    data={['Administración', 'Legal', 'Finanzas', 'Recursos Humanos', 'Tecnología']}
                    disabled
                  />
                  <TextInput label="Año del documento" placeholder="Ej: 2024" disabled />
                  <Textarea label="Descripción" placeholder="Breve descripción del contenido..." rows={3} disabled />
                  <Button leftSection={<IconPlus size={16} />} radius="md" disabled fullWidth>
                    Cargar documento
                  </Button>
                </Stack>
              </Paper>

            </Stack>
          </Grid.Col>

          {/* Panel derecho — Listado con acciones CRUD */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper withBorder radius="md" p="xl" h="100%">
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md">
                      <IconFileTypeDoc size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">Documentos cargados</Text>
                  </Group>
                  <Badge variant="light" color="blue">{DOCUMENTOS_MOCK.length} documentos</Badge>
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
                      <Table.Th>Documento</Table.Th>
                      <Table.Th>Categoría</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {documentosFiltrados.map((doc, i) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{ display: 'table-row' }}
                      >
                        <Table.Td>
                          <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color={doc.tipo === 'PDF' ? 'red' : 'blue'} radius="sm">
                              {doc.tipo === 'PDF' ? <IconFileTypePdf size={12} /> : <IconFileTypeDoc size={12} />}
                            </ThemeIcon>
                            <Text size="sm" lineClamp={1} maw={150}>{doc.nombre}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{doc.categoria}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{doc.fecha}</Text></Table.Td>
                        <Table.Td>
                          <Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado]}>{doc.estado}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end">
                            <ActionIcon variant="subtle" color="blue" size="sm" disabled>
                              <IconEye size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              size="sm"
                              onClick={() => handleEditar(doc)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon variant="subtle" color="red" size="sm" disabled>
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </motion.tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {documentosFiltrados.length === 0 && (
                  <Stack align="center" py="xl" gap="xs">
                    <ThemeIcon size={40} variant="light" color="gray" radius="xl">
                      <IconSearch size={20} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">No se encontraron documentos</Text>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </motion.div>

      {/* Modal de edición */}
      <Modal
        opened={modalEditar}
        onClose={closeEditar}
        title={
          <Group gap="xs">
            <IconEdit size={16} />
            <Text fw={600} size="sm">Editar documento</Text>
          </Group>
        }
        radius="md"
        centered
      >
        {docEditando && (
          <Stack gap="md">
            <TextInput
              label="Título del documento"
              value={docEditando.nombre}
              onChange={(e) => setDocEditando({ ...docEditando, nombre: e.currentTarget.value })}
              radius="md"
            />
            <Select
              label="Categoría"
              value={docEditando.categoria}
              onChange={(v) => setDocEditando({ ...docEditando, categoria: v ?? docEditando.categoria })}
              data={['Resoluciones', 'Normativas', 'Circulares', 'Decretos', 'Informes']}
              radius="md"
            />
            <Select
              label="Estado"
              value={docEditando.estado}
              onChange={(v) => setDocEditando({ ...docEditando, estado: v ?? docEditando.estado })}
              data={['Procesado', 'Pendiente', 'Error']}
              radius="md"
            />
            <Textarea
              label="Descripción"
              value={docEditando.descripcion ?? ''}
              onChange={(e) => setDocEditando({ ...docEditando, descripcion: e.currentTarget.value })}
              rows={3}
              radius="md"
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeEditar} radius="md">Cancelar</Button>
              <Button radius="md" onClick={closeEditar}>Guardar cambios</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  )
}
