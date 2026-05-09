'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, Group, Button,
  TextInput, Textarea, Select, Avatar, ThemeIcon,
  Divider, Badge, FileButton,
} from '@mantine/core'
import {
  IconRobot, IconDeviceFloppy, IconRefresh,
  IconCamera, IconTrash, IconBrain, IconMoodSmile,
  IconLanguage, IconBuilding, IconAlertCircle, IconEdit,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { notifications } from '@mantine/notifications'
import axiosInstance from '@/lib/axiosInstance'

interface BotIdentidad {
  id: string
  nombre: string
  sexo: string
  personalidad: string
  tono: string
  idioma: string
  institucion: string
  descripcion: string
  restricciones: string
  imagen_url: string
  actualizado_en: string
}

const TONOS = [
  { value: 'formal',    label: 'Formal — Profesional y serio' },
  { value: 'amigable',  label: 'Amigable — Cercano y accesible' },
  { value: 'tecnico',   label: 'Técnico — Preciso y detallado' },
  { value: 'empatico',  label: 'Empático — Comprensivo y humano' },
]

const SEXOS = [
  { value: 'neutro',    label: 'Neutro' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino',  label: 'Femenino' },
]

const IDIOMAS = [
  { value: 'español',   label: 'Español' },
  { value: 'inglés',    label: 'Inglés' },
  { value: 'portugués', label: 'Portugués' },
]

const DEFAULT: Omit<BotIdentidad, 'id' | 'actualizado_en'> = {
  nombre: 'Infobot',
  sexo: 'neutro',
  personalidad: '',
  tono: 'formal',
  idioma: 'español',
  institucion: '',
  descripcion: '',
  restricciones: '',
  imagen_url: '',
}

export default function IdentidadBotPage() {
  const [form, setForm] = useState(DEFAULT)
  const [original, setOriginal] = useState(DEFAULT)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const resetRef = useRef<() => void>(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await axiosInstance.get<BotIdentidad>('/bot')
      const { id: _, actualizado_en: __, ...datos } = res.data
      const normalizado = {
        nombre:        datos.nombre        ?? 'Infobot',
        sexo:          datos.sexo          ?? 'neutro',
        personalidad:  datos.personalidad  ?? '',
        tono:          datos.tono          ?? 'formal',
        idioma:        datos.idioma        ?? 'español',
        institucion:   datos.institucion   ?? '',
        descripcion:   datos.descripcion   ?? '',
        restricciones: datos.restricciones ?? '',
        imagen_url:    datos.imagen_url    ?? '',
      }
      setForm(normalizado)
      setOriginal(normalizado)
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar la identidad del bot' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const haycambios = JSON.stringify(form) !== JSON.stringify(original)

  const guardar = async () => {
    if (!form.nombre.trim()) {
      notifications.show({ color: 'orange', message: 'El nombre del bot es obligatorio' })
      return
    }
    setGuardando(true)
    try {
      await axiosInstance.put('/bot', form)
      setOriginal(form)
      notifications.show({ color: 'green', message: 'Identidad del bot actualizada ✅ — se aplicará en el próximo chat' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  const handleImagen = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setForm(f => ({ ...f, imagen_url: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }))

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group justify="space-between" mb="xs">
          <div>
            <Title order={3}>Identidad del ChatBot</Title>
            <Text c="dimmed" size="sm">Configurá la personalidad, nombre e imagen del asistente virtual.</Text>
          </div>
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={16} />} variant="subtle" color="gray" radius="md" onClick={cargar}>
              Recargar
            </Button>
            <Button leftSection={<IconDeviceFloppy size={16} />} radius="md" loading={guardando} disabled={!haycambios} onClick={guardar}>
              Guardar cambios
            </Button>
          </Group>
        </Group>

        <Divider mb="xl" />

        <Grid>
          {/* Preview del bot */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper withBorder p="xl" radius="md" h="100%">
              <Stack align="center" gap="md">
                <Text fw={600} size="sm" c="dimmed" tt="uppercase">Vista previa</Text>

                <Box style={{ position: 'relative', display: 'inline-block' }}>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Avatar
                      size={100} radius="xl"
                      color="blue"
                      src={form.imagen_url || undefined}
                      style={{ boxShadow: '0 4px 20px rgba(28,126,214,0.3)' }}
                    >
                      {!form.imagen_url && <IconRobot size={48} />}
                    </Avatar>
                  </motion.div>

                  <FileButton resetRef={resetRef} onChange={handleImagen} accept="image/*">
                    {(props) => (
                      <Button
                        {...props} size="compact-xs" radius="xl" variant="filled" color="blue"
                        style={{ position: 'absolute', bottom: 0, right: 0 }}
                      >
                        <IconCamera size={12} />
                      </Button>
                    )}
                  </FileButton>

                  {form.imagen_url && (
                    <Button
                      size="compact-xs" radius="xl" variant="filled" color="red"
                      style={{ position: 'absolute', top: 0, right: 0 }}
                      onClick={() => { setForm(f => ({ ...f, imagen_url: '' })); resetRef.current?.() }}
                    >
                      <IconTrash size={12} />
                    </Button>
                  )}
                </Box>

                <Stack align="center" gap={4}>
                  <Text fw={700} size="lg">{form.nombre || 'Infobot'}</Text>
                  {form.institucion && <Text size="xs" c="dimmed">{form.institucion}</Text>}
                  <Badge color="blue" variant="light" size="sm">{TONOS.find(t => t.value === form.tono)?.label.split(' — ')[0] ?? form.tono}</Badge>
                  <Badge color="gray" variant="light" size="xs">{form.idioma}</Badge>
                </Stack>

                {form.descripcion && (
                  <>
                    <Divider w="100%" />
                    <Text size="xs" c="dimmed" ta="center" fs="italic">"{form.descripcion}"</Text>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Formulario */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Stack gap="md">

              {/* Identidad básica */}
              <Paper withBorder p="xl" radius="md">
                <Group mb="md" gap="xs">
                  <ThemeIcon size={32} radius="md" variant="light" color="blue"><IconRobot size={18} /></ThemeIcon>
                  <div>
                    <Text fw={600}>Identidad básica</Text>
                    <Text size="xs" c="dimmed">Nombre, género y presentación del bot.</Text>
                  </div>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput label="Nombre del bot *" placeholder="Ej: Infobot, Asistente, Clara..." value={form.nombre} onChange={e => set('nombre')(e.target.value)} radius="md" leftSection={<IconEdit size={16} />} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select label="Género" data={SEXOS} value={form.sexo} onChange={v => set('sexo')(v ?? 'neutro')} radius="md" />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput label="Institución" placeholder="Ej: Municipalidad de..." value={form.institucion} onChange={e => set('institucion')(e.target.value)} radius="md" leftSection={<IconBuilding size={16} />} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Textarea label="Descripción breve" placeholder="Ej: Soy el asistente virtual de la Municipalidad, estoy aquí para ayudarte con tus consultas..." value={form.descripcion} onChange={e => set('descripcion')(e.target.value)} radius="md" autosize minRows={2} maxRows={3} />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Personalidad y comportamiento */}
              <Paper withBorder p="xl" radius="md">
                <Group mb="md" gap="xs">
                  <ThemeIcon size={32} radius="md" variant="light" color="violet"><IconMoodSmile size={18} /></ThemeIcon>
                  <div>
                    <Text fw={600}>Personalidad y comportamiento</Text>
                    <Text size="xs" c="dimmed">Cómo se comunica y qué actitud tiene el bot.</Text>
                  </div>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select label="Tono de comunicación" data={TONOS} value={form.tono} onChange={v => set('tono')(v ?? 'formal')} radius="md" />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select label="Idioma principal" data={IDIOMAS} value={form.idioma} onChange={v => set('idioma')(v ?? 'español')} radius="md" leftSection={<IconLanguage size={16} />} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Textarea
                      label="Personalidad detallada"
                      placeholder="Ej: Soy amable, paciente y siempre busco dar respuestas claras. Me gusta usar ejemplos concretos y evito el lenguaje técnico innecesario..."
                      value={form.personalidad}
                      onChange={e => set('personalidad')(e.target.value)}
                      radius="md" autosize minRows={3} maxRows={5}
                      leftSection={<IconBrain size={16} />}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Restricciones */}
              <Paper withBorder p="xl" radius="md">
                <Group mb="md" gap="xs">
                  <ThemeIcon size={32} radius="md" variant="light" color="orange"><IconAlertCircle size={18} /></ThemeIcon>
                  <div>
                    <Text fw={600}>Restricciones y límites</Text>
                    <Text size="xs" c="dimmed">Qué temas debe evitar o cómo debe manejar situaciones delicadas.</Text>
                  </div>
                </Group>
                <Textarea
                  placeholder="Ej: No responder sobre temas políticos. No dar opiniones personales. Si el usuario pregunta sobre temas fuera del ámbito institucional, redirigir amablemente..."
                  value={form.restricciones}
                  onChange={e => set('restricciones')(e.target.value)}
                  radius="md" autosize minRows={3} maxRows={5}
                />
              </Paper>

            </Stack>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Box>
  )
}
