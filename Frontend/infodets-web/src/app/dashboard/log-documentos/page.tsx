'use client'

import {
  Box, Title, Text, Paper, Stack, Group, ThemeIcon,
  Badge, Table, LoadingOverlay, Button, TextInput,
} from '@mantine/core'
import {
  IconFileText, IconRefresh, IconSearch,
  IconUpload, IconTrash, IconFileCheck,
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
  cargar:  { label: 'Carga',      color: 'green', icon: IconUpload },
  eliminar:{ label: 'Eliminación',color: 'red',   icon: IconTrash },
}

const formatFecha = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LogDocumentosPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

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
  const totalEliminaciones = logs.filter(l => l.accion === 'eliminar').length

  return (
    <Box p={{ base: 16, sm: 32 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <div>
            <Title order={3}>Log de Documentos</Title>
            <Text c="dimmed" size="sm">Historial de cargas y eliminaciones de documentos en la IA.</Text>
          </div>
          <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>
            Actualizar
          </Button>
        </Group>

        {/* Resumen */}
        <Group mb="md" gap="sm">
          <Badge leftSection={<IconUpload size={11} />} color="green" variant="light" size="sm">
            Cargas: {totalCargas}
          </Badge>
          <Badge leftSection={<IconTrash size={11} />} color="red" variant="light" size="sm">
            Eliminaciones: {totalEliminaciones}
          </Badge>
          <Badge leftSection={<IconFileCheck size={11} />} color="blue" variant="light" size="sm">
            Total: {logs.length}
          </Badge>
        </Group>

        {/* Filtro */}
        <TextInput
          placeholder="Buscar por título, usuario o detalle..."
          leftSection={<IconSearch size={16} />}
          value={busqueda}
          onChange={e => setBusqueda(e.currentTarget.value)}
          radius="md"
          mb="md"
        />

        <Paper withBorder radius="md" p="xl" pos="relative">
          <LoadingOverlay visible={cargando} />

          {!cargando && filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                <IconFileText size={24} />
              </ThemeIcon>
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
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtrados.map((log, i) => {
                  const cfg = ACCION_CONFIG[log.accion] ?? { label: log.accion, color: 'gray', icon: IconFileText }
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
                        <Badge leftSection={<Icono size={11} />} color={cfg.color} variant="light" size="sm">
                          {cfg.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} maw={200} lineClamp={1}>{log.entidad_nombre ?? '—'}</Text>
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
