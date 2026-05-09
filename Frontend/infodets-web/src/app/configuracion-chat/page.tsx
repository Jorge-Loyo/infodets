'use client'

import { Box, Grid, Paper, Text, ThemeIcon, Stack, Title } from '@mantine/core'
import { IconBell, IconFiles, IconRobot } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const CARDS = [
  { label: 'Notificaciones',    icon: IconBell,  href: '/configuracion-chat/notificaciones', color: 'yellow', desc: 'Tickets del loop de retroalimentación y validaciones IA' },
  { label: 'Documentación',     icon: IconFiles, href: '/configuracion-chat/documentacion',  color: 'green',  desc: 'Gestión de documentos y URLs oficiales del RAG' },
  { label: 'Identidad del Bot', icon: IconRobot, href: '/configuracion-chat/identidad-bot',  color: 'blue',   desc: 'Nombre, imagen, personalidad y comportamiento del asistente' },
]

export default function ConfiguracionChatPage() {
  const router = useRouter()

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Configuración de Chat</Title>
        <Text c="dimmed" size="sm" mb="xl">Ajustes y preferencias del ChatBot.</Text>

        <Grid>
          {CARDS.map((card, i) => (
            <Grid.Col key={card.href} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}>
                <Paper withBorder p="xl" radius="md" style={{ cursor: 'pointer' }} onClick={() => router.push(card.href)}>
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
