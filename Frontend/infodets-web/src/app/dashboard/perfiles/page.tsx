'use client'

import { Box, Title, Text, Paper, Grid, Stack, ThemeIcon, Badge, Group, Avatar, Button } from '@mantine/core'
import { IconUser, IconPlus, IconEdit } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const PERFILES_MOCK = [
  { id: '1', nombre: 'Administrador', descripcion: 'Acceso total al sistema', usuarios: 2, color: 'blue' },
  { id: '2', nombre: 'Operador', descripcion: 'Consultas y carga de documentos', usuarios: 8, color: 'teal' },
  { id: '3', nombre: 'Consultor', descripcion: 'Solo lectura y consultas', usuarios: 5, color: 'gray' },
]

export default function PerfilesPage() {
  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3} mb="xs">Administración de perfiles</Title>
            <Text c="dimmed" size="sm">Gestiona los perfiles de acceso del sistema.</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} radius="md" disabled>Nuevo perfil</Button>
        </Group>

        <Grid>
          {PERFILES_MOCK.map((perfil, i) => (
            <Grid.Col key={perfil.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
              >
                <Paper withBorder p="xl" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <ThemeIcon size={44} radius="md" variant="light" color={perfil.color}>
                        <IconUser size={22} />
                      </ThemeIcon>
                      <ActionIconEdit />
                    </Group>
                    <Text fw={600}>{perfil.nombre}</Text>
                    <Text size="sm" c="dimmed">{perfil.descripcion}</Text>
                    <Group gap="xs">
                      <Avatar.Group>
                        {Array.from({ length: Math.min(perfil.usuarios, 3) }).map((_, j) => (
                          <Avatar key={j} size="sm" radius="xl" color={perfil.color}>
                            <IconUser size={10} />
                          </Avatar>
                        ))}
                      </Avatar.Group>
                      <Badge variant="light" color={perfil.color} size="sm">
                        {perfil.usuarios} usuarios
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid.Col>
          ))}
        </Grid>
      </motion.div>
    </Box>
  )
}

function ActionIconEdit() {
  return (
    <Button variant="subtle" size="xs" radius="md" leftSection={<IconEdit size={12} />} disabled>
      Editar
    </Button>
  )
}
