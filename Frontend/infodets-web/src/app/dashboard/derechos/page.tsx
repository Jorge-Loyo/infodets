'use client'

import { Box, Title, Text, Paper, Table, Badge, Switch, Group, Avatar, Stack, ThemeIcon } from '@mantine/core'
import { IconUser, IconShieldCheck } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const PERMISOS_MOCK = [
  { id: '1', nombre: 'Ana García', rol: 'admin', consultas: true, documentos: true, usuarios: true, dashboard: true },
  { id: '2', nombre: 'Carlos López', rol: 'operador', consultas: true, documentos: false, usuarios: false, dashboard: false },
  { id: '3', nombre: 'María Rodríguez', rol: 'operador', consultas: true, documentos: true, usuarios: false, dashboard: false },
]

export default function DerechosPage() {
  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Derechos de usuarios</Title>
        <Text c="dimmed" size="sm" mb="xl">Configura los permisos y accesos por usuario.</Text>

        <Paper withBorder radius="md" p="xl">
          <Table highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th ta="center">Consultas</Table.Th>
                <Table.Th ta="center">Documentos</Table.Th>
                <Table.Th ta="center">Usuarios</Table.Th>
                <Table.Th ta="center">Dashboard</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {PERMISOS_MOCK.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ display: 'table-row' }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue"><IconUser size={12} /></Avatar>
                      <Text size="sm" fw={500}>{u.nombre}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={u.rol === 'admin' ? 'blue' : 'gray'} size="sm">{u.rol}</Badge>
                  </Table.Td>
                  <Table.Td ta="center"><Switch checked={u.consultas} disabled /></Table.Td>
                  <Table.Td ta="center"><Switch checked={u.documentos} disabled /></Table.Td>
                  <Table.Td ta="center"><Switch checked={u.usuarios} disabled /></Table.Td>
                  <Table.Td ta="center"><Switch checked={u.dashboard} disabled /></Table.Td>
                </motion.tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Stack align="center" mt="xl" gap="xs">
          <ThemeIcon size={40} variant="light" color="blue" radius="xl"><IconShieldCheck size={20} /></ThemeIcon>
          <Text size="sm" c="dimmed">La edición de permisos estará disponible próximamente.</Text>
        </Stack>
      </motion.div>
    </Box>
  )
}
