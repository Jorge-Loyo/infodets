'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Container, Paper, Title, Text, TextInput, Textarea,
  Button, Stack, Alert, Group, Loader, Box, Select,
} from '@mantine/core'
import { IconArrowLeft, IconSend, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormData {
  nombre: string
  apellido: string
  email: string
  institucion: string
  mensaje: string
}

export default function InvitadoPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ nombre: '', apellido: '', email: '', institucion: '', mensaje: '' })
  const [respuesta, setRespuesta] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [instituciones, setInstituciones] = useState<{ value: string; label: string }[]>([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tablas/instituciones?solo_activos=true`)
      .then(r => r.json())
      .then((items: { valor: string }[]) => setInstituciones(items.map(i => ({ value: i.valor, label: i.valor }))))
      .catch(() => {})
      .finally(() => setLoadingInstituciones(false))
  }, [])

  const isValid = useMemo(() =>
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    EMAIL_REGEX.test(form.email.trim()) &&
    form.mensaje.trim().length >= 10,
    [form]
  )

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const handleConsultar = async () => {
    if (!isValid) return
    setLoading(true)
    setRespuesta('')
    setDone(false)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/invitado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim().toLowerCase(),
          institucion: form.institucion.trim() || null,
          mensaje: form.mensaje.trim(),
        }),
      })

      if (!res.ok || !res.body) {
        setError('Error al procesar la consulta. Intentá de nuevo.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.tipo === 'chunk') setRespuesta(prev => prev + event.texto)
            if (event.tipo === 'final') setDone(true)
            if (event.tipo === 'error') setError(event.mensaje)
          } catch {}
        }
      }
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py={60}>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Group mb="md">
          <Button variant="subtle" size="xs" leftSection={<IconArrowLeft size={14} />} onClick={() => router.push(ROUTES.HOME)}>
            Volver
          </Button>
        </Group>

        <Title order={3} mb={4}>Consulta como invitado</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Completá tus datos y realizá tu consulta. Solo podés realizar una consulta por sesión.
        </Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md">
            {error}
          </Alert>
        )}

        <Stack>
          <Group grow>
            <TextInput label="Nombre" placeholder="Tu nombre" value={form.nombre} onChange={set('nombre')} disabled={done} />
            <TextInput label="Apellido" placeholder="Tu apellido" value={form.apellido} onChange={set('apellido')} disabled={done} />
          </Group>
          <TextInput label="Email" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} disabled={done} />
          <Select
            label="Institución (opcional)"
            placeholder={loadingInstituciones ? 'Cargando...' : 'Seleccioná tu institución'}
            data={instituciones}
            value={form.institucion || null}
            onChange={(v) => { setForm(prev => ({ ...prev, institucion: v ?? '' })); setError('') }}
            disabled={done || loadingInstituciones}
            clearable
            searchable
            nothingFoundMessage="No se encontraron opciones"
          />
          <Textarea
            label="Tu consulta"
            placeholder="Escribí tu consulta aquí (mínimo 10 caracteres)"
            minRows={3}
            value={form.mensaje}
            onChange={set('mensaje')}
            disabled={done}
          />

          {!done && (
            <Button
              fullWidth
              loading={loading}
              disabled={!isValid}
              onClick={handleConsultar}
              leftSection={<IconSend size={16} />}
            >
              Enviar consulta
            </Button>
          )}
        </Stack>

        {(respuesta || loading) && (
          <Box mt="xl">
            <Group mb="xs" gap="xs">
              {loading && !done && <Loader size="xs" />}
              {done && <IconCheck size={16} color="green" />}
              <Text fw={500} size="sm">{done ? 'Respuesta' : 'Generando respuesta...'}</Text>
            </Group>
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{respuesta}</Text>
            </Paper>
            {done && (
              <Text size="xs" c="dimmed" mt="sm" ta="center">
                Tu consulta fue registrada. Para más funcionalidades,{' '}
                <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => router.push(ROUTES.HOME)}>
                  iniciá sesión
                </Text>.
              </Text>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  )
}
