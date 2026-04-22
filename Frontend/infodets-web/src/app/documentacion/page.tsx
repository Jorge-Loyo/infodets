'use client'

import {
  Box, Grid, Text, Stack, Paper, Group, Title,
  TextInput, Textarea, Select, Button, Badge,
  Table, ThemeIcon, Divider, ActionIcon,
} from '@mantine/core'
import {
  IconUpload, IconFile, IconFileTypePdf, IconFileTypeDoc,
  IconTrash, IconSearch, IconPlus, IconFolderOpen, IconEye, IconClock,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'

const ULTIMOS_DOCUMENTOS = [
  { id: '1', nombre: 'Resolución 001-2024.pdf', tipo: 'PDF', categoria: 'Resoluciones', fecha: '12/01/2024', estado: 'Procesado' },
  { id: '2', nombre: 'Normativa de licitaciones.docx', tipo: 'DOCX', categoria: 'Normativas', fecha: '05/03/2024', estado: 'Procesado' },
  { id: '3', nombre: 'Circular interna 2024.pdf', tipo: 'PDF', categoria: 'Circulares', fecha: '20/04/2024', estado: 'Pendiente' },
]

const ESTADO_COLOR: Record<string, string> = {
  Procesado: 'green',
  Pendiente: 'yellow',
  Error: 'red',
}

export default function DocumentacionPage() {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const documentosFiltrados = ULTIMOS_DOCUMENTOS.filter((d) =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />

        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            <Title order={3} mb="xs">Nueva Documentación</Title>
            <Text c="dimmed" size="sm" mb="xl">
              Carga documentos institucionales al sistema.
            </Text>

            <Grid>

              {/* Panel izquierdo — Carga */}
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
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => setArchivoSeleccionado(null)}
                              >
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
                      <Textarea
                        label="Descripción"
                        placeholder="Breve descripción del contenido del documento..."
                        rows={3}
                        disabled
                      />
                      <Button leftSection={<IconPlus size={16} />} radius="md" disabled fullWidth>
                        Cargar documento
                      </Button>
                    </Stack>
                  </Paper>

                </Stack>
              </Grid.Col>

              {/* Panel derecho — Últimas cargadas (solo lectura) */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Paper withBorder radius="md" p="xl" h="100%">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <ThemeIcon variant="light" color="blue" radius="md">
                          <IconClock size={16} />
                        </ThemeIcon>
                        <Text fw={600} size="sm">Últimas cargadas</Text>
                      </Group>
                      <Badge variant="light" color="blue">{ULTIMOS_DOCUMENTOS.length} recientes</Badge>
                    </Group>

                    <TextInput
                      placeholder="Buscar en mis documentos..."
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
                                <Text size="sm" lineClamp={1} maw={160}>{doc.nombre}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td><Text size="sm" c="dimmed">{doc.categoria}</Text></Table.Td>
                            <Table.Td><Text size="sm" c="dimmed">{doc.fecha}</Text></Table.Td>
                            <Table.Td>
                              <Badge size="sm" variant="light" color={ESTADO_COLOR[doc.estado]}>
                                {doc.estado}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <ActionIcon variant="subtle" color="blue" size="sm" disabled>
                                <IconEye size={14} />
                              </ActionIcon>
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
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
