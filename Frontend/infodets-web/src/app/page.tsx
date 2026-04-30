'use client'

import { useState, useMemo } from 'react'
import { Container, Title, Text, Button, Paper, Stack, TextInput, PasswordInput, Alert } from '@mantine/core'
import { IconLogin, IconUserOff, IconAlertCircle } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { useSessionStore } from '@/store/sessionStore'
import axiosInstance from '@/lib/axiosInstance'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export default function Home() {
  const router = useRouter()
  const { setSession } = useSessionStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = useMemo(
    () => EMAIL_REGEX.test(email.trim()) && PASSWORD_REGEX.test(password),
    [email, password]
  )

  const handleLogin = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/login', { email: email.trim().toLowerCase(), password })
      // Cargar permisos del usuario antes de redirigir
      let permisos: Record<string, boolean> = {}
      try {
        const resPermisos = await axiosInstance.get(`/permisos/${data.usuario.id}`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        permisos = resPermisos.data
      } catch {}
      setSession(data.usuario, data.access_token, permisos)
      router.replace(ROUTES.CONSULTA)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail
      if (detail) {
        setError(detail)
      } else if (!axiosErr?.response) {
        setError('No se pudo conectar con el servidor')
      } else {
        setError('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xs" py={80}>
      <div>
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Title order={3} mb="xs" ta="center">INFODETS</Title>
          <Text c="dimmed" mb="xl" size="sm" ta="center">
            Sistema de Gestión de Conocimiento Dinámico
          </Text>
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
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button
              fullWidth
              loading={loading}
              onClick={handleLogin}
              disabled={!isValid}
              leftSection={<IconLogin size={18} />}
            >
              Iniciar sesión
            </Button>
            <Button fullWidth variant="light" onClick={() => router.push(ROUTES.INVITADO)} leftSection={<IconUserOff size={18} />}>
              Continuar como invitado
            </Button>
          </Stack>
        </Paper>
      </div>
    </Container>
  )
}