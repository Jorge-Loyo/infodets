'use client'

import { Box, Grid, Paper, Text, ThemeIcon, Stack, Title, Group } from '@mantine/core'
import {
  IconUsers, IconShieldCheck, IconIdBadge,
  IconBellRinging, IconBell, IconFiles, IconNews, IconTable,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const CARDS = [
  { label: 'Administrar usuarios', icon: IconUsers, href: '/dashboard/usuarios', color: 'blue', desc: 'Gestiona los usuarios del sistema' },
  { label: 'Derechos de usuarios', icon: IconShieldCheck, href: '/dashboard/derechos', color: 'violet', desc: 'Configura permisos y accesos' },
  { label: 'Administración de perfiles', icon: IconIdBadge, href: '/dashboard/perfiles', color: 'teal', desc: 'Administra los perfiles institucionales' },
  { label: 'Panel de notificaciones', icon: IconBellRinging, href: '/dashboard/panel-notificaciones', color: 'orange', desc: 'Configura y gestiona notificaciones' },
  { label: 'Notificaciones', icon: IconBell, href: '/dashboard/notificaciones', color: 'yellow', desc: 'Visualiza las notificaciones activas' },
  { label: 'Administración de documentación', icon: IconFiles, href: '/dashboard/documentacion', color: 'green', desc: 'CRUD completo de documentos del sistema' },
  { label: 'Administrador de Noticias', icon: IconNews, href: '/dashboard/noticias', color: 'pink', desc: 'Crea y gestiona publicaciones institucionales' },
  { label: 'Administrar tablas', icon: IconTable, href: '/dashboard/tablas', color: 'indigo', desc: 'Gestiona los valores de los desplegables del sistema' },
]

export default function DashboardPage() {
  const router = useRouter()

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Panel Administrativo</Title>
        <Text c="dimmed" size="sm" mb="xl">Selecciona una sección para administrar.</Text>

        <Grid>
          {CARDS.map((card, i) => (
            <Grid.Col key={card.href} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
              >
                <Paper
                  withBorder
                  p="xl"
                  radius="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(card.href)}
                >
                  <Stack gap="sm">
                    <ThemeIcon size={44} radius="md" variant="light" color={card.color}>
                      <card.icon size={22} />
                    </ThemeIcon>
                    <Group gap={4}>
                      <Text fw={600} size="sm">{card.label}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">{card.desc}</Text>
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
