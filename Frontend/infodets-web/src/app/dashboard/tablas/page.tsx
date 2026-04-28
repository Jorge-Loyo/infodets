'use client'

import {
  Box, Grid, Paper, Text, Title, Stack, Group, ThemeIcon,
  Badge, Button, ActionIcon, TextInput, Modal, Divider,
  Table, NavLink, LoadingOverlay,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconTable, IconPlus, IconEdit, IconTrash,
  IconSearch, IconChevronRight, IconTag,
  IconBuilding, IconBriefcase, IconSitemap,
  IconCategory, IconList, IconRefresh,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { tablaService, type TablaValor } from '@/services/api/tablaService'

const TABLA_META: Record<string, { nombre: string; descripcion: string; icono: any; color: string }> = {
  instituciones:       { nombre: 'Instituciones',              descripcion: 'Desplegable de instituciones en perfil de usuario',       icono: IconBuilding,  color: 'orange' },
  dependencias:        { nombre: 'Dependencias',               descripcion: 'Desplegable de dependencias institucionales',              icono: IconSitemap,   color: 'teal'   },
  cargos:              { nombre: 'Cargos',                     descripcion: 'Desplegable de cargos en perfil de usuario',              icono: IconBriefcase, color: 'violet' },
  categorias:          { nombre: 'Categorías de documentos',   descripcion: 'Desplegable de categorías en carga de documentos',        icono: IconCategory,  color: 'blue'   },
  categorias_noticias: { nombre: 'Categorías de noticias',     descripcion: 'Desplegable de categorías en publicaciones',              icono: IconTag,       color: 'pink'   },
  estados_documento:   { nombre: 'Estados de documento',       descripcion: 'Estados posibles para documentos cargados',               icono: IconList,      color: 'green'  },
}

export default function AdminTablasPage() {
  const [tablas, setTablas] = useState<string[]>([])
  const [tablaActiva, setTablaActiva] = useState<string>('instituciones')
  const [items, setItems] = useState<TablaValor[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalNuevoItem, { open: openNuevoItem, close: closeNuevoItem }] = useDisclosure(false)
  const [modalEditarItem, { open: openEditarItem, close: closeEditarItem }] = useDisclosure(false)
  const [modalEliminarItem, { open: openEliminarItem, close: closeEliminarItem }] = useDisclosure(false)

  const [nuevoValor, setNuevoValor] = useState('')
  const [itemEditando, setItemEditando] = useState<TablaValor | null>(null)
  const [itemEliminando, setItemEliminando] = useState<TablaValor | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargarTablas = async () => {
    try {
      const data = await tablaService.listarTablas()
      setTablas(data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar tablas' })
    }
  }

  const cargarItems = async (tablaId: string) => {
    setCargando(true)
    try {
      const data = await tablaService.listar(tablaId)
      setItems(data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar valores' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarTablas() }, [])
  useEffect(() => { cargarItems(tablaActiva) }, [tablaActiva])

  const cambiarTabla = (tablaId: string) => {
    setTablaActiva(tablaId)
    setBusqueda('')
  }

  const itemsFiltrados = items.filter((i) =>
    i.valor.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleAgregarItem = async () => {
    if (!nuevoValor.trim()) return
    setGuardando(true)
    try {
      const nuevo = await tablaService.crear(tablaActiva, nuevoValor.trim())
      setItems((prev) => [...prev, nuevo])
      setNuevoValor('')
      closeNuevoItem()
      notifications.show({ color: 'green', message: 'Valor agregado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al agregar valor' })
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarEdicion = async () => {
    if (!itemEditando) return
    setGuardando(true)
    try {
      const actualizado = await tablaService.actualizar(tablaActiva, itemEditando.id, { valor: itemEditando.valor })
      setItems((prev) => prev.map((i) => i.id === actualizado.id ? actualizado : i))
      closeEditarItem()
      notifications.show({ color: 'green', message: 'Valor actualizado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar valor' })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarItem = async () => {
    if (!itemEliminando) return
    try {
      await tablaService.eliminar(tablaActiva, itemEliminando.id)
      setItems((prev) => prev.filter((i) => i.id !== itemEliminando.id))
      closeEliminarItem()
      notifications.show({ color: 'green', message: 'Valor eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar valor' })
    }
  }

  const handleToggleActivo = async (item: TablaValor) => {
    try {
      const actualizado = await tablaService.actualizar(tablaActiva, item.id, { activo: !item.activo })
      setItems((prev) => prev.map((i) => i.id === actualizado.id ? actualizado : i))
    } catch {
      notifications.show({ color: 'red', message: 'Error al cambiar estado' })
    }
  }

  const meta = TABLA_META[tablaActiva] ?? { nombre: tablaActiva, descripcion: '', icono: IconTable, color: 'blue' }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3}>Administrar tablas</Title>
            <Text c="dimmed" size="sm">Gestiona los valores de los desplegables usados en todo el sistema.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={() => cargarItems(tablaActiva)}>
            Actualizar
          </Button>
        </Group>

        <Grid>
          {/* Panel izquierdo */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder radius="md" p="sm">
              <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">Tablas disponibles</Text>
              <Divider mb="xs" />
              <Stack gap={2}>
                {(tablas.length > 0 ? tablas : Object.keys(TABLA_META)).map((tablaId, i) => {
                  const m = TABLA_META[tablaId] ?? { nombre: tablaId, icono: IconTable, color: 'blue' }
                  return (
                    <motion.div key={tablaId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <NavLink
                        label={
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="sm" lineClamp={1}>{m.nombre}</Text>
                            <Badge size="xs" variant="light" color={m.color}>
                              {tablaActiva === tablaId ? items.length : ''}
                            </Badge>
                          </Group>
                        }
                        leftSection={
                          <ThemeIcon size="sm" variant="light" color={m.color} radius="sm">
                            <m.icono size={12} />
                          </ThemeIcon>
                        }
                        rightSection={<IconChevronRight size={12} opacity={0.4} />}
                        active={tablaActiva === tablaId}
                        onClick={() => cambiarTabla(tablaId)}
                        style={{ cursor: 'pointer', borderRadius: 8 }}
                      />
                    </motion.div>
                  )
                })}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Panel derecho */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder radius="md" p="xl" pos="relative">
              <LoadingOverlay visible={cargando} />
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon size={36} radius="md" variant="light" color={meta.color}>
                      <meta.icono size={18} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600} size="sm">{meta.nombre}</Text>
                      <Text size="xs" c="dimmed">{meta.descripcion}</Text>
                    </div>
                  </Group>
                  <Button size="xs" leftSection={<IconPlus size={14} />} radius="md" onClick={() => { setNuevoValor(''); openNuevoItem() }}>
                    Agregar
                  </Button>
                </Group>

                <TextInput
                  placeholder="Buscar en esta tabla..."
                  leftSection={<IconSearch size={16} />}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.currentTarget.value)}
                  radius="md"
                />

                <Divider />

                <Table highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Valor</Table.Th>
                      <Table.Th ta="center">Estado</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <AnimatePresence>
                      {itemsFiltrados.map((item, i) => (
                        <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }} style={{ display: 'table-row' }}>
                          <Table.Td><Text size="xs" c="dimmed">{i + 1}</Text></Table.Td>
                          <Table.Td><Text size="sm" fw={500}>{item.valor}</Text></Table.Td>
                          <Table.Td ta="center">
                            <Badge size="sm" variant="light" color={item.activo ? 'green' : 'gray'} style={{ cursor: 'pointer' }} onClick={() => handleToggleActivo(item)}>
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <ActionIcon variant="subtle" color="yellow" size="sm" onClick={() => { setItemEditando({ ...item }); openEditarItem() }}>
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setItemEliminando(item); openEliminarItem() }}>
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </Table.Tbody>
                </Table>

                {!cargando && itemsFiltrados.length === 0 && (
                  <Stack align="center" py="xl" gap="xs">
                    <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconTable size={20} /></ThemeIcon>
                    <Text size="sm" c="dimmed">No se encontraron valores</Text>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </motion.div>

      {/* Modal nuevo item */}
      <Modal opened={modalNuevoItem} onClose={closeNuevoItem} title={`Agregar valor a "${meta.nombre}"`} radius="md" centered size="sm">
        <Stack gap="md">
          <TextInput label="Valor" placeholder="Ej: Nueva institución" value={nuevoValor} onChange={(e) => setNuevoValor(e.currentTarget.value)} radius="md" onKeyDown={(e) => e.key === 'Enter' && handleAgregarItem()} autoFocus />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeNuevoItem} radius="md">Cancelar</Button>
            <Button radius="md" loading={guardando} onClick={handleAgregarItem} disabled={!nuevoValor.trim()}>Agregar</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal editar item */}
      <Modal opened={modalEditarItem} onClose={closeEditarItem} title="Editar valor" radius="md" centered size="sm">
        {itemEditando && (
          <Stack gap="md">
            <TextInput label="Valor" value={itemEditando.valor} onChange={(e) => setItemEditando({ ...itemEditando, valor: e.currentTarget.value })} radius="md" autoFocus />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeEditarItem} radius="md">Cancelar</Button>
              <Button radius="md" loading={guardando} onClick={handleGuardarEdicion}>Guardar</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal opened={modalEliminarItem} onClose={closeEliminarItem} title="Eliminar valor" radius="md" centered size="sm">
        <Stack gap="md">
          <Text size="sm" c="dimmed">¿Eliminar <strong>{itemEliminando?.valor}</strong>? Los desplegables que lo usen quedarán sin esta opción.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeEliminarItem} radius="md">Cancelar</Button>
            <Button color="red" radius="md" onClick={handleEliminarItem}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
