'use client'

import { useState, useMemo } from 'react'
import { Container, Button, Paper, Stack, TextInput, PasswordInput, Alert, Image, Box } from '@mantine/core'
import { IconLogin, IconUserOff, IconAlertCircle } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'
import axiosInstance from '@/lib/axiosInstance'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export default function Home() {
  const router = useRouter()
  const { setSession, setPerfilNombre } = useSessionStore()
  const { setFotoPerfil } = useUiStore()
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
      let permisos: Record<string, boolean> = {}
      try {
        const resPermisos = await axiosInstance.get(`/permisos/${data.usuario.id}`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        permisos = resPermisos.data
      } catch {}
      setSession(data.usuario, data.access_token, permisos)
      if (data.usuario.foto_url) setFotoPerfil(data.usuario.foto_url)
      try {
        if (data.usuario.perfil_id) {
          const resPerfiles = await axiosInstance.get('/perfiles', {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
          const perfil = resPerfiles.data.find((p: { id: string; nombre: string }) => p.id === data.usuario.perfil_id)
          if (perfil) setPerfilNombre(perfil.nombre)
        }
      } catch {}
      router.replace(permisos['consulta'] ? ROUTES.CONSULTA : '/noticias')
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
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(-45deg, #1a73e8, #00c9ff, #0052d4, #4facfe)',
        backgroundSize: '400% 400%',
        animation: 'gradientMove 12s ease infinite',
      }}
    >
      {/* Burbujas animadas */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            animation: `float ${8 + i * 2}s ease-in-out infinite`,
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            left: `${10 + i * 15}%`,
            bottom: `-${60 + i * 40}px`,
          }}
        />
      ))}

      <Container size="xs" style={{ position: 'relative', zIndex: 1 }}>
        <Paper withBorder shadow="xl" p="xl" radius="lg" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <Image src="/infodets-logo.png" alt="INFODETS" h={120} w="auto" fit="contain" mx="auto" mb="xl" />
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
      </Container>

      <style jsx global>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-100vh) rotate(180deg); opacity: 0.2; }
        }
      `}</style>
    </Box>
  )
}
