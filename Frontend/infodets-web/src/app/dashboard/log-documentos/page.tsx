'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, Table, LoadingOverlay, Button, TextInput,
  Modal, Divider,
} from '@mantine/core'
import {
  IconFileText, IconRefresh, IconSearch,
  IconUpload, IconTrash, IconFileCheck, IconEdit,
  IconInfoCircle, IconUser, IconCalendar, IconFileDescription,
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
  cargar:   { label: 'Carga',        color: 'green', icon: IconUpload },
  modificar:{ label: 'Modificación', color: 'blue',  icon: IconEdit },
  eliminar: { label: 'Eliminación',  color: 'red',   icon: IconTrash },
}

const formatFecha = (iso: string) =>
  new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function LogDocumentosPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<AuditLog | null>(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await axiosInstance.get<AuditLog[]>('/audit?entidad=documento&limite=500')
      setLogs(res.data)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar el log' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = logs.filter(l =>
    !busqueda ||
    l.entidad_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.realizado_por_email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.detalle?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalCargas = logs.filter(l => l.accion === 'cargar').length
  const totalModificaciones = logs.filter(l => l.accion === 'modificar').length
  const totalEliminaciones = logs.filter(l => l.accion === 'eliminar').length

  // Parsear detalle en líneas para el modal
  const parsearDetalle = (det?: string) => {
    if (!det) return []
    return det.split(' | ').map(linea => {
      const partes = linea.split(': ')
      const campo = partes[0]
      const valor = partes.slice(1).join(': ')
      return { campo, valor }
    })
  }

  return (
    <Box p={{ base: 16, sm: 32 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <div>
            <Title order={3}>Log de Documentos</Title>
            <Text c="dimmed" size="sm">Historial de cargas, modificaciones y eliminaciones de documentos en la IA.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
            Actualizar
          </Button>
        </Group>

        <Group mb="md" gap="sm">
          <Badge leftSection={<IconUpload size={11} />} color="green" variant="light" size="sm">Cargas: {totalCargas}</Badge>
          <Badge leftSection={<IconEdit size={11} />} color="blue" variant="light" size="sm">Modificaciones: {totalModificaciones}</Badge>
          <Badge leftSection={<IconTrash size={11} />} color="red" variant="light" size="sm">Eliminaciones: {totalEliminaciones}</Badge>
          <Badge leftSection={<IconFileCheck size={11} />} color="gray" variant="light" size="sm">Total: {logs.length}</Badge>
        </Group>

        <TextInput
          placeholder="Buscar por título, usuario o detalle..."
          leftSection={<IconSearch size={16} />}
          value={busqueda}
          onChange={e => setBusqueda(e.currentTarget.value)}
          radius="md" mb="md"
        />

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl"><IconFileText size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No hay registros de actividad sobre documentos.</Text>
            </Stack>
          )}

          {filtrados.length > 0 && (
            <Box style={{ overflowX: 'auto' }}>
              <Table highlightOnHover verticalSpacing="sm" striped style={{ minWidth: 600 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha y hora</Table.Th>
                    <Table.Th>Acción</Table.Th>
                    <Table.Th>Documento</Table.Th>
                    <Table.Th>Detalle</Table.Th>
                    <Table.Th>Realizado por</Table.Th>
                    <Table.Th w={40} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtrados.map((log, i) => {
                    const cfg = ACCION_CONFIG[log.accion] ?? { label: log.accion, color: 'gray', icon: IconFileText }
                    const Icono = cfg.icon
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} style={{ display: 'table-row' }}>
                        <Table.Td><Text size="xs" c="dimmed">{formatFecha(log.creado_en)}</Text></Table.Td>
                        <Table.Td>
                          <Badge leftSection={<Icono size={11} />} color={cfg.color} variant="light" size="sm">{cfg.label}</Badge>
                        </Table.Td>
                        <Table.Td><Text size="sm" fw={500} maw={180} lineClamp={1}>{log.entidad_nombre ?? '—'}</Text></Table.Td>
                        <Table.Td><Text size="xs" c="dimmed" maw={250} lineClamp={1}>{log.detalle ?? '—'}</Text></Table.Td>
                        <Table.Td><Text size="xs" c="dimmed">{log.realizado_por_email ?? 'Sistema'}</Text></Table.Td>
                        <Table.Td>
                          <Button size="compact-xs" variant="subtle" color="blue" onClick={() => setDetalle(log)}>
                            <IconInfoCircle size={14} />
                          </Button>
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

      {/* Modal informe del cambio */}
      <Modal
        opened={!!detalle}
        onClose={() => setDetalle(null)}
        title="Informe del cambio"
        radius="md"
        size="md"
      >
        {detalle && (() => {
          const cfg = ACCION_CONFIG[detalle.accion] ?? { label: detalle.accion, color: 'gray', icon: IconFileText }
          const Icono = cfg.icon
          const lineas = parsearDetalle(detalle.detalle)
          return (
            <Stack gap="md">
              {/* Encabezado */}
              <Paper withBorder p="md" radius="md" bg={`${cfg.color}.0`}>
                <Group gap="sm">
                  <ThemeIcon size={40} radius="md" variant="light" color={cfg.color}>
                    <Icono size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="sm">{cfg.label}</Text>
                    <Badge color={cfg.color} variant="filled" size="xs">{detalle.accion}</Badge>
                  </div>
                </Group>
              </Paper>

              <Divider label="Información del documento" labelPosition="left" />

              <Group gap="xs">
                <ThemeIcon size={24} radius="sm" variant="light" color="blue"><IconFileDescription size={14} /></ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Documento</Text>
                  <Text size="sm" fw={600}>{detalle.entidad_nombre ?? '—'}</Text>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={24} radius="sm" variant="light" color="gray"><IconCalendar size={14} /></ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Fecha y hora</Text>
                  <Text size="sm" fw={500}>{formatFecha(detalle.creado_en)}</Text>
                </div>
              </Group>

              <Group gap="xs">
                <ThemeIcon size={24} radius="sm" variant="light" color="gray"><IconUser size={14} /></ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Realizado por</Text>
                  <Text size="sm" fw={500}>{detalle.realizado_por_email ?? 'Sistema'}</Text>
                </div>
              </Group>

              {lineas.length > 0 && (
                <>
                  <Divider label="Cambios realizados" labelPosition="left" />
                  <Stack gap="xs">
                    {lineas.map((l, i) => (
                      <Paper key={i} withBorder p="sm" radius="md">
                        <Text size="xs" c="dimmed" mb={2}>{l.campo}</Text>
                        <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>{l.valor}</Text>
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}

              {(!lineas.length && detalle.detalle) && (
                <>
                  <Divider label="Detalle" labelPosition="left" />
                  <Paper withBorder p="sm" radius="md">
                    <Text size="sm">{detalle.detalle}</Text>
                  </Paper>
                </>
              )}

              <Group justify="flex-end">
                <Button variant="light" onClick={() => setDetalle(null)}>Cerrar</Button>
              </Group>
            </Stack>
          )
        })()}
      </Modal>
    </Box>
  )
}
