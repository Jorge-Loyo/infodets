'use client'

import {
  Box, Title, Text, Paper, Group, TextInput, Button,
  Table, Badge, ActionIcon, Stack, ThemeIcon, Avatar,
  Modal, Select, LoadingOverlay, Divider, Grid,
} from '@mantine/core'
import {
  IconSearch, IconEdit, IconTrash, IconUser, IconRefresh, IconPlus,
  IconMail, IconId, IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usuarioService, type Usuario, type UsuarioActualizar } from '@/services/api/usuarioService'
import { perfilService, type Perfil } from '@/services/api/perfilService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import axiosInstance from '@/lib/axiosInstance'

interface UsuarioNuevo {
  email: string
  nombre: string
  apellido: string
  rol: string
  dni: string
  fecha_nacimiento: string
  cargo: string
  institucion: string
  dependencia: string
  perfil_id: string
}

const NUEVO_VACIO: UsuarioNuevo = {
  email: '', nombre: '', apellido: '', rol: 'operador',
  dni: '', fecha_nacimiento: '', cargo: '', institucion: '', dependencia: '', perfil_id: '',
}

const ROL_COLORES: Record<string, string> = {
  admin: 'blue', operador: 'green', visor: 'gray',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<UsuarioActualizar>({})
  const [guardando, setGuardando] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState<UsuarioNuevo>(NUEVO_VACIO)
  const [creando, setCreando] = useState(false)

  const opcionesInstituciones = useTablaOpciones('instituciones')
  const opcionesCargos = useTablaOpciones('cargos')
  const opcionesDependencias = useTablaOpciones('dependencias')

  const opcionesPerfiles = perfiles.map((p) => ({ value: p.id, label: p.nombre }))
  const opcionesRol = [
    { value: 'admin', label: 'Administrador' },
    { value: 'operador', label: 'Operador' },
    { value: 'visor', label: 'Visor' },
  ]

  const cargar = async () => {
    setCargando(true)
    try {
      const [u, p] = await Promise.all([usuarioService.listar(), perfilService.listar()])
      setUsuarios(u)
      setPerfiles(p)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar datos' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = usuarios.filter((u) =>
    (u.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.apellido ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const crearUsuario = async () => {
    if (!nuevoUsuario.email.trim()) {
      notifications.show({ color: 'orange', message: 'El email es obligatorio' })
      return
    }
    setCreando(true)
    try {
      const payload: Record<string, string> = { email: nuevoUsuario.email, rol: nuevoUsuario.rol }
      if (nuevoUsuario.nombre) payload.nombre = nuevoUsuario.nombre
      if (nuevoUsuario.apellido) payload.apellido = nuevoUsuario.apellido
      if (nuevoUsuario.dni) payload.dni = nuevoUsuario.dni
      if (nuevoUsuario.fecha_nacimiento) payload.fecha_nacimiento = nuevoUsuario.fecha_nacimiento
      if (nuevoUsuario.cargo) payload.cargo = nuevoUsuario.cargo
      if (nuevoUsuario.institucion) payload.institucion = nuevoUsuario.institucion
      if (nuevoUsuario.dependencia) payload.dependencia = nuevoUsuario.dependencia
      if (nuevoUsuario.perfil_id) payload.perfil_id = nuevoUsuario.perfil_id

      const res = await axiosInstance.post<Usuario>('/usuarios/invitar', payload)
      setUsuarios((prev) => [...prev, res.data])
      setModalNuevo(false)
      setNuevoUsuario(NUEVO_VACIO)
      notifications.show({ color: 'green', message: `Usuario creado. Se envió email de bienvenida a ${nuevoUsuario.email}` })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al crear usuario'
      notifications.show({ color: 'red', message: msg })
    } finally {
      setCreando(false)
    }
  }

  const abrirEdicion = (u: Usuario) => {
    setEditando(u)
    setDatosEdicion({
      nombre: u.nombre ?? '', apellido: u.apellido ?? '', email: u.email,
      dni: u.dni ?? '', fecha_nacimiento: u.fecha_nacimiento ?? '',
      cargo: u.cargo ?? '', institucion: u.institucion ?? '',
      dependencia: u.dependencia ?? '', rol: u.rol,
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

  const setEdit = (field: keyof UsuarioActualizar) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatosEdicion((d) => ({ ...d, [field]: e.target.value }))

  const setNuevo = (field: keyof UsuarioNuevo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNuevoUsuario((d) => ({ ...d, [field]: e.target.value }))

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
              radius="md" w={320}
            />
            <Group gap="sm">
              <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
                Actualizar
              </Button>
              <Button leftSection={<IconPlus size={16} />} radius="md" onClick={() => { setNuevoUsuario(NUEVO_VACIO); setModalNuevo(true) }}>
                Nuevo usuario
              </Button>
            </Group>
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
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ display: 'table-row' }}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue"><IconUser size={12} /></Avatar>
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
                    <Badge variant="light" color={ROL_COLORES[u.rol] ?? 'gray'} size="sm">{u.rol}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => abrirEdicion(u)}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarUsuario(u.id)}><IconTrash size={14} /></ActionIcon>
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

      {/* Modal nuevo usuario */}
      <Modal opened={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo usuario" radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Email" placeholder="correo@institución.gob" leftSection={<IconMail size={16} />} value={nuevoUsuario.email} onChange={setNuevo('email')} radius="md" required />

          <Divider label="Datos personales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Nombre" leftSection={<IconUser size={16} />} value={nuevoUsuario.nombre} onChange={setNuevo('nombre')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Apellido" leftSection={<IconUser size={16} />} value={nuevoUsuario.apellido} onChange={setNuevo('apellido')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="DNI" leftSection={<IconId size={16} />} value={nuevoUsuario.dni} onChange={setNuevo('dni')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Fecha de nacimiento" placeholder="DD/MM/AAAA" leftSection={<IconCalendar size={16} />} value={nuevoUsuario.fecha_nacimiento} onChange={setNuevo('fecha_nacimiento')} radius="md" />
            </Grid.Col>
          </Grid>

          <Divider label="Datos institucionales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <Select label="Cargo" leftSection={<IconBriefcase size={16} />} data={opcionesCargos} value={nuevoUsuario.cargo} onChange={(v) => setNuevoUsuario((d) => ({ ...d, cargo: v ?? '' }))} radius="md" clearable />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Institución" leftSection={<IconBuilding size={16} />} data={opcionesInstituciones} value={nuevoUsuario.institucion} onChange={(v) => setNuevoUsuario((d) => ({ ...d, institucion: v ?? '' }))} radius="md" clearable />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select label="Dependencia" leftSection={<IconSitemap size={16} />} data={opcionesDependencias} value={nuevoUsuario.dependencia} onChange={(v) => setNuevoUsuario((d) => ({ ...d, dependencia: v ?? '' }))} radius="md" clearable />
            </Grid.Col>
          </Grid>

          <Divider label="Acceso" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <Select label="Rol" value={nuevoUsuario.rol} onChange={(v) => setNuevoUsuario((d) => ({ ...d, rol: v ?? 'operador' }))} data={opcionesRol} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Perfil" placeholder="Sin perfil" value={nuevoUsuario.perfil_id || null} onChange={(v) => setNuevoUsuario((d) => ({ ...d, perfil_id: v ?? '' }))} data={opcionesPerfiles} radius="md" clearable />
            </Grid.Col>
          </Grid>

          <Text size="xs" c="dimmed">El usuario recibirá un email con el link para registrarse. Sus datos quedarán guardados y se vincularán automáticamente al hacer su primer login.</Text>

          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button loading={creando} onClick={crearUsuario} leftSection={<IconPlus size={16} />}>Crear usuario</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal edición */}
      <Modal opened={!!editando} onClose={() => setEditando(null)} title="Editar usuario" radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Email" leftSection={<IconMail size={16} />} value={datosEdicion.email ?? ''} onChange={setEdit('email')} radius="md" />

          <Divider label="Datos personales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Nombre" leftSection={<IconUser size={16} />} value={datosEdicion.nombre ?? ''} onChange={setEdit('nombre')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Apellido" leftSection={<IconUser size={16} />} value={datosEdicion.apellido ?? ''} onChange={setEdit('apellido')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="DNI" leftSection={<IconId size={16} />} value={datosEdicion.dni ?? ''} onChange={setEdit('dni')} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Fecha de nacimiento" leftSection={<IconCalendar size={16} />} value={datosEdicion.fecha_nacimiento ?? ''} onChange={setEdit('fecha_nacimiento')} radius="md" />
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
          <Select label="Rol" value={datosEdicion.rol ?? 'operador'} onChange={(v) => setDatosEdicion((d) => ({ ...d, rol: v ?? 'operador' }))} data={opcionesRol} radius="md" />

          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarEdicion}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
