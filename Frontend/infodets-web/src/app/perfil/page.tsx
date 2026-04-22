'use client'

import {
  Box, Grid, TextInput, Button, Avatar, Text,
  Stack, Paper, Group, Badge, Divider, Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconUser, IconDeviceFloppy, IconMail, IconId,
  IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSessionStore } from '@/store/sessionStore'

interface PerfilForm {
  nombre: string
  apellido: string
  dni: string
  cargo: string
  institucion: string
  dependencia: string
  fecha_nacimiento: string
}

export default function PerfilPage() {
  const { usuario } = useAuth()
  const { updatePerfil } = useSessionStore()

  const form = useForm<PerfilForm>({
    initialValues: {
      nombre: usuario?.nombre ?? '',
      apellido: usuario?.apellido ?? '',
      dni: usuario?.dni ?? '',
      cargo: usuario?.cargo ?? '',
      institucion: usuario?.institucion ?? '',
      dependencia: usuario?.dependencia ?? '',
      fecha_nacimiento: usuario?.fecha_nacimiento ?? '',
    },
    validate: {
      nombre: (v: string) => v.trim().length < 2 ? 'Ingrese su nombre' : null,
      apellido: (v: string) => v.trim().length < 2 ? 'Ingrese su apellido' : null,
      dni: (v: string) => v.trim().length < 7 ? 'DNI inválido' : null,
    },
  })

  const handleSubmit = form.onSubmit((values: PerfilForm) => {
    updatePerfil(values)
    notifications.show({
      title: 'Perfil actualizado',
      message: 'Tus datos fueron guardados correctamente.',
      color: 'green',
    })
  })

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />

        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Title order={3} mb="xs">Mi Perfil</Title>
            <Text c="dimmed" size="sm" mb="xl">
              Administra tu información personal e institucional.
            </Text>

            <Grid>
              {/* Tarjeta de identidad */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper withBorder p="xl" radius="md" h="100%">
                  <Stack align="center" gap="sm">
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                      <Avatar size={80} radius="xl" color="blue">
                        <IconUser size={36} />
                      </Avatar>
                    </motion.div>

                    <Stack gap={2} align="center">
                      <Text fw={600} size="lg">
                        {form.values.nombre || 'Nombre'} {form.values.apellido || 'Apellido'}
                      </Text>
                      <Text size="sm" c="dimmed">{usuario?.email}</Text>
                    </Stack>

                    <Badge variant="light" color="blue" radius="sm">
                      {usuario?.rol ?? 'operador'}
                    </Badge>

                    <Divider w="100%" />

                    <Stack gap={6} w="100%">
                      {form.values.cargo && (
                        <Group gap="xs">
                          <IconBriefcase size={14} opacity={0.5} />
                          <Text size="xs" c="dimmed">{form.values.cargo}</Text>
                        </Group>
                      )}
                      {form.values.institucion && (
                        <Group gap="xs">
                          <IconBuilding size={14} opacity={0.5} />
                          <Text size="xs" c="dimmed">{form.values.institucion}</Text>
                        </Group>
                      )}
                      {form.values.dependencia && (
                        <Group gap="xs">
                          <IconSitemap size={14} opacity={0.5} />
                          <Text size="xs" c="dimmed">{form.values.dependencia}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Formulario */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper withBorder p="xl" radius="md">
                  <form onSubmit={handleSubmit}>
                    <Stack gap="md">

                      <TextInput
                        label="Correo electrónico"
                        value={usuario?.email ?? ''}
                        readOnly
                        leftSection={<IconMail size={16} />}
                        description="Este campo proviene de tu cuenta de acceso y no puede modificarse."
                        styles={{ input: { backgroundColor: 'var(--mantine-color-gray-1)', cursor: 'not-allowed' } }}
                      />

                      <Divider label="Datos personales" labelPosition="left" />

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Nombre"
                            placeholder="Ingresa tu nombre"
                            leftSection={<IconUser size={16} />}
                            {...form.getInputProps('nombre')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Apellido"
                            placeholder="Ingresa tu apellido"
                            leftSection={<IconUser size={16} />}
                            {...form.getInputProps('apellido')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="DNI"
                            placeholder="Número de documento"
                            leftSection={<IconId size={16} />}
                            {...form.getInputProps('dni')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Fecha de nacimiento"
                            placeholder="DD/MM/AAAA"
                            leftSection={<IconCalendar size={16} />}
                            {...form.getInputProps('fecha_nacimiento')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Divider label="Datos institucionales" labelPosition="left" />

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Cargo"
                            placeholder="Tu cargo en la institución"
                            leftSection={<IconBriefcase size={16} />}
                            {...form.getInputProps('cargo')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Institución"
                            placeholder="Nombre de la institución"
                            leftSection={<IconBuilding size={16} />}
                            {...form.getInputProps('institucion')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                          <TextInput
                            label="Dependencia"
                            placeholder="Área o dependencia"
                            leftSection={<IconSitemap size={16} />}
                            {...form.getInputProps('dependencia')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Group justify="flex-end" mt="sm">
                        <Button
                          type="submit"
                          leftSection={<IconDeviceFloppy size={16} />}
                          radius="md"
                        >
                          Guardar cambios
                        </Button>
                      </Group>

                    </Stack>
                  </form>
                </Paper>
              </Grid.Col>
            </Grid>
          </motion.div>
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
