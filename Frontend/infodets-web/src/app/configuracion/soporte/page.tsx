'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, ThemeIcon,
  Group, Badge, Divider, Anchor, List,
} from '@mantine/core'
import {
  IconMail, IconPhone, IconClock, IconAlertCircle,
  IconBook, IconHeadset, IconCircleCheck,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'

const CANALES = [
  {
    icon: IconMail,
    color: 'blue',
    titulo: 'Correo electrónico',
    descripcion: 'Para consultas generales y reportes de errores.',
    valor: 'soporte@infodets.gob.ar',
    tipo: 'email',
  },
  {
    icon: IconPhone,
    color: 'green',
    titulo: 'Teléfono',
    descripcion: 'Atención telefónica en horario hábil.',
    valor: '+54 11 0000-0000',
    tipo: 'texto',
  },
  {
    icon: IconHeadset,
    color: 'violet',
    titulo: 'Mesa de ayuda',
    descripcion: 'Sistema de tickets para seguimiento de incidencias.',
    valor: 'soporte@infodets.gob.ar',
    tipo: 'email',
  },
]

const HORARIOS = [
  { dia: 'Lunes a Viernes', horario: '08:00 — 17:00 hs' },
  { dia: 'Sábados', horario: '09:00 — 13:00 hs' },
  { dia: 'Domingos y feriados', horario: 'Sin atención' },
]

const FAQ = [
  { pregunta: '¿Cómo recupero mi contraseña?', respuesta: 'Contactá al administrador del sistema para que realice el blanqueo de contraseña desde el panel de usuarios.' },
  { pregunta: '¿Qué hago si el ChatBot no responde correctamente?', respuesta: 'Podés reportarlo usando el botón de feedback en la respuesta, o enviando un correo con el detalle de la consulta.' },
  { pregunta: '¿Cómo solicito acceso a nuevas secciones?', respuesta: 'Contactá al administrador para que actualice tu perfil de permisos.' },
  { pregunta: '¿Dónde veo el historial de mis consultas?', respuesta: 'En la sección "Mis consultas" del menú lateral.' },
]

export default function SoportePage() {
  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <Group mb="xs" gap="sm">
          <ThemeIcon size={40} radius="md" variant="light" color="blue">
            <IconHeadset size={22} />
          </ThemeIcon>
          <div>
            <Title order={3}>Soporte técnico</Title>
            <Text c="dimmed" size="sm">Canales de contacto y ayuda para usuarios del sistema INFODETS.</Text>
          </div>
        </Group>

        <Divider my="xl" />

        {/* Canales de contacto */}
        <Title order={5} mb="md">Canales de contacto</Title>
        <Grid mb="xl">
          {CANALES.map((canal, i) => (
            <Grid.Col key={i} span={{ base: 12, sm: 4 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Paper withBorder p="xl" radius="md" h="100%">
                  <Stack gap="sm">
                    <ThemeIcon size={44} radius="md" variant="light" color={canal.color}>
                      <canal.icon size={22} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">{canal.titulo}</Text>
                    <Text size="xs" c="dimmed">{canal.descripcion}</Text>
                    {canal.tipo === 'email' ? (
                      <Anchor href={`mailto:${canal.valor}`} size="sm" fw={500}>{canal.valor}</Anchor>
                    ) : (
                      <Text size="sm" fw={500}>{canal.valor}</Text>
                    )}
                  </Stack>
                </Paper>
              </motion.div>
            </Grid.Col>
          ))}
        </Grid>

        <Grid mb="xl">
          {/* Horarios */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Paper withBorder p="xl" radius="md" h="100%">
              <Group mb="md" gap="xs">
                <ThemeIcon size={32} radius="md" variant="light" color="orange">
                  <IconClock size={18} />
                </ThemeIcon>
                <Title order={5}>Horarios de atención</Title>
              </Group>
              <Stack gap="xs">
                {HORARIOS.map((h, i) => (
                  <Group key={i} justify="space-between" p="xs" style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)' }}>
                    <Text size="sm">{h.dia}</Text>
                    <Badge variant="light" color={h.horario === 'Sin atención' ? 'red' : 'green'} size="sm">
                      {h.horario}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Niveles de prioridad */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Paper withBorder p="xl" radius="md" h="100%">
              <Group mb="md" gap="xs">
                <ThemeIcon size={32} radius="md" variant="light" color="red">
                  <IconAlertCircle size={18} />
                </ThemeIcon>
                <Title order={5}>Niveles de prioridad</Title>
              </Group>
              <Stack gap="xs">
                {[
                  { nivel: 'Alta', desc: 'Sistema caído o inaccesible', color: 'red' },
                  { nivel: 'Media', desc: 'Funcionalidad degradada', color: 'orange' },
                  { nivel: 'Baja', desc: 'Consultas y mejoras', color: 'blue' },
                ].map((p, i) => (
                  <Group key={i} p="xs" gap="sm" style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)' }}>
                    <Badge color={p.color} variant="filled" size="sm">{p.nivel}</Badge>
                    <Text size="sm" c="dimmed">{p.desc}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* FAQ */}
        <Paper withBorder p="xl" radius="md">
          <Group mb="md" gap="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="teal">
              <IconBook size={18} />
            </ThemeIcon>
            <Title order={5}>Preguntas frecuentes</Title>
          </Group>
          <List spacing="md" icon={<IconCircleCheck size={16} color="var(--mantine-color-teal-6)" />}>
            {FAQ.map((item, i) => (
              <List.Item key={i}>
                <Text size="sm" fw={600}>{item.pregunta}</Text>
                <Text size="xs" c="dimmed" mt={2}>{item.respuesta}</Text>
              </List.Item>
            ))}
          </List>
        </Paper>

      </motion.div>
    </Box>
  )
}
