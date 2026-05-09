'use client'

import { Box, Grid, Paper, Text, ThemeIcon, Stack, Title } from '@mantine/core'
import { IconUser, IconHeadset } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const CARDS = [
  { label: 'Perfil', icon: IconUser, href: '/configuracion/perfil', color: 'blue', desc: 'Administra tu información personal e institucional' },
  { label: 'Soporte', icon: IconHeadset, href: '/configuracion/soporte', color: 'teal', desc: 'Canales de contacto y ayuda para usuarios del sistema' },
]

export default function ConfiguracionPage() {
  const router = useRouter()

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Title order={3} mb="xs">Configuración</Title>
        <Text c="dimmed" size="sm" mb="xl">Selecciona una sección para configurar.</Text>

        <Grid>
          {CARDS.map((card, i) => (
            <Grid.Col key={card.href} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
              >
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
