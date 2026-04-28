'use client'

import {
  Box, Title, Text, Paper, Group, TextInput, Button,
  Table, Badge, ActionIcon, Stack, ThemeIcon, Avatar,
  Modal, Select, LoadingOverlay, Divider, Grid,
} from '@mantine/core'
import {
  IconSearch, IconEdit, IconTrash, IconUser, IconRefresh,
  IconMail, IconId, IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usuarioService, type Usuario, type UsuarioActualizar } from '@/services/api/usuarioService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'

const ROL_COLORES: Record<string, string> = {
  admin: 'blue',
  operador: 'green',
  visor: 'gray',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<UsuarioActualizar>({})
  const [guardando, setGuardando] = useState(false)
  const [detalle, setDetalle] = useState<Usuario | null>(null)

  const opcionesInstituciones = useTablaOpciones('instituciones')
  const opcionesCargos = useTablaOpciones('cargos')
  const opcionesDependencias = useTablaOpciones('dependencias')

  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const data = await usuarioService.listar()
      setUsuarios(data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar usuarios' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarUsuarios() }, [])

  const filtrados = usuarios.filter((u) =>
    (u.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.apellido ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirEdicion = (u: Usuario) => {
    setEditando(u)
    setDatosEdicion({
      nombre: u.nombre ?? '',
      apellido: u.apellido ?? '',
      email: u.email,
      dni: u.dni ?? '',
      fecha_nacimiento: u.fecha_nacimiento ?? '',
      cargo: u.cargo ?? '',
      institucion: u.institucion ?? '',
      dependencia: u.dependencia ?? '',
      rol: u.rol,
    })
  }

  const guardarEdicion = async () => {
    if (!editando) return
    setGuardando(true)
    try {
      const actualizado = await usuarioService.actualizar(editando.id, datosEdicion)
      setUsuarios((prev) => prev.map((u) => u.id === actualizado.id ? actualizado : u))
      notifications.show({ color: 'green', message: 'Usuario actualizado' })
      setEditando(null)
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar usuario' })
    } finally {
      setGuardando(false)
    }
  }

  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await usuarioService.eliminar(id)
      setUsuarios((prev) => prev.filter((u) => u.id !== id))
      notifications.show({ color: 'green', message: 'Usuario eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar usuario' })
    }
  }

  const set = (field: keyof UsuarioActualizar) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatosEdicion((d) => ({ ...d, [field]: e.currentTarget.value }))

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Administrar usuarios</Title>
        <Text c="dimmed" size="sm" mb="xl">Gestiona los usuarios registrados en el sistema.</Text>

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          <Group justify="space-between" mb="md">
            <TextInput
              placeholder="Buscar por nombre, apellido o email..."
              leftSection={<IconSearch size={16} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.currentTarget.value)}
              radius="md"
              w={320}
            />
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargarUsuarios}>
              Actualizar
            </Button>
          </Group>

          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>DNI</Table.Th>
                <Table.Th>Cargo</Table.Th>
                <Table.Th>Institución</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtrados.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: 'table-row' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue">
                        <IconUser size={12} />
                      </Avatar>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{u.nombre ?? '—'} {u.apellido ?? ''}</Text>
                        {u.fecha_nacimiento && <Text size="xs" c="dimmed">{u.fecha_nacimiento}</Text>}
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.email || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.dni || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.cargo || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{u.institucion || '—'}</Text>
                      {u.dependencia && <Text size="xs" c="dimmed">{u.dependencia}</Text>}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ROL_COLORES[u.rol] ?? 'gray'} size="sm">
                      {u.rol}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => abrirEdicion(u)}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarUsuario(u.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </motion.tr>
              ))}
            </Table.Tbody>
          </Table>

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
              <Text size="sm" c="dimmed">
                {usuarios.length === 0 ? 'No hay usuarios registrados aún.' : 'No se encontraron usuarios'}
              </Text>
            </Stack>
          )}
        </Paper>
      </motion.div>

      {/* Modal de edición */}
      <Modal opened={!!editando} onClose={() => setEditando(null)} title="Editar usuario" radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Email" leftSection={<IconMail size={16} />} value={datosEdicion.email ?? ''} onChange={set('email')} radius="md" />

          <Divider label="Datos personales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Nombre" leftSection={<IconUser size={16} />} value={datosEdicion.nombre ?? ''} onChange={set('nombre')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Apellido" leftSection={<IconUser size={16} />} value={datosEdicion.apellido ?? ''} onChange={set('apellido')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="DNI" leftSection={<IconId size={16} />} value={datosEdicion.dni ?? ''} onChange={set('dni')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Fecha de nacimiento" leftSection={<IconCalendar size={16} />} value={datosEdicion.fecha_nacimiento ?? ''} onChange={set('fecha_nacimiento')} radius="md" />
            </Grid.Col>
          </Grid>

          <Divider label="Datos institucionales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <Select label="Cargo" leftSection={<IconBriefcase size={16} />} data={opcionesCargos} value={datosEdicion.cargo ?? ''} onChange={(v) => setDatosEdicion((d) => ({ ...d, cargo: v ?? '' }))} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Institución" leftSection={<IconBuilding size={16} />} data={opcionesInstituciones} value={datosEdicion.institucion ?? ''} onChange={(v) => setDatosEdicion((d) => ({ ...d, institucion: v ?? '' }))} radius="md" />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select label="Dependencia" leftSection={<IconSitemap size={16} />} data={opcionesDependencias} value={datosEdicion.dependencia ?? ''} onChange={(v) => setDatosEdicion((d) => ({ ...d, dependencia: v ?? '' }))} radius="md" />
            </Grid.Col>
          </Grid>

          <Divider label="Acceso" labelPosition="left" />
          <Select
            label="Rol"
            value={datosEdicion.rol ?? 'operador'}
            onChange={(v) => setDatosEdicion((d) => ({ ...d, rol: v ?? 'operador' }))}
            data={[
              { value: 'admin', label: 'Administrador' },
              { value: 'operador', label: 'Operador' },
              { value: 'visor', label: 'Visor' },
            ]}
            radius="md"
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarEdicion}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
