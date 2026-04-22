'use client'

import { Container, Title, Text, Paper, Button } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default function InvitadoPage() {
  const router = useRouter()

  return (
    <Container size="sm" py={80}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Title order={3} mb="xs">Bienvenido a INFODETS</Title>
          <Text c="dimmed" mb="xl" size="sm">
            Acceso de invitado — Sistema de Gestión de Conocimiento Dinámico
          </Text>

          <Text mb="md">
            Como invitado puede consultar información pública del sistema.
            Para acceder a todas las funcionalidades, registre una cuenta.
          </Text>

          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(ROUTES.HOME)}
          >
            Volver al inicio
          </Button>
        </Paper>
      </motion.div>
    </Container>
  )
}
