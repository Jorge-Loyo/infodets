'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, ThemeIcon, Badge, Group,
  Avatar, Button, Modal, TextInput, Textarea, ColorSwatch, Switch,
  ActionIcon, Tooltip, LoadingOverlay, Divider, Select,
} from '@mantine/core'
import { IconUser, IconPlus, IconEdit, IconTrash, IconShieldCheck, IconRefresh } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { perfilService, type Perfil, type PerfilCrear } from '@/services/api/perfilService'
import { usuarioService, type Usuario } from '@/services/api/usuarioService'

const SECCIONES = [
  { key: 'consulta',      label: 'Consultas' },
  { key: 'perfil',        label: 'Perfil' },
  { key: 'documentacion', label: 'Nueva documentación' },
  { key: 'noticias',      label: 'Noticias generales' },
  { key: 'dashboard',     label: 'Administrador' },
]

const COLORES = ['blue', 'teal', 'green', 'violet', 'orange', 'red', 'gray']

const PERMISOS_VACIOS = Object.fromEntries(SECCIONES.map((s) => [s.key, false]))

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalAsignar, setModalAsignar] = useState<Perfil | null>(null)
  const [editando, setEditando] = useState<Perfil | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<PerfilCrear>({ nombre: '', descripcion: '', color: 'blue', rol: '', permisos: PERMISOS_VACIOS })

  const cargar = async () => {
    setCargando(true)
    try {
      const [p, u] = await Promise.all([perfilService.listar(), usuarioService.listar()])
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
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', color: p.color, rol: p.rol ?? '', permisos: { ...PERMISOS_VACIOS, ...p.permisos } })
    setModalPerfil(true)
  }

  const guardarPerfil = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      if (editando) {
        const actualizado = await perfilService.actualizar(editando.id, form)
        setPerfiles((prev) => prev.map((p) => p.id === actualizado.id ? actualizado : p))
        notifications.show({ color: 'green', message: 'Perfil actualizado' })
      } else {
        const nuevo = await perfilService.crear(form)
        setPerfiles((prev) => [...prev, nuevo])
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
    if (!confirm('¿Eliminar este perfil?')) return
    try {
      await perfilService.eliminar(id)
      setPerfiles((prev) => prev.filter((p) => p.id !== id))
      notifications.show({ color: 'green', message: 'Perfil eliminado' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar perfil' })
    }
  }

  const asignarPerfil = async (usuarioId: string, perfilId: string | null) => {
    try {
      await perfilService.asignarAUsuario(usuarioId, perfilId)
      notifications.show({ color: 'green', message: 'Perfil asignado' })
      cargar()
    } catch {
      notifications.show({ color: 'red', message: 'Error al asignar perfil' })
    }
  }

  const togglePermiso = (key: string) =>
    setForm((f) => ({ ...f, permisos: { ...f.permisos, [key]: !f.permisos[key] } }))

  return (
    <Box p={32} pos="relative">
      <LoadingOverlay visible={cargando} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <Title order={3}>Administración de perfiles</Title>
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>Actualizar</Button>
            <Button leftSection={<IconPlus size={16} />} radius="md" onClick={abrirNuevo}>Nuevo perfil</Button>
          </Group>
        </Group>
        <Text c="dimmed" size="sm" mb="xl">Gestiona los perfiles de acceso y asígnalos a usuarios.</Text>

        {perfiles.length === 0 && !cargando && (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl"><IconShieldCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No hay perfiles creados. Crea el primero.</Text>
            </Stack>
          </Paper>
        )}

        <Grid>
          {perfiles.map((perfil, i) => (
            <Grid.Col key={perfil.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}>
                <Paper withBorder p="xl" radius="md" h="100%">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <ThemeIcon size={44} radius="md" variant="light" color={perfil.color}>
                        <IconUser size={22} />
                      </ThemeIcon>
                      <Group gap={4}>
                        <Tooltip label="Asignar a usuarios" withArrow>
                          <ActionIcon variant="subtle" color="blue" onClick={() => setModalAsignar(perfil)}>
                            <IconUser size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <ActionIcon variant="subtle" color="gray" onClick={() => abrirEdicion(perfil)}>
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => eliminarPerfil(perfil.id)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Text fw={600}>{perfil.nombre}</Text>
                    {perfil.rol && (
                      <Badge variant="filled" color={perfil.color} size="sm">Rol: {perfil.rol}</Badge>
                    )}
                    {perfil.descripcion && <Text size="sm" c="dimmed">{perfil.descripcion}</Text>}

                    <Divider label="Permisos" labelPosition="left" />
                    <Stack gap={4}>
                      {SECCIONES.map((s) => (
                        <Group key={s.key} justify="space-between">
                          <Text size="xs" c="dimmed">{s.label}</Text>
                          <Badge size="xs" variant="light" color={perfil.permisos[s.key] ? 'green' : 'red'}>
                            {perfil.permisos[s.key] ? 'Sí' : 'No'}
                          </Badge>
                        </Group>
                      ))}
                    </Stack>

                    <Divider />
                    <Group gap="xs">
                      <Avatar.Group>
                        {Array.from({ length: Math.min(perfil.total_usuarios, 3) }).map((_, j) => (
                          <Avatar key={j} size="sm" radius="xl" color={perfil.color}>
                            <IconUser size={10} />
                          </Avatar>
                        ))}
                      </Avatar.Group>
                      <Badge variant="light" color={perfil.color} size="sm">
                        {perfil.total_usuarios} usuario{perfil.total_usuarios !== 1 ? 's' : ''}
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid.Col>
          ))}
        </Grid>
      </motion.div>

      {/* Modal crear/editar perfil */}
      <Modal opened={modalPerfil} onClose={() => setModalPerfil(false)} title={editando ? 'Editar perfil' : 'Nuevo perfil'} radius="md">
        <Stack gap="md">
          <TextInput label="Nombre" placeholder="Ej: Operador de campo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} radius="md" required />
          <Textarea label="Descripción" placeholder="Descripción del perfil" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} radius="md" />

          <Select
            label="Rol que otorga este perfil"
            placeholder="Selecciona un rol"
            value={form.rol ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, rol: v ?? '' }))}
            data={[
              { value: 'admin', label: 'Administrador' },
              { value: 'operador', label: 'Operador' },
              { value: 'visor', label: 'Visor' },
            ]}
            clearable
            radius="md"
          />

          <div>
            <Text size="sm" fw={500} mb={6}>Color</Text>
            <Group gap="xs">
              {COLORES.map((c) => (
                <ColorSwatch key={c} color={`var(--mantine-color-${c}-6)`} size={24} style={{ cursor: 'pointer', outline: form.color === c ? '2px solid var(--mantine-color-blue-6)' : 'none', outlineOffset: 2 }} onClick={() => setForm((f) => ({ ...f, color: c }))} />
              ))}
            </Group>
          </div>

          <Divider label="Permisos del menú" labelPosition="left" />
          <Stack gap="xs">
            {SECCIONES.map((s) => (
              <Group key={s.key} justify="space-between">
                <Text size="sm">{s.label}</Text>
                <Switch checked={form.permisos[s.key] ?? false} onChange={() => togglePermiso(s.key)} size="sm" color="blue" />
              </Group>
            ))}
          </Stack>

          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setModalPerfil(false)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarPerfil}>{editando ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal asignar perfil a usuarios */}
      <Modal opened={!!modalAsignar} onClose={() => setModalAsignar(null)} title={`Asignar perfil: ${modalAsignar?.nombre}`} radius="md" size="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Selecciona los usuarios que tendrán este perfil.</Text>
          {usuarios.map((u) => {
            const tieneEstePerfil = u.perfil_id === modalAsignar?.id
            return (
              <Group key={u.id} justify="space-between" p="xs" style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)' }}>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl" color="blue"><IconUser size={12} /></Avatar>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>{u.nombre ?? '—'} {u.apellido ?? ''}</Text>
                    <Text size="xs" c="dimmed">{u.email}</Text>
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
          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={() => setModalAsignar(null)}>Cerrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
