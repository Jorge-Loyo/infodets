'use client'

import {
  Box, Grid, Paper, Text, Title, Stack, Group, ThemeIcon,
  Badge, Button, ActionIcon, TextInput, Modal, Divider,
  Table, NavLink,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconTable, IconPlus, IconEdit, IconTrash,
  IconSearch, IconChevronRight, IconTag,
  IconBuilding, IconBriefcase, IconSitemap,
  IconCategory, IconList,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ItemTabla {
  id: string
  valor: string
  activo: boolean
}

interface Tabla {
  id: string
  nombre: string
  descripcion: string
  icono: typeof IconTag
  color: string
  items: ItemTabla[]
}

const TABLAS_INICIALES: Tabla[] = [
  {
    id: 'categorias',
    nombre: 'Categorías de documentos',
    descripcion: 'Opciones del desplegable de categorías en carga de documentos',
    icono: IconCategory,
    color: 'blue',
    items: [
      { id: '1', valor: 'Resoluciones', activo: true },
      { id: '2', valor: 'Normativas', activo: true },
      { id: '3', valor: 'Circulares', activo: true },
      { id: '4', valor: 'Decretos', activo: true },
      { id: '5', valor: 'Informes', activo: true },
    ],
  },
  {
    id: 'dependencias',
    nombre: 'Dependencias',
    descripcion: 'Opciones del desplegable de dependencias institucionales',
    icono: IconSitemap,
    color: 'teal',
    items: [
      { id: '1', valor: 'Administración', activo: true },
      { id: '2', valor: 'Legal', activo: true },
      { id: '3', valor: 'Finanzas', activo: true },
      { id: '4', valor: 'Recursos Humanos', activo: true },
      { id: '5', valor: 'Tecnología', activo: true },
    ],
  },
  {
    id: 'cargos',
    nombre: 'Cargos',
    descripcion: 'Opciones del desplegable de cargos en el perfil de usuario',
    icono: IconBriefcase,
    color: 'violet',
    items: [
      { id: '1', valor: 'Director', activo: true },
      { id: '2', valor: 'Coordinador', activo: true },
      { id: '3', valor: 'Analista', activo: true },
      { id: '4', valor: 'Técnico', activo: true },
      { id: '5', valor: 'Administrativo', activo: true },
    ],
  },
  {
    id: 'instituciones',
    nombre: 'Instituciones',
    descripcion: 'Opciones del desplegable de instituciones en el perfil de usuario',
    icono: IconBuilding,
    color: 'orange',
    items: [
      { id: '1', valor: 'Ministerio de Administración', activo: true },
      { id: '2', valor: 'Secretaría General', activo: true },
      { id: '3', valor: 'Dirección Nacional', activo: true },
    ],
  },
  {
    id: 'categorias_noticias',
    nombre: 'Categorías de noticias',
    descripcion: 'Opciones del desplegable de categorías en publicaciones',
    icono: IconTag,
    color: 'pink',
    items: [
      { id: '1', valor: 'Institucional', activo: true },
      { id: '2', valor: 'Normativa', activo: true },
      { id: '3', valor: 'RRHH', activo: true },
      { id: '4', valor: 'Tecnología', activo: true },
      { id: '5', valor: 'Finanzas', activo: true },
    ],
  },
  {
    id: 'estados_documento',
    nombre: 'Estados de documento',
    descripcion: 'Estados posibles para los documentos cargados al sistema',
    icono: IconList,
    color: 'green',
    items: [
      { id: '1', valor: 'Procesado', activo: true },
      { id: '2', valor: 'Pendiente', activo: true },
      { id: '3', valor: 'Error', activo: true },
    ],
  },
]

export default function AdminTablasPage() {
  const [tablas, setTablas] = useState<Tabla[]>(TABLAS_INICIALES)
  const [tablaActiva, setTablaActiva] = useState<Tabla>(TABLAS_INICIALES[0])
  const [busqueda, setBusqueda] = useState('')

  const [modalNuevoItem, { open: openNuevoItem, close: closeNuevoItem }] = useDisclosure(false)
  const [modalEditarItem, { open: openEditarItem, close: closeEditarItem }] = useDisclosure(false)
  const [modalEliminarItem, { open: openEliminarItem, close: closeEliminarItem }] = useDisclosure(false)
  const [modalNuevaTabla, { open: openNuevaTabla, close: closeNuevaTabla }] = useDisclosure(false)

  const [nuevoValor, setNuevoValor] = useState('')
  const [itemEditando, setItemEditando] = useState<ItemTabla | null>(null)
  const [itemEliminando, setItemEliminando] = useState<string | null>(null)
  const [nuevaTablaForm, setNuevaTablaForm] = useState({ nombre: '', descripcion: '' })

  const itemsFiltrados = tablaActiva.items.filter((i) =>
    i.valor.toLowerCase().includes(busqueda.toLowerCase())
  )

  const actualizarTabla = (tablaId: string, nuevosItems: ItemTabla[]) => {
    const actualizadas = tablas.map((t) =>
      t.id === tablaId ? { ...t, items: nuevosItems } : t
    )
    setTablas(actualizadas)
    setTablaActiva(actualizadas.find((t) => t.id === tablaId)!)
  }

  const handleAgregarItem = () => {
    if (!nuevoValor.trim()) return
    const nuevo: ItemTabla = { id: Date.now().toString(), valor: nuevoValor.trim(), activo: true }
    actualizarTabla(tablaActiva.id, [...tablaActiva.items, nuevo])
    setNuevoValor('')
    closeNuevoItem()
  }

  const handleGuardarEdicion = () => {
    if (!itemEditando) return
    actualizarTabla(
      tablaActiva.id,
      tablaActiva.items.map((i) => (i.id === itemEditando.id ? itemEditando : i))
    )
    closeEditarItem()
  }

  const handleEliminarItem = () => {
    if (!itemEliminando) return
    actualizarTabla(tablaActiva.id, tablaActiva.items.filter((i) => i.id !== itemEliminando))
    closeEliminarItem()
  }

  const handleToggleActivo = (itemId: string) => {
    actualizarTabla(
      tablaActiva.id,
      tablaActiva.items.map((i) => (i.id === itemId ? { ...i, activo: !i.activo } : i))
    )
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3}>Administrar tablas</Title>
            <Text c="dimmed" size="sm">
              Gestiona los valores de los desplegables usados en todo el sistema.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} radius="md" onClick={openNuevaTabla}>
            Nueva tabla
          </Button>
        </Group>

        <Grid>

          {/* Panel izquierdo — Lista de tablas */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder radius="md" p="sm">
              <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">
                Tablas disponibles
              </Text>
              <Divider mb="xs" />
              <Stack gap={2}>
                {tablas.map((tabla, i) => (
                  <motion.div
                    key={tabla.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink
                      label={
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="sm" lineClamp={1}>{tabla.nombre}</Text>
                          <Badge size="xs" variant="light" color={tabla.color}>
                            {tabla.items.length}
                          </Badge>
                        </Group>
                      }
                      leftSection={
                        <ThemeIcon size="sm" variant="light" color={tabla.color} radius="sm">
                          <tabla.icono size={12} />
                        </ThemeIcon>
                      }
                      rightSection={<IconChevronRight size={12} opacity={0.4} />}
                      active={tablaActiva.id === tabla.id}
                      onClick={() => { setTablaActiva(tabla); setBusqueda('') }}
                      style={{ cursor: 'pointer', borderRadius: 8 }}
                    />
                  </motion.div>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Panel derecho — CRUD de items */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder radius="md" p="xl">
              <Stack gap="md">

                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon size={36} radius="md" variant="light" color={tablaActiva.color}>
                      <tablaActiva.icono size={18} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600} size="sm">{tablaActiva.nombre}</Text>
                      <Text size="xs" c="dimmed">{tablaActiva.descripcion}</Text>
                    </div>
                  </Group>
                  <Button
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    radius="md"
                    onClick={() => { setNuevoValor(''); openNuevoItem() }}
                  >
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
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ display: 'table-row' }}
                        >
                          <Table.Td>
                            <Text size="xs" c="dimmed">{i + 1}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500}>{item.valor}</Text>
                          </Table.Td>
                          <Table.Td ta="center">
                            <Badge
                              size="sm"
                              variant="light"
                              color={item.activo ? 'green' : 'gray'}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleToggleActivo(item.id)}
                            >
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <ActionIcon
                                variant="subtle"
                                color="yellow"
                                size="sm"
                                onClick={() => { setItemEditando({ ...item }); openEditarItem() }}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => { setItemEliminando(item.id); openEliminarItem() }}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </Table.Tbody>
                </Table>

                {itemsFiltrados.length === 0 && (
                  <Stack align="center" py="xl" gap="xs">
                    <ThemeIcon size={40} variant="light" color="gray" radius="xl">
                      <IconTable size={20} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">No se encontraron valores</Text>
                  </Stack>
                )}

              </Stack>
            </Paper>
          </Grid.Col>

        </Grid>
      </motion.div>

      {/* Modal nuevo item */}
      <Modal
        opened={modalNuevoItem}
        onClose={closeNuevoItem}
        title={<Text fw={600} size="sm">Agregar valor a "{tablaActiva.nombre}"</Text>}
        radius="md"
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Valor"
            placeholder="Ej: Nueva categoría"
            value={nuevoValor}
            onChange={(e) => setNuevoValor(e.currentTarget.value)}
            radius="md"
            onKeyDown={(e) => e.key === 'Enter' && handleAgregarItem()}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeNuevoItem} radius="md">Cancelar</Button>
            <Button radius="md" onClick={handleAgregarItem} disabled={!nuevoValor.trim()}>
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal editar item */}
      <Modal
        opened={modalEditarItem}
        onClose={closeEditarItem}
        title={<Text fw={600} size="sm">Editar valor</Text>}
        radius="md"
        centered
        size="sm"
      >
        {itemEditando && (
          <Stack gap="md">
            <TextInput
              label="Valor"
              value={itemEditando.valor}
              onChange={(e) => setItemEditando({ ...itemEditando, valor: e.currentTarget.value })}
              radius="md"
              autoFocus
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeEditarItem} radius="md">Cancelar</Button>
              <Button radius="md" onClick={handleGuardarEdicion}>Guardar</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        opened={modalEliminarItem}
        onClose={closeEliminarItem}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="red" radius="sm">
              <IconTrash size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">Eliminar valor</Text>
          </Group>
        }
        radius="md"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            ¿Estás seguro de que deseas eliminar este valor? Los desplegables que lo usen quedarán sin esta opción.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeEliminarItem} radius="md">Cancelar</Button>
            <Button color="red" radius="md" onClick={handleEliminarItem}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal nueva tabla */}
      <Modal
        opened={modalNuevaTabla}
        onClose={closeNuevaTabla}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
              <IconTable size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">Nueva tabla</Text>
          </Group>
        }
        radius="md"
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre de la tabla"
            placeholder="Ej: Tipos de contrato"
            value={nuevaTablaForm.nombre}
            onChange={(e) => setNuevaTablaForm({ ...nuevaTablaForm, nombre: e.currentTarget.value })}
            radius="md"
          />
          <TextInput
            label="Descripción"
            placeholder="¿Dónde se usa este desplegable?"
            value={nuevaTablaForm.descripcion}
            onChange={(e) => setNuevaTablaForm({ ...nuevaTablaForm, descripcion: e.currentTarget.value })}
            radius="md"
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeNuevaTabla} radius="md">Cancelar</Button>
            <Button
              radius="md"
              disabled={!nuevaTablaForm.nombre.trim()}
              onClick={closeNuevaTabla}
            >
              Crear tabla
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
