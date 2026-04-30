'use client'

import {
  Box, Grid, TextInput, Button, Avatar, Text,
  Stack, Paper, Group, Badge, Divider, Title, Select,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconUser, IconDeviceFloppy, IconMail, IconId,
  IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
  IconEdit, IconX,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSessionStore } from '@/store/sessionStore'
import { usuarioService } from '@/services/api/usuarioService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'

interface PerfilForm {
  nombre: string
  apellido: string
  dni: string
  cargo: string
  institucion: string
  dependencia: string
  fecha_nacimiento: string
}

// Convierte string DD/MM/AAAA o AAAA-MM-DD a Date
function strToDate(val: string): Date | null {
  if (!val) return null
  // formato DD/MM/AAAA
  const dmy = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1])
  // formato AAAA-MM-DD
  const ymd = val.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3])
  return null
}

// Convierte Date a string DD/MM/AAAA
function dateToStr(d: Date | null): string {
  if (!d) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export default function PerfilPage() {
  const { usuario } = useAuth()
  const { updatePerfil } = useSessionStore()
  const [editando, setEditando] = useState(false)
  const [valoresOriginales, setValoresOriginales] = useState<PerfilForm | null>(null)
  const [guardando, setGuardando] = useState(false)

  const fromStore = (): PerfilForm => ({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    dni: usuario?.dni ?? '',
    cargo: usuario?.cargo ?? '',
    institucion: usuario?.institucion ?? '',
    dependencia: usuario?.dependencia ?? '',
    fecha_nacimiento: usuario?.fecha_nacimiento ?? '',
  })

  const form = useForm<PerfilForm>({
    initialValues: fromStore(),
  })

  const opcionesInstituciones = useTablaOpciones('instituciones')
  const opcionesCargos = useTablaOpciones('cargos')
  const opcionesDependencias = useTablaOpciones('dependencias')

  useEffect(() => {
    const inicial = fromStore()
    form.setValues(inicial)
    setValoresOriginales(inicial)
    usuarioService.cargarPerfil().then((data) => {
      const valores = {
        nombre: data.nombre ?? '',
        apellido: data.apellido ?? '',
        dni: data.dni ?? '',
        cargo: data.cargo ?? '',
        institucion: data.institucion ?? '',
        dependencia: data.dependencia ?? '',
        fecha_nacimiento: data.fecha_nacimiento ?? '',
      }
      form.setValues(valores)
      setValoresOriginales(valores)
      updatePerfil(valores)
    }).catch(() => {})
  }, [])

  const haycambios = valoresOriginales !== null &&
    JSON.stringify(form.values) !== JSON.stringify(valoresOriginales)

  const cancelarEdicion = () => {
    if (valoresOriginales) form.setValues(valoresOriginales)
    setEditando(false)
  }

  const handleSubmit = form.onSubmit(async (values: PerfilForm) => {
    setGuardando(true)
    try {
      await usuarioService.actualizarMiPerfil(values)
      updatePerfil(values)
      setValoresOriginales(values)
      setEditando(false)
      notifications.show({ title: 'Perfil actualizado', message: 'Tus datos fueron guardados correctamente.', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo guardar el perfil.', color: 'red' })
    } finally {
      setGuardando(false)
    }
  })

  const inputProps = (field: keyof PerfilForm) => ({
    ...form.getInputProps(field),
    readOnly: !editando,
    styles: !editando ? { input: { backgroundColor: 'var(--mantine-color-gray-0)', cursor: 'default' } } : {},
  })

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />

      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />

        <Box style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            <Group justify="space-between" mb="xs">
              <Title order={3}>Mi Perfil</Title>
            </Group>
            <Text c="dimmed" size="sm" mb="xl">Administra tu información personal e institucional.</Text>

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
                          <TextInput label="Nombre" placeholder="Ingresa tu nombre" leftSection={<IconUser size={16} />} {...inputProps('nombre')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput label="Apellido" placeholder="Ingresa tu apellido" leftSection={<IconUser size={16} />} {...inputProps('apellido')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput label="DNI" placeholder="Número de documento" leftSection={<IconId size={16} />} {...inputProps('dni')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <DatePickerInput
                            label="Fecha de nacimiento"
                            placeholder="DD/MM/AAAA"
                            leftSection={<IconCalendar size={16} />}
                            valueFormat="DD/MM/YYYY"
                            value={strToDate(form.values.fecha_nacimiento)}
                            onChange={(d) => form.setFieldValue('fecha_nacimiento', dateToStr(d))}
                            readOnly={!editando}
                            styles={!editando ? { input: { backgroundColor: 'var(--mantine-color-gray-0)', cursor: 'default' } } : {}}
                            maxDate={new Date()}
                            radius="md"
                            clearable
                          />
                        </Grid.Col>
                      </Grid>

                      <Divider label="Datos institucionales" labelPosition="left" />

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Select label="Cargo" placeholder="Tu cargo en la institución" leftSection={<IconBriefcase size={16} />} data={opcionesCargos} value={form.values.cargo} onChange={(v) => form.setFieldValue('cargo', v ?? '')} readOnly={!editando} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Select label="Institución" placeholder="Nombre de la institución" leftSection={<IconBuilding size={16} />} data={opcionesInstituciones} value={form.values.institucion} onChange={(v) => form.setFieldValue('institucion', v ?? '')} readOnly={!editando} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                          <Select label="Dependencia" placeholder="Área o dependencia" leftSection={<IconSitemap size={16} />} data={opcionesDependencias} value={form.values.dependencia} onChange={(v) => form.setFieldValue('dependencia', v ?? '')} readOnly={!editando} radius="md" />
                        </Grid.Col>
                      </Grid>

                      {!editando ? (
                        <Group justify="flex-end" mt="sm">
                          <Button leftSection={<IconEdit size={16} />} variant="light" radius="md" onClick={() => setEditando(true)}>
                            Editar información
                          </Button>
                        </Group>
                      ) : (
                        <Group justify="flex-end" mt="sm" gap="sm">
                          <Button leftSection={<IconX size={16} />} variant="subtle" color="gray" radius="md" onClick={cancelarEdicion}>
                            Cancelar
                          </Button>
                          {haycambios && (
                            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                              <Button type="submit" loading={guardando} leftSection={<IconDeviceFloppy size={16} />} radius="md">
                                Guardar cambios
                              </Button>
                            </motion.div>
                          )}
                        </Group>
                      )}

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
