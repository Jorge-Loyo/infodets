'use client'

import {
  Box, Title, Text, Paper, Group, TextInput, Button,
  Table, Badge, ActionIcon, Stack, ThemeIcon, Avatar,
} from '@mantine/core'
import { IconSearch, IconPlus, IconEdit, IconTrash, IconUser } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const USUARIOS_MOCK = [
  { id: '1', nombre: 'Ana García', email: 'ana.garcia@institucion.gob', rol: 'admin', estado: 'Activo' },
  { id: '2', nombre: 'Carlos López', email: 'carlos.lopez@institucion.gob', rol: 'operador', estado: 'Activo' },
  { id: '3', nombre: 'María Rodríguez', email: 'maria.rodriguez@institucion.gob', rol: 'operador', estado: 'Inactivo' },
]

export default function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = USUARIOS_MOCK.filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title order={3} mb="xs">Administrar usuarios</Title>
        <Text c="dimmed" size="sm" mb="xl">Gestiona los usuarios registrados en el sistema.</Text>

        <Paper withBorder radius="md" p="xl">
          <Group justify="space-between" mb="md">
            <TextInput
              placeholder="Buscar usuario..."
              leftSection={<IconSearch size={16} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.currentTarget.value)}
              radius="md"
              w={280}
            />
            <Button leftSection={<IconPlus size={16} />} radius="md" disabled>
              Nuevo usuario
            </Button>
          </Group>

          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Estado</Table.Th>
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
                      <Text size="sm" fw={500}>{u.nombre}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.email}</Text></Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={u.rol === 'admin' ? 'blue' : 'gray'} size="sm">
                      {u.rol}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={u.estado === 'Activo' ? 'green' : 'red'} size="sm">
                      {u.estado}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" color="blue" size="sm" disabled><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" disabled><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </motion.tr>
              ))}
            </Table.Tbody>
          </Table>

          {filtrados.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={40} variant="light" color="gray" radius="xl"><IconSearch size={20} /></ThemeIcon>
              <Text size="sm" c="dimmed">No se encontraron usuarios</Text>
            </Stack>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
