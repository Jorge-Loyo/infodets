'use client'

import { Container, Title, Text, Button, Paper, Stack } from '@mantine/core'
import { IconLogin, IconUserOff } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default function Home() {
  const router = useRouter()

  return (
    <Container size="xs" py={80}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Title order={3} mb="xs" ta="center">INFODETS</Title>
          <Text c="dimmed" mb="xl" size="sm" ta="center">
            Sistema de Gestión de Conocimiento Dinámico
          </Text>

          <Text fw={500} mb="md" ta="center">
            ¿Tiene una cuenta registrada?
          </Text>

          <Stack>
            <Button
              fullWidth
              onClick={() => router.push(ROUTES.LOGIN)}
              leftSection={<IconLogin size={18} />}
            >
              Sí, iniciar sesión
            </Button>
            <Button
              fullWidth
              variant="light"
              onClick={() => router.push(ROUTES.INVITADO)}
              leftSection={<IconUserOff size={18} />}
            >
              No, continuar como invitado
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  )
}
