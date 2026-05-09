'use client'

import { Box, Grid, Paper, Text, ThemeIcon, Stack, Title, Button, Group, Divider } from '@mantine/core'
import {
  IconUsers, IconShieldCheck,
  IconNews, IconTable, IconPalette, IconActivity, IconFileText, IconTrash,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useSessionStore } from '@/store/sessionStore'
import axiosInstance from '@/lib/axiosInstance'

const CARDS = [
  { label: 'Administrar usuarios',     icon: IconUsers,       href: '/dashboard/usuarios',       color: 'blue',   desc: 'Gestiona los usuarios del sistema',                         permiso: 'gestionar_usuarios' },
  { label: 'Derechos de usuarios',     icon: IconShieldCheck, href: '/dashboard/derechos',        color: 'violet', desc: 'Configura perfiles y permisos de acceso',                   permiso: 'gestionar_usuarios' },
  { label: 'Administrador de Noticias',icon: IconNews,        href: '/dashboard/noticias',        color: 'pink',   desc: 'Crea y gestiona publicaciones institucionales',             permiso: 'gestionar_noticias' },
  { label: 'Administrar tablas',       icon: IconTable,       href: '/dashboard/tablas',          color: 'indigo', desc: 'Gestiona los valores de los desplegables del sistema',      permiso: 'gestionar_tablas' },
  { label: 'Temas y Visualización',    icon: IconPalette,     href: '/dashboard/temas',           color: 'pink',   desc: 'Logo, tipografía, colores y paleta de la plataforma',      permiso: 'gestionar_tablas' },
  { label: 'Log de Usuarios',          icon: IconActivity,    href: '/dashboard/log-usuarios',    color: 'cyan',   desc: 'Historial de creaciones, modificaciones y eliminaciones',   permiso: 'gestionar_usuarios' },
  { label: 'Log de Documentos',        icon: IconFileText,    href: '/dashboard/log-documentos',  color: 'teal',   desc: 'Historial de cargas y eliminaciones de documentos en la IA', permiso: 'gestionar_documentos' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { tienePermiso } = useSessionStore()
  const [limpiando, setLimpiando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const cardsVisibles = CARDS.filter(c => tienePermiso(c.permiso))

  const handleReset = async () => {
    setLimpiando(true)
    try {
      await axiosInstance.delete('/admin/reset-datos')
      notifications.show({ color: 'green', message: 'Datos de prueba eliminados correctamente' })
      setConfirmando(false)
    } catch {
      notifications.show({ color: 'red', message: 'Error al limpiar los datos' })
    } finally {
      setLimpiando(false)
    }
  }

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

        <Divider my="xl" />

        <Paper withBorder radius="md" p="xl" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
          <Group justify="space-between" wrap="wrap" gap="md">
            <Stack gap={4}>
              <Text fw={600} size="sm" c="red">Zona de peligro</Text>
              <Text size="xs" c="dimmed">
                Elimina todo el historial de consultas, tickets, notificaciones y validaciones de todos los usuarios.
              </Text>
            </Stack>
            {!confirmando ? (
              <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={() => setConfirmando(true)}>
                Limpiar datos de prueba
              </Button>
            ) : (
              <Group gap="xs">
                <Text size="sm" c="red" fw={500}>¿Confirmar? Esta acción no se puede deshacer.</Text>
                <Button color="red" size="xs" loading={limpiando} onClick={handleReset}>Sí, limpiar</Button>
                <Button variant="subtle" size="xs" disabled={limpiando} onClick={() => setConfirmando(false)}>Cancelar</Button>
              </Group>
            )}
          </Group>
        </Paper>
      </motion.div>
    </Box>
  )
}
