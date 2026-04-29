'use client'

import { useState } from 'react'
import { Container, Title, Text, Button, Paper, Stack, TextInput, PasswordInput, Alert } from '@mantine/core'
import { IconLogin, IconUserOff, IconAlertCircle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { useSessionStore } from '@/store/sessionStore'
import axiosInstance from '@/lib/axiosInstance'

export default function Home() {
  const router = useRouter()
  const { setSession } = useSessionStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password })
      setSession(data.usuario, data.access_token)
      router.replace(ROUTES.CONSULTA)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

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
          <form onSubmit={handleLogin}>
            <Stack>
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <PasswordInput
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading} leftSection={<IconLogin size={18} />}>
                Iniciar sesión
              </Button>
              <Button fullWidth variant="light" onClick={() => router.push(ROUTES.INVITADO)} leftSection={<IconUserOff size={18} />}>
                Continuar como invitado
              </Button>
            </Stack>
          </form>
        </Paper>
      </motion.div>
    </Container>
  )
}
