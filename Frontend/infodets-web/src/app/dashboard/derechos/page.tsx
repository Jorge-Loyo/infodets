'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, ThemeIcon, Badge, Group,
  Avatar, Button, Modal, TextInput, Textarea, ColorSwatch, Switch,
  ActionIcon, Tooltip, LoadingOverlay, Divider, Tabs, ScrollArea,
} from '@mantine/core'
import {
  IconUser, IconPlus, IconEdit, IconTrash, IconShieldCheck,
  IconRefresh, IconUsers, IconSettings,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { perfilService, type Perfil, type PerfilCrear } from '@/services/api/perfilService'
import { usuarioService, type Usuario } from '@/services/api/usuarioService'

const SECCIONES_FRONTEND = [
  { key: 'consulta',          label: 'ChatBot',              desc: 'Acceso al chat con IA',                        grupo: 'Menú' },
  { key: 'mis_consultas',     label: 'Mis consultas',        desc: 'Historial de conversaciones del usuario',       grupo: 'Menú' },
  { key: 'documentacion',     label: 'Documentación',        desc: 'Carga y visualización de documentos PDF',        grupo: 'Menú' },
  { key: 'noticias',          label: 'Noticias',             desc: 'Acceso a noticias institucionales',             grupo: 'Menú' },
  { key: 'configuracion',     label: 'Configuración',        desc: 'Perfil personal y soporte',                    grupo: 'Menú' },
  { key: 'configuracion_chat',label: 'Config. de Chat',      desc: 'Documentos, notificaciones e identidad del bot',grupo: 'Menú' },
  { key: 'dashboard',         label: 'Administrador',        desc: 'Panel administrativo del sistema',              grupo: 'Menú' },
]

const SECCIONES_BACKEND = [
  { key: 'gestionar_usuarios',   label: 'Gestionar usuarios',   desc: 'Crear, editar y eliminar usuarios',             grupo: 'Acciones' },
  { key: 'blanquear_password',   label: 'Blanquear contraseña', desc: 'Resetear contraseñas de usuarios en Cognito',    grupo: 'Acciones' },
  { key: 'gestionar_documentos', label: 'Gestionar documentos', desc: 'Subir, editar y eliminar documentos de la IA',  grupo: 'Acciones' },
  { key: 'gestionar_noticias',   label: 'Gestionar noticias',   desc: 'Crear, editar y publicar noticias',             grupo: 'Acciones' },
  { key: 'gestionar_tablas',     label: 'Gestionar tablas',     desc: 'Administrar valores de desplegables del sistema',grupo: 'Acciones' },
  { key: 'ver_validaciones',     label: 'Ver validaciones IA',  desc: 'Revisar y aprobar respuestas para entrenar la IA',grupo: 'Acciones' },
]

const TODAS_SECCIONES = [...SECCIONES_FRONTEND, ...SECCIONES_BACKEND]
const COLORES = ['blue', 'teal', 'green', 'violet', 'orange', 'red', 'gray']
const PERMISOS_VACIOS = Object.fromEntries(TODAS_SECCIONES.map(s => [s.key, false]))

import { useSessionStore } from '@/store/sessionStore'

const SUPER_ADMIN = 'Super Admin'
const ADMIN = 'Admin'

// Nivel jerárquico: mayor número = mayor nivel
function nivelPerfil(nombre: string): number {
  if (nombre === SUPER_ADMIN) return 3
  if (nombre === ADMIN) return 2
  return 1
}

export default function DerechosPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalAsignar, setModalAsignar] = useState<Perfil | null>(null)
  const [editando, setEditando] = useState<Perfil | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<PerfilCrear>({ nombre: '', descripcion: '', color: 'blue', permisos: PERMISOS_VACIOS })
  const { usuario } = useSessionStore()

  // Perfil del usuario logueado
  const miPerfil = perfiles.find(p => usuarios.find(u => u.id === usuario?.id)?.perfil_id === p.id)
  const miNivel = nivelPerfil(miPerfil?.nombre ?? '')

  const puedeEditar = (perfil: Perfil) => {
    if (perfil.nombre === SUPER_ADMIN) return false
    return nivelPerfil(perfil.nombre) < miNivel
  }

  const cargar = async () => {
    setCargando(true)
    try {
      const [p, u] = await Promise.all([perfilService.listar(), usuarioService.listar()])
      // Crear Super Admin si no existe
      if (!p.find(x => x.nombre === SUPER_ADMIN)) {
        const todoTrue = Object.fromEntries(TODAS_SECCIONES.map(s => [s.key, true]))
        try {
          const nuevo = await perfilService.crear({ nombre: SUPER_ADMIN, descripcion: 'Acceso total al sistema', color: 'violet', permisos: todoTrue })
          p.push(nuevo)
        } catch {
          // Ya existe (race condition), recargar lista
          const recargados = await perfilService.listar()
          setPerfiles(recargados)
          setUsuarios(u)
          return
        }
      }
      setPerfiles(p)
      setUsuarios(u)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar datos' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', color: 'blue', permisos: PERMISOS_VACIOS })
    setModalPerfil(true)
  }

  const abrirEdicion = (p: Perfil) => {
    setEditando(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', color: p.color, permisos: { ...PERMISOS_VACIOS, ...p.permisos } })
    setModalPerfil(true)
  }

  const guardarPerfil = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      if (editando) {
        const actualizado = await perfilService.actualizar(editando.id, form)
        setPerfiles(prev => prev.map(p => p.id === actualizado.id ? actualizado : p))
        notifications.show({ color: 'green', message: 'Perfil actualizado — permisos propagados a todos sus usuarios' })
      } else {
        const nuevo = await perfilService.crear(form)
        setPerfiles(prev => [...prev, nuevo])
        notifications.show({ color: 'green', message: 'Perfil creado' })
      }
      setModalPerfil(false)
    } catch {
      notifications.show({ color: 'red', message: 'Error al guardar perfil' })
    } finally {
      setGuardando(false)
    }
  }

  const eliminarPerfil = async (id: string) => {
    if (!confirm('¿Eliminar este perfil? Los usuarios asignados perderán sus permisos.')) return
    try {
      await perfilService.eliminar(id)
      setPerfiles(prev => prev.filter(p => p.id !== id))
      notifications.show({ color: 'green', message: 'Perfil eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar perfil' })
    }
  }

  const asignarPerfil = async (usuarioId: string, perfilId: string | null) => {
    try {
      await perfilService.asignarAUsuario(usuarioId, perfilId)
      notifications.show({ color: 'green', message: 'Perfil asignado — permisos actualizados' })
      cargar()
    } catch {
      notifications.show({ color: 'red', message: 'Error al asignar perfil' })
    }
  }

  const togglePermiso = (key: string) =>
    setForm(f => ({ ...f, permisos: { ...f.permisos, [key]: !f.permisos[key] } }))

  const activarTodos = (grupo: string) => {
    const keys = TODAS_SECCIONES.filter(s => s.grupo === grupo).map(s => s.key)
    setForm(f => ({ ...f, permisos: { ...f.permisos, ...Object.fromEntries(keys.map(k => [k, true])) } }))
  }

  const desactivarTodos = (grupo: string) => {
    const keys = TODAS_SECCIONES.filter(s => s.grupo === grupo).map(s => s.key)
    setForm(f => ({ ...f, permisos: { ...f.permisos, ...Object.fromEntries(keys.map(k => [k, false])) } }))
  }

  return (
    <Box p={32} pos="relative">
      <LoadingOverlay visible={cargando} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <Title order={3}>Derechos y perfiles</Title>
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>Actualizar</Button>
            <Button leftSection={<IconPlus size={16} />} radius="md" onClick={abrirNuevo}>Nuevo perfil</Button>
          </Group>
        </Group>
        <Text c="dimmed" size="sm" mb="xl">
          Cada perfil define qué secciones ve el usuario y qué acciones puede realizar. Al asignar un perfil, los permisos se aplican automáticamente.
        </Text>

        {perfiles.length === 0 && !cargando && (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl"><IconShieldCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No hay perfiles creados. Crea el primero.</Text>
            </Stack>
          </Paper>
        )}

        <Grid>
          {perfiles.map((perfil, i) => {
            const usuariosDelPerfil = usuarios.filter(u => u.perfil_id === perfil.id)
            const permisosActivos = Object.values(perfil.permisos ?? {}).filter(Boolean).length
            const totalPermisos = TODAS_SECCIONES.length
            return (
              <Grid.Col key={perfil.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}>
                  <Paper withBorder p="xl" radius="md" h="100%">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <ThemeIcon size={44} radius="md" variant="light" color={perfil.color}>
                          <IconShieldCheck size={22} />
                        </ThemeIcon>
                        <Group gap={4}>
                          <Tooltip label="Asignar a usuarios" withArrow>
                            <ActionIcon variant="subtle" color="blue" onClick={() => setModalAsignar(perfil)}>
                              <IconUsers size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={!puedeEditar(perfil) ? 'Sin permiso para editar este perfil' : 'Editar permisos'} withArrow>
                            <ActionIcon variant="subtle" color="gray" onClick={() => abrirEdicion(perfil)} disabled={!puedeEditar(perfil)}>
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon variant="subtle" color="red" onClick={() => eliminarPerfil(perfil.id)} disabled={!puedeEditar(perfil)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Text fw={600}>{perfil.nombre}</Text>
                      {perfil.descripcion && <Text size="sm" c="dimmed">{perfil.descripcion}</Text>}

                      <Group gap="xs">
                        <Badge variant="light" color={perfil.color} size="sm">
                          {permisosActivos}/{totalPermisos} permisos
                        </Badge>
                        <Badge variant="light" color="gray" size="sm">
                          {usuariosDelPerfil.length} usuario{usuariosDelPerfil.length !== 1 ? 's' : ''}
                        </Badge>
                      </Group>

                      <Divider label="Menú" labelPosition="left" />
                      <Grid>
                        {SECCIONES_FRONTEND.map(s => (
                          <Grid.Col key={s.key} span={6}>
                            <Badge size="xs" variant="dot" color={perfil.permisos?.[s.key] ? 'green' : 'red'}>
                              {s.label}
                            </Badge>
                          </Grid.Col>
                        ))}
                      </Grid>

                      <Divider label="Acciones" labelPosition="left" />
                      <Grid>
                        {SECCIONES_BACKEND.map(s => (
                          <Grid.Col key={s.key} span={6}>
                            <Badge size="xs" variant="dot" color={perfil.permisos?.[s.key] ? 'green' : 'red'}>
                              {s.label}
                            </Badge>
                          </Grid.Col>
                        ))}
                      </Grid>

                      {usuariosDelPerfil.length > 0 && (
                        <>
                          <Divider />
                          <Avatar.Group>
                            {usuariosDelPerfil.slice(0, 4).map(u => (
                              <Tooltip key={u.id} label={`${u.nombre ?? ''} ${u.apellido ?? ''} (${u.email})`} withArrow>
                                <Avatar size="sm" radius="xl" color={perfil.color}>
                                  <IconUser size={10} />
                                </Avatar>
                              </Tooltip>
                            ))}
                            {usuariosDelPerfil.length > 4 && (
                              <Avatar size="sm" radius="xl" color="gray">+{usuariosDelPerfil.length - 4}</Avatar>
                            )}
                          </Avatar.Group>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </motion.div>
              </Grid.Col>
            )
          })}
        </Grid>
      </motion.div>

      {/* Modal crear/editar perfil */}
      <Modal opened={modalPerfil} onClose={() => setModalPerfil(false)} title={editando ? `Editar: ${editando.nombre}` : 'Nuevo perfil'} radius="md" size="lg">
        <Stack gap="md">
          <Grid>
            <Grid.Col span={8}>
              <TextInput label="Nombre del perfil" placeholder="Ej: Operador de campo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} radius="md" required />
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="sm" fw={500} mb={6}>Color</Text>
              <Group gap="xs">
                {COLORES.map(c => (
                  <ColorSwatch key={c} color={`var(--mantine-color-${c}-6)`} size={22} style={{ cursor: 'pointer', outline: form.color === c ? '2px solid var(--mantine-color-blue-6)' : 'none', outlineOffset: 2 }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </Group>
            </Grid.Col>
          </Grid>
          <Textarea label="Descripción (opcional)" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} radius="md" />

          <Tabs defaultValue="menu">
            <Tabs.List>
              <Tabs.Tab value="menu" leftSection={<IconSettings size={14} />}>Menú visible</Tabs.Tab>
              <Tabs.Tab value="acciones" leftSection={<IconShieldCheck size={14} />}>Acciones permitidas</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="menu" pt="md">
              <Group justify="flex-end" mb="xs" gap="xs">
                <Button size="xs" variant="subtle" onClick={() => activarTodos('Menú')}>Activar todos</Button>
                <Button size="xs" variant="subtle" color="red" onClick={() => desactivarTodos('Menú')}>Desactivar todos</Button>
              </Group>
              <Stack gap="xs">
                {SECCIONES_FRONTEND.map(s => (
                  <Group key={s.key} justify="space-between" p="sm" style={{ borderRadius: 8, background: form.permisos[s.key] ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-default-hover)', border: `1px solid ${form.permisos[s.key] ? 'var(--mantine-color-blue-2)' : 'transparent'}` }}>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>{s.label}</Text>
                      <Text size="xs" c="dimmed">{s.desc}</Text>
                    </Stack>
                    <Switch checked={form.permisos[s.key] ?? false} onChange={() => togglePermiso(s.key)} size="sm" color="blue" />
                  </Group>
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="acciones" pt="md">
              <Group justify="flex-end" mb="xs" gap="xs">
                <Button size="xs" variant="subtle" onClick={() => activarTodos('Acciones')}>Activar todos</Button>
                <Button size="xs" variant="subtle" color="red" onClick={() => desactivarTodos('Acciones')}>Desactivar todos</Button>
              </Group>
              <Stack gap="xs">
                {SECCIONES_BACKEND.map(s => (
                  <Group key={s.key} justify="space-between" p="sm" style={{ borderRadius: 8, background: form.permisos[s.key] ? 'var(--mantine-color-teal-0)' : 'var(--mantine-color-default-hover)', border: `1px solid ${form.permisos[s.key] ? 'var(--mantine-color-teal-2)' : 'transparent'}` }}>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>{s.label}</Text>
                      <Text size="xs" c="dimmed">{s.desc}</Text>
                    </Stack>
                    <Switch checked={form.permisos[s.key] ?? false} onChange={() => togglePermiso(s.key)} size="sm" color="teal" />
                  </Group>
                ))}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setModalPerfil(false)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarPerfil} disabled={!form.nombre.trim()}>
              {editando ? 'Guardar cambios' : 'Crear perfil'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal asignar usuarios */}
      <Modal opened={!!modalAsignar} onClose={() => setModalAsignar(null)} title={`Asignar perfil: ${modalAsignar?.nombre}`} radius="md" size="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Al asignar este perfil, los permisos se aplican automáticamente al usuario.
          </Text>
          <ScrollArea h={400}>
            <Stack gap="xs">
              {usuarios.map(u => {
                const tieneEstePerfil = u.perfil_id === modalAsignar?.id
                const perfilActual = perfiles.find(p => p.id === u.perfil_id)
                return (
                  <Group key={u.id} justify="space-between" p="sm" style={{ borderRadius: 8, background: tieneEstePerfil ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-default-hover)' }}>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color={tieneEstePerfil ? modalAsignar?.color : 'gray'}>
                        <IconUser size={12} />
                      </Avatar>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{u.nombre ?? '—'} {u.apellido ?? ''}</Text>
                        <Group gap={4}>
                          <Text size="xs" c="dimmed">{u.email}</Text>
                          {perfilActual && !tieneEstePerfil && (
                            <Badge size="xs" variant="light" color={perfilActual.color}>{perfilActual.nombre}</Badge>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                    <Switch
                      checked={tieneEstePerfil}
                      onChange={() => asignarPerfil(u.id, tieneEstePerfil ? null : modalAsignar!.id)}
                      size="sm"
                      color="blue"
                    />
                  </Group>
                )
              })}
            </Stack>
          </ScrollArea>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalAsignar(null)}>Cerrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
