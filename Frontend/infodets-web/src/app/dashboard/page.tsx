'use client'

import { Box, Grid, Paper, Text, ThemeIcon, Stack, Title } from '@mantine/core'
import {
  IconUsers, IconShieldCheck,
  IconBellRinging, IconBell, IconFiles, IconNews, IconTable,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'

const CARDS = [
  { label: 'Administrar usuarios', icon: IconUsers, href: '/dashboard/usuarios', color: 'blue', desc: 'Gestiona los usuarios del sistema', permiso: 'gestionar_usuarios' },
  { label: 'Derechos de usuarios', icon: IconShieldCheck, href: '/dashboard/derechos', color: 'violet', desc: 'Configura perfiles y permisos de acceso', permiso: 'gestionar_usuarios' },
  { label: 'Administración de documentación', icon: IconFiles, href: '/dashboard/documentacion', color: 'green', desc: 'CRUD completo de documentos del sistema', permiso: 'gestionar_documentos' },
  { label: 'Administrador de Noticias', icon: IconNews, href: '/dashboard/noticias', color: 'pink', desc: 'Crea y gestiona publicaciones institucionales', permiso: 'gestionar_noticias' },
  { label: 'Administrar tablas', icon: IconTable, href: '/dashboard/tablas', color: 'indigo', desc: 'Gestiona los valores de los desplegables del sistema', permiso: 'gestionar_tablas' },
  { label: 'Panel de notificaciones', icon: IconBellRinging, href: '/dashboard/panel-notificaciones', color: 'orange', desc: 'Configura y gestiona notificaciones', permiso: 'dashboard' },
  { label: 'Notificaciones', icon: IconBell, href: '/dashboard/notificaciones', color: 'yellow', desc: 'Visualiza las notificaciones activas', permiso: 'dashboard' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { tienePermiso } = useSessionStore()

  const cardsVisibles = CARDS.filter(c => tienePermiso(c.permiso))

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Panel Administrativo</Title>
        <Text c="dimmed" size="sm" mb="xl">Selecciona una sección para administrar.</Text>

        <Grid>
          {cardsVisibles.map((card, i) => (
            <Grid.Col key={card.href} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
              >
                <Paper
                  withBorder p="xl" radius="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(card.href)}
                >
                  <Stack gap="sm">
                    <ThemeIcon size={44} radius="md" variant="light" color={card.color}>
                      <card.icon size={22} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">{card.label}</Text>
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
