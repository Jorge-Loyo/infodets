'use client'

import {
  Box, Grid, TextInput, Button, Avatar, Text,
  Stack, Paper, Group, Badge, Divider, Title, Select, FileButton, ActionIcon, Tooltip, PasswordInput, Modal,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconUser, IconDeviceFloppy, IconMail, IconId,
  IconBriefcase, IconBuilding, IconSitemap, IconCalendar,
  IconEdit, IconX, IconCamera, IconTrash, IconLock,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import { useSessionStore } from '@/store/sessionStore'
import { usuarioService } from '@/services/api/usuarioService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import { useUiStore } from '@/store/uiStore'
import axiosInstance from '@/lib/axiosInstance'

interface PerfilForm {
  nombre: string
  apellido: string
  dni: string
  cargo: string
  institucion: string
  dependencia: string
  fecha_nacimiento: string
}

function strToDate(val: string): Date | null {
  if (!val) return null
  const dmy = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1])
  const ymd = val.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3])
  return null
}

function dateToStr(d: Date | string | null): string {
  if (!d) return ''
  if (typeof d === 'string') return d
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function PerfilPanel() {
  const { usuario } = useAuth()
  const { updatePerfil } = useSessionStore()
  const { fotoPerfil, setFotoPerfil } = useUiStore()
  const [mounted, setMounted] = useState(false)
  const [editando, setEditando] = useState(false)
  const [valoresOriginales, setValoresOriginales] = useState<PerfilForm | null>(null)
  const [guardando, setGuardando] = useState(false)
  const resetRef = useRef<() => void>(null)
  const [modalPassword, setModalPassword] = useState(false)
  const [passActual, setPassActual] = useState('')
  const [passNuevo, setPassNuevo] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [guardandoPass, setGuardandoPass] = useState(false)

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

  const cambiarPassword = async () => {
    if (passNuevo !== passConfirm) {
      notifications.show({ color: 'red', message: 'Las contraseñas nuevas no coinciden' })
      return
    }
    if (!PASSWORD_REGEX.test(passNuevo)) {
      notifications.show({ color: 'orange', message: 'La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo' })
      return
    }
    setGuardandoPass(true)
    try {
      await axiosInstance.post('/usuarios/me/cambiar-password', { password_actual: passActual, password_nuevo: passNuevo })
      notifications.show({ color: 'green', message: 'Contraseña actualizada correctamente ✅' })
      setModalPassword(false)
      setPassActual(''); setPassNuevo(''); setPassConfirm('')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      notifications.show({ color: 'red', message: err?.response?.data?.detail ?? 'No se pudo cambiar la contraseña' })
    } finally {
      setGuardandoPass(false)
    }
  }

  const fromStore = (): PerfilForm => ({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    dni: usuario?.dni ?? '',
    cargo: usuario?.cargo ?? '',
    institucion: usuario?.institucion ?? '',
    dependencia: usuario?.dependencia ?? '',
    fecha_nacimiento: usuario?.fecha_nacimiento ?? '',
  })

  const form = useForm<PerfilForm>({ initialValues: fromStore() })

  const opcionesInstituciones = useTablaOpciones('instituciones')
  const opcionesCargos = useTablaOpciones('cargos')
  const opcionesDependencias = useTablaOpciones('dependencias')

  useEffect(() => { setMounted(true) }, [])

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
    styles: !editando ? { input: { backgroundColor: 'var(--mantine-color-default-hover)', cursor: 'default' } } : {},
  })

  return (
    <Box>
      <Title order={4} mb="xs">Mi Perfil</Title>
      <Text c="dimmed" size="sm" mb="xl">Administra tu información personal e institucional.</Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="xl" radius="md" h="100%">
            <Stack align="center" gap="sm">
              <Box style={{ position: 'relative', display: 'inline-block' }}>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Avatar
                    size={90} radius="xl" color="blue"
                    src={mounted && fotoPerfil ? fotoPerfil : undefined}
                  >
                    {(!mounted || !fotoPerfil) && <IconUser size={40} />}
                  </Avatar>
                </motion.div>
                <FileButton
                  resetRef={resetRef}
                  onChange={async (file) => {
                    if (!file) return
                    try {
                      const formData = new FormData()
                      formData.append('archivo', file)
                      const res = await axiosInstance.post<{ foto_url: string }>('/usuarios/me/foto', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      })
                      setFotoPerfil(res.data.foto_url)
                      notifications.show({ color: 'green', message: 'Foto actualizada ✅' })
                    } catch {
                      notifications.show({ color: 'red', message: 'Error al subir la foto' })
                    }
                  }}
                  accept="image/*"
                >
                  {(props) => (
                    <Tooltip label="Cambiar foto" withArrow>
                      <ActionIcon
                        {...props}
                        size="sm" radius="xl" variant="filled" color="blue"
                        style={{ position: 'absolute', bottom: 0, right: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                      >
                        <IconCamera size={12} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </FileButton>
                {fotoPerfil && (
                  <Tooltip label="Quitar foto" withArrow>
                    <ActionIcon
                      size="sm" radius="xl" variant="filled" color="red"
                      style={{ position: 'absolute', top: 0, right: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                      onClick={async () => {
                        try {
                          await axiosInstance.delete('/usuarios/me/foto')
                          setFotoPerfil('')
                          resetRef.current?.()
                        } catch {}
                      }}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Box>
              <Stack gap={2} align="center">
                <Text fw={600} size="lg">
                  {form.values.nombre || 'Nombre'} {form.values.apellido || 'Apellido'}
                </Text>
                <Text size="sm" c="dimmed">{usuario?.email}</Text>
              </Stack>
              <Badge variant="light" color="blue" radius="sm">{usuario?.rol ?? 'operador'}</Badge>
              <Button
                leftSection={<IconLock size={14} />}
                variant="light" color="orange" radius="md" size="xs" fullWidth
                onClick={() => setModalPassword(true)}
              >
                Cambiar contraseña
              </Button>
              <Divider w="100%" />
              <Stack gap={6} w="100%">
                {form.values.cargo && (
                  <Group gap="xs"><IconBriefcase size={14} opacity={0.5} /><Text size="xs" c="dimmed">{form.values.cargo}</Text></Group>
                )}
                {form.values.institucion && (
                  <Group gap="xs"><IconBuilding size={14} opacity={0.5} /><Text size="xs" c="dimmed">{form.values.institucion}</Text></Group>
                )}
                {form.values.dependencia && (
                  <Group gap="xs"><IconSitemap size={14} opacity={0.5} /><Text size="xs" c="dimmed">{form.values.dependencia}</Text></Group>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

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
                      styles={!editando ? { input: { backgroundColor: 'var(--mantine-color-default-hover)', cursor: 'default' } } : {}}
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
                    <Button leftSection={<IconX size={16} />} variant="subtle" color="gray" radius="md" onClick={cancelarEdicion}>Cancelar</Button>
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

      {/* Modal cambiar contraseña */}
      <Modal opened={modalPassword} onClose={() => { setModalPassword(false); setPassActual(''); setPassNuevo(''); setPassConfirm('') }} title="Cambiar contraseña" radius="md" size="sm">
        <Stack gap="md">
          <PasswordInput label="Contraseña actual" placeholder="Tu contraseña actual" value={passActual} onChange={e => setPassActual(e.currentTarget.value)} radius="md" />
          <Divider />
          <PasswordInput label="Nueva contraseña" placeholder="Mín. 8 caracteres" value={passNuevo} onChange={e => setPassNuevo(e.currentTarget.value)} radius="md" />
          <PasswordInput label="Confirmar nueva contraseña" placeholder="Repetí la nueva contraseña" value={passConfirm} onChange={e => setPassConfirm(e.currentTarget.value)} radius="md" />
          <Text size="xs" c="dimmed">Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo. Ej: <strong>Infodets2024!</strong></Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={() => setModalPassword(false)}>Cancelar</Button>
            <Button
              leftSection={<IconLock size={14} />}
              loading={guardandoPass}
              disabled={!passActual || !passNuevo || !passConfirm}
              onClick={cambiarPassword}
            >
              Actualizar contraseña
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
