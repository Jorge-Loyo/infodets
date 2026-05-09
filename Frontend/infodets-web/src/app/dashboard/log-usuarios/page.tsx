'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, Table, LoadingOverlay, Select, Button, TextInput,
} from '@mantine/core'
import {
  IconActivity, IconRefresh, IconSearch,
  IconUserPlus, IconUserMinus, IconEdit, IconKey,
  IconShieldCheck, IconLock,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import axiosInstance from '@/lib/axiosInstance'

interface AuditLog {
  id: string
  accion: string
  entidad: string
  entidad_id?: string
  entidad_nombre?: string
  detalle?: string
  realizado_por_id?: string
  realizado_por_email?: string
  creado_en: string
}

const ACCION_CONFIG: Record<string, { label: string, color: string, icon: React.ElementType }> = {
  crear:             { label: 'Creación',          color: 'green',  icon: IconUserPlus },
  modificar:         { label: 'Modificación',       color: 'blue',   icon: IconEdit },
  eliminar:          { label: 'Eliminación',        color: 'red',    icon: IconUserMinus },
  deshabilitar:      { label: 'Deshabilitación',    color: 'orange', icon: IconUserMinus },
  cambiar_perfil:    { label: 'Cambio de perfil',   color: 'violet', icon: IconShieldCheck },
  cambiar_derechos:  { label: 'Cambio de derechos', color: 'grape',  icon: IconShieldCheck },
  blanquear_password:{ label: 'Blanqueo contraseña',color: 'yellow', icon: IconKey },
  cambiar_password:  { label: 'Cambio contraseña',  color: 'teal',   icon: IconLock },
}

const formatFecha = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LogUsuariosPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroAccion, setFiltroAccion] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const cargar = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtroAccion) params.append('accion', filtroAccion)
      const res = await axiosInstance.get<AuditLog[]>(`/audit?${params}`)
      setLogs(res.data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar el log' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [filtroAccion])

  const filtrados = logs.filter(l =>
    !busqueda ||
    l.entidad_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.realizado_por_email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.detalle?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Box p={{ base: 16, sm: 32 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <div>
            <Title order={3}>Log de Usuarios</Title>
            <Text c="dimmed" size="sm">Historial de movimientos y cambios sobre usuarios del sistema.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
            Actualizar
          </Button>
        </Group>

        {/* Filtros */}
        <Group mb="md" gap="sm">
          <Select
            placeholder="Filtrar por acción"
            clearable
            data={Object.entries(ACCION_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
            value={filtroAccion}
            onChange={setFiltroAccion}
            radius="md"
            w={220}
          />
          <TextInput
            placeholder="Buscar por usuario, email o detalle..."
            leftSection={<IconSearch size={16} />}
            value={busqueda}
            onChange={e => setBusqueda(e.currentTarget.value)}
            radius="md"
            style={{ flex: 1 }}
          />
        </Group>

        {/* Resumen */}
        <Group mb="md" gap="sm">
          {Object.entries(ACCION_CONFIG).map(([k, v]) => {
            const count = logs.filter(l => l.accion === k).length
            if (!count) return null
            return (
              <Badge key={k} color={v.color} variant="light" size="sm">
                {v.label}: {count}
              </Badge>
            )
          })}
        </Group>

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                <IconActivity size={24} />
              </ThemeIcon>
              <Text c="dimmed" size="sm">No hay registros de actividad.</Text>
            </Stack>
          )}

          {filtrados.length > 0 && (
            <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover verticalSpacing="sm" striped style={{ minWidth: 600 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha y hora</Table.Th>
                  <Table.Th>Acción</Table.Th>
                  <Table.Th>Usuario afectado</Table.Th>
                  <Table.Th>Detalle</Table.Th>
                  <Table.Th>Realizado por</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtrados.map((log, i) => {
                  const cfg = ACCION_CONFIG[log.accion] ?? { label: log.accion, color: 'gray', icon: IconActivity }
                  const Icono = cfg.icon
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ display: 'table-row' }}
                    >
                      <Table.Td>
                        <Text size="xs" c="dimmed">{formatFecha(log.creado_en)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          leftSection={<Icono size={11} />}
                          color={cfg.color}
                          variant="light"
                          size="sm"
                        >
                          {cfg.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{log.entidad_nombre ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" maw={300} lineClamp={2}>{log.detalle ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">{log.realizado_por_email ?? 'Sistema'}</Text>
                      </Table.Td>
                    </motion.tr>
                  )
                })}
              </Table.Tbody>
            </Table>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
