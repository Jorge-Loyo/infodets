'use client'

import {
  Box, Title, Text, Paper, Group, TextInput, Button,
  Table, Badge, ActionIcon, Stack, ThemeIcon, Avatar,
  Modal, Select, LoadingOverlay, Divider, Grid, PasswordInput, Tooltip,
} from '@mantine/core'
import {
  IconSearch, IconEdit, IconTrash, IconUser, IconRefresh, IconPlus,
  IconMail, IconId, IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
  IconLock, IconKey, IconShieldCheck,
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
  dni: string
  fecha_nacimiento: string
  cargo: string
  institucion: string
  dependencia: string
  perfil_id: string
}

const NUEVO_VACIO: UsuarioNuevo = {
  email: '', nombre: '', apellido: '',
  dni: '', fecha_nacimiento: '', cargo: '', institucion: '', dependencia: '', perfil_id: '',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<UsuarioActualizar>({})
  const [perfilEdicion, setPerfilEdicion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState<UsuarioNuevo>(NUEVO_VACIO)
  const [creando, setCreando] = useState(false)
  const [defaultPassword, setDefaultPassword] = useState('Infodets2024!')
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [blanqueando, setBlanqueando] = useState<string | null>(null)
  const [modalBlanqueo, setModalBlanqueo] = useState<Usuario | null>(null)

  const opcionesInstituciones = useTablaOpciones('instituciones')
  const opcionesCargos = useTablaOpciones('cargos')
  const opcionesDependencias = useTablaOpciones('dependencias')
  const opcionesPerfiles = perfiles.map(p => ({ value: p.id, label: p.nombre }))

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

  useEffect(() => {
    cargar()
    axiosInstance.get<{ default_password: string }>('/usuarios/config/default-password')
      .then(res => setDefaultPassword(res.data.default_password))
      .catch(() => {})
  }, [])

  const filtrados = usuarios.filter(u =>
    (u.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.apellido ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const crearUsuario = async () => {
    if (!nuevoUsuario.email.trim()) {
      notifications.show({ color: 'orange', message: 'El email es obligatorio' })
      return
    }
    if (!nuevoUsuario.perfil_id) {
      notifications.show({ color: 'orange', message: 'Debes seleccionar un perfil' })
      return
    }
    setCreando(true)
    try {
      const payload: Record<string, string> = { email: nuevoUsuario.email }
      if (nuevoUsuario.nombre) payload.nombre = nuevoUsuario.nombre
      if (nuevoUsuario.apellido) payload.apellido = nuevoUsuario.apellido
      if (nuevoUsuario.dni) payload.dni = nuevoUsuario.dni
      if (nuevoUsuario.fecha_nacimiento) payload.fecha_nacimiento = nuevoUsuario.fecha_nacimiento
      if (nuevoUsuario.cargo) payload.cargo = nuevoUsuario.cargo
      if (nuevoUsuario.institucion) payload.institucion = nuevoUsuario.institucion
      if (nuevoUsuario.dependencia) payload.dependencia = nuevoUsuario.dependencia
      if (nuevoUsuario.perfil_id) payload.perfil_id = nuevoUsuario.perfil_id

      const res = await axiosInstance.post<Usuario>('/usuarios/invitar', payload)
      // Asignar perfil si se seleccionó
      if (nuevoUsuario.perfil_id) {
        await perfilService.asignarAUsuario(res.data.id, nuevoUsuario.perfil_id)
      }
      setUsuarios(prev => [...prev, res.data])
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
    setPerfilEdicion(u.perfil_id ?? null)
    setDatosEdicion({
      nombre: u.nombre ?? '', apellido: u.apellido ?? '', email: u.email,
      dni: u.dni ?? '', fecha_nacimiento: u.fecha_nacimiento ?? '',
      cargo: u.cargo ?? '', institucion: u.institucion ?? '', dependencia: u.dependencia ?? '',
    })
  }

  const guardarEdicion = async () => {
    if (!editando) return
    setGuardando(true)
    try {
      const actualizado = await usuarioService.actualizar(editando.id, datosEdicion)
      // Asignar perfil si cambió
      if (perfilEdicion !== (editando.perfil_id ?? null)) {
        await perfilService.asignarAUsuario(editando.id, perfilEdicion)
      }
      setUsuarios(prev => prev.map(u => u.id === actualizado.id ? { ...actualizado, perfil_id: perfilEdicion ?? undefined } : u))
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
      setUsuarios(prev => prev.filter(u => u.id !== id))
      notifications.show({ color: 'green', message: 'Usuario eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar usuario' })
    }
  }

  const guardarDefaultPassword = async () => {
    setGuardandoPassword(true)
    try {
      await axiosInstance.put('/usuarios/config/default-password', { password: defaultPassword })
      notifications.show({ color: 'green', message: 'Contraseña por defecto actualizada' })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al guardar'
      notifications.show({ color: 'red', message: msg })
    } finally {
      setGuardandoPassword(false)
    }
  }

  const blanquearPassword = async (id: string, email: string) => {
    setBlanqueando(id)
    try {
      await axiosInstance.post(`/usuarios/${id}/blanquear-password`)
      notifications.show({ color: 'green', message: `Contraseña blanqueada para ${email}` })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al blanquear'
      notifications.show({ color: 'red', message: msg })
    } finally {
      setBlanqueando(null)
      setModalBlanqueo(null)
    }
  }

  const setEdit = (field: keyof UsuarioActualizar) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatosEdicion(d => ({ ...d, [field]: e.target.value }))

  const setNuevo = (field: keyof UsuarioNuevo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNuevoUsuario(d => ({ ...d, [field]: e.target.value }))

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Administrar usuarios</Title>
        <Text c="dimmed" size="sm" mb="xl">Gestiona los usuarios registrados en el sistema.</Text>

        {/* Contraseña por defecto */}
        <Paper withBorder radius="md" p="md" mb="md" bg="blue.0">
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="blue"><IconKey size={14} /></ThemeIcon>
                <Text size="sm" fw={600}>Contraseña por defecto para blanqueo</Text>
              </Group>
              <Text size="xs" c="dimmed">Esta contraseña se asigna al blanquear la cuenta de un usuario en Cognito.</Text>
            </Stack>
            <Group gap="sm" align="flex-end">
              <PasswordInput value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} radius="md" w={220} size="sm" />
              <Button size="sm" radius="md" loading={guardandoPassword} onClick={guardarDefaultPassword} leftSection={<IconLock size={14} />}>Guardar</Button>
            </Group>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />
          <Group justify="space-between" mb="md">
            <TextInput placeholder="Buscar por nombre, apellido o email..." leftSection={<IconSearch size={16} />} value={busqueda} onChange={e => setBusqueda(e.currentTarget.value)} radius="md" w={320} />
            <Group gap="sm">
              <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>Actualizar</Button>
              <Button leftSection={<IconPlus size={16} />} radius="md" onClick={() => { setNuevoUsuario(NUEVO_VACIO); setModalNuevo(true) }}>Nuevo usuario</Button>
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
                <Table.Th>Perfil</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtrados.map((u, i) => {
                const perfil = perfiles.find(p => p.id === u.perfil_id)
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ display: 'table-row' }}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl" color={perfil?.color ?? 'gray'}><IconUser size={12} /></Avatar>
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
                      {perfil
                        ? <Badge variant="light" color={perfil.color} size="sm" leftSection={<IconShieldCheck size={10} />}>{perfil.nombre}</Badge>
                        : <Badge variant="light" color="gray" size="sm">Sin perfil</Badge>
                      }
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Blanquear contraseña">
                          <ActionIcon variant="subtle" color="orange" size="sm" loading={blanqueando === u.id} onClick={() => setModalBlanqueo(u)}><IconLock size={14} /></ActionIcon>
                        </Tooltip>
                        <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => abrirEdicion(u)}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => eliminarUsuario(u.id)}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </motion.tr>
                )
              })}
            </Table.Tbody>
          </Table>

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
              <Text size="sm" c="dimmed">{usuarios.length === 0 ? 'No hay usuarios registrados aún.' : 'No se encontraron usuarios'}</Text>
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
            <Grid.Col span={6}><TextInput label="Nombre" leftSection={<IconUser size={16} />} value={nuevoUsuario.nombre} onChange={setNuevo('nombre')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Apellido" leftSection={<IconUser size={16} />} value={nuevoUsuario.apellido} onChange={setNuevo('apellido')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="DNI" leftSection={<IconId size={16} />} value={nuevoUsuario.dni} onChange={setNuevo('dni')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Fecha de nacimiento" placeholder="DD/MM/AAAA" leftSection={<IconCalendar size={16} />} value={nuevoUsuario.fecha_nacimiento} onChange={setNuevo('fecha_nacimiento')} radius="md" /></Grid.Col>
          </Grid>
          <Divider label="Datos institucionales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}><Select label="Cargo" leftSection={<IconBriefcase size={16} />} data={opcionesCargos} value={nuevoUsuario.cargo} onChange={v => setNuevoUsuario(d => ({ ...d, cargo: v ?? '' }))} radius="md" clearable /></Grid.Col>
            <Grid.Col span={6}><Select label="Institución" leftSection={<IconBuilding size={16} />} data={opcionesInstituciones} value={nuevoUsuario.institucion} onChange={v => setNuevoUsuario(d => ({ ...d, institucion: v ?? '' }))} radius="md" clearable /></Grid.Col>
            <Grid.Col span={12}><Select label="Dependencia" leftSection={<IconSitemap size={16} />} data={opcionesDependencias} value={nuevoUsuario.dependencia} onChange={v => setNuevoUsuario(d => ({ ...d, dependencia: v ?? '' }))} radius="md" clearable /></Grid.Col>
          </Grid>
          <Divider label="Acceso" labelPosition="left" />
          <Select
            label="Perfil *"
            placeholder="Seleccioná un perfil (obligatorio)"
            leftSection={<IconShieldCheck size={16} />}
            data={opcionesPerfiles}
            value={nuevoUsuario.perfil_id || null}
            onChange={v => setNuevoUsuario(d => ({ ...d, perfil_id: v ?? '' }))}
            radius="md"
            required
            error={!nuevoUsuario.perfil_id ? 'Seleccioná un perfil' : null}
          />
          <Text size="xs" c="dimmed">El usuario recibirá un email con el link para registrarse. El perfil define sus permisos automáticamente.</Text>
          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button loading={creando} onClick={crearUsuario} leftSection={<IconPlus size={16} />} disabled={!nuevoUsuario.email.trim() || !nuevoUsuario.perfil_id}>Crear usuario</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal edición */}
      <Modal opened={!!editando} onClose={() => setEditando(null)} title="Editar usuario" radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Email" leftSection={<IconMail size={16} />} value={datosEdicion.email ?? ''} onChange={setEdit('email')} radius="md" />
          <Divider label="Datos personales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}><TextInput label="Nombre" leftSection={<IconUser size={16} />} value={datosEdicion.nombre ?? ''} onChange={setEdit('nombre')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Apellido" leftSection={<IconUser size={16} />} value={datosEdicion.apellido ?? ''} onChange={setEdit('apellido')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="DNI" leftSection={<IconId size={16} />} value={datosEdicion.dni ?? ''} onChange={setEdit('dni')} radius="md" /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Fecha de nacimiento" leftSection={<IconCalendar size={16} />} value={datosEdicion.fecha_nacimiento ?? ''} onChange={setEdit('fecha_nacimiento')} radius="md" /></Grid.Col>
          </Grid>
          <Divider label="Datos institucionales" labelPosition="left" />
          <Grid>
            <Grid.Col span={6}><Select label="Cargo" leftSection={<IconBriefcase size={16} />} data={opcionesCargos} value={datosEdicion.cargo ?? ''} onChange={v => setDatosEdicion(d => ({ ...d, cargo: v ?? '' }))} radius="md" /></Grid.Col>
            <Grid.Col span={6}><Select label="Institución" leftSection={<IconBuilding size={16} />} data={opcionesInstituciones} value={datosEdicion.institucion ?? ''} onChange={v => setDatosEdicion(d => ({ ...d, institucion: v ?? '' }))} radius="md" /></Grid.Col>
            <Grid.Col span={12}><Select label="Dependencia" leftSection={<IconSitemap size={16} />} data={opcionesDependencias} value={datosEdicion.dependencia ?? ''} onChange={v => setDatosEdicion(d => ({ ...d, dependencia: v ?? '' }))} radius="md" /></Grid.Col>
          </Grid>
          <Divider label="Acceso" labelPosition="left" />
          <Select label="Perfil" placeholder="Sin perfil" leftSection={<IconShieldCheck size={16} />} data={opcionesPerfiles} value={perfilEdicion} onChange={v => setPerfilEdicion(v)} radius="md" clearable />
          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarEdicion}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal blanqueo */}
      <Modal opened={!!modalBlanqueo} onClose={() => setModalBlanqueo(null)} title="Blanquear contraseña" radius="md" size="sm" centered>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" radius="xl"><IconLock size={16} /></ThemeIcon>
            <Text size="sm">Se blanqueará la contraseña de:</Text>
          </Group>
          <Paper withBorder p="sm" radius="md" bg="orange.0">
            <Stack gap={4}>
              <Text size="sm" fw={600}>{modalBlanqueo?.nombre} {modalBlanqueo?.apellido}</Text>
              <Text size="xs" c="dimmed">{modalBlanqueo?.email}</Text>
            </Stack>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Group gap="xs">
              <Text size="xs" c="dimmed">Nueva contraseña:</Text>
              <Text size="sm" fw={600} ff="monospace">{defaultPassword}</Text>
            </Group>
          </Paper>
          <Text size="xs" c="dimmed">El usuario deberá usar esta contraseña para su próximo inicio de sesión.</Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="light" onClick={() => setModalBlanqueo(null)}>Cancelar</Button>
            <Button color="orange" loading={blanqueando === modalBlanqueo?.id} leftSection={<IconLock size={14} />} onClick={() => modalBlanqueo && blanquearPassword(modalBlanqueo.id, modalBlanqueo.email)}>
              Confirmar blanqueo
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
