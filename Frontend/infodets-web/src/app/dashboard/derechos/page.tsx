'use client'

import {
  Box, Title, Text, Paper, Table, Badge, Switch,
  Group, Avatar, Stack, LoadingOverlay, Tooltip, Button, TextInput,
} from '@mantine/core'
import { IconUser, IconDeviceFloppy, IconRefresh, IconSearch } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usuarioService, type Usuario } from '@/services/api/usuarioService'
import { permisoService } from '@/services/api/permisoService'

const PERMISOS_DISPONIBLES = [
  { key: 'consulta',       label: 'Consultas' },
  { key: 'perfil',         label: 'Perfil' },
  { key: 'documentacion',  label: 'Nueva documentación' },
  { key: 'noticias',       label: 'Noticias generales' },
  { key: 'dashboard',      label: 'Administrador' },
]

const ROL_COLORES: Record<string, string> = {
  admin: 'blue', operador: 'green', visor: 'gray',
}

export default function DerechosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [permisos, setPermisos] = useState<Record<string, Record<string, boolean>>>({})
  const [guardando, setGuardando] = useState<string | null>(null)
  const [modificados, setModificados] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')

  const filtrados = usuarios.filter((u) =>
    (u.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.apellido ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await usuarioService.listar()
        setUsuarios(data)
        const permisosIniciales: Record<string, Record<string, boolean>> = {}
        await Promise.all(data.map(async (u) => {
          try {
            permisosIniciales[u.id] = await permisoService.obtener(u.id)
          } catch {
            permisosIniciales[u.id] = {}
          }
        }))
        setPermisos(permisosIniciales)
      } catch {
        notifications.show({ color: 'red', message: 'Error al cargar usuarios' })
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const togglePermiso = (userId: string, key: string) => {
    setPermisos((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [key]: !prev[userId]?.[key] },
    }))
    setModificados((prev) => new Set(prev).add(userId))
  }

  const guardarPermisos = async (userId: string) => {
    setGuardando(userId)
    try {
      await permisoService.actualizar(userId, permisos[userId])
      setModificados((prev) => { const s = new Set(prev); s.delete(userId); return s })
      notifications.show({ color: 'green', message: 'Permisos guardados' })
      // Notificar al Sidebar para que recargue los permisos
      window.dispatchEvent(new CustomEvent('permisos-actualizados'))
    } catch {
      notifications.show({ color: 'red', message: 'Error al guardar permisos' })
    } finally {
      setGuardando(null)
    }
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Derechos de usuarios</Title>
        <Text c="dimmed" size="sm" mb="xl">Configura los accesos por usuario. Los cambios se guardan por fila.</Text>

        <Paper withBorder radius="md" p="xl" pos="relative" style={{ overflowX: 'auto' }}>
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
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={() => window.location.reload()}>
              Actualizar
            </Button>
          </Group>

          <Table highlightOnHover verticalSpacing="md" style={{ minWidth: 1000 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 200 }}>Usuario</Table.Th>
                <Table.Th>Rol</Table.Th>
                {PERMISOS_DISPONIBLES.map((p) => (
                  <Table.Th key={p.key} ta="center" style={{ minWidth: 90 }}>
                    <Text size="xs" fw={600}>{p.label}</Text>
                  </Table.Th>
                ))}
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtrados.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ display: 'table-row' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue">
                        <IconUser size={12} />
                      </Avatar>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{u.nombre ?? '—'} {u.apellido ?? ''}</Text>
                        <Text size="xs" c="dimmed">{u.email}</Text>
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ROL_COLORES[u.rol] ?? 'gray'} size="sm">
                      {u.rol}
                    </Badge>
                  </Table.Td>
                  {PERMISOS_DISPONIBLES.map((p) => (
                    <Table.Td key={p.key} ta="center">
                      <Tooltip label={permisos[u.id]?.[p.key] ? 'Habilitado' : 'Deshabilitado'} withArrow>
                        <Switch
                          checked={permisos[u.id]?.[p.key] ?? false}
                          onChange={() => togglePermiso(u.id, p.key)}
                          size="sm"
                          color="blue"
                        />
                      </Tooltip>
                    </Table.Td>
                  ))}
                  <Table.Td>
                    {modificados.has(u.id) && (
                      <Button
                        size="xs"
                        radius="md"
                        leftSection={<IconDeviceFloppy size={12} />}
                        loading={guardando === u.id}
                        onClick={() => guardarPermisos(u.id)}
                      >
                        Guardar
                      </Button>
                    )}
                  </Table.Td>
                </motion.tr>
              ))}
            </Table.Tbody>
          </Table>

          {!cargando && usuarios.length === 0 && (
            <Stack align="center" py="xl">
              <Text size="sm" c="dimmed">No hay usuarios registrados aún.</Text>
            </Stack>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
