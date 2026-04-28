'use client'

import {
  Box, Stack, Paper, Group, Avatar, Text, Title,
  Badge, ActionIcon, Divider, ThemeIcon, Skeleton,
} from '@mantine/core'
import { IconHeart, IconMessageCircle, IconShare3, IconBookmark, IconUser, IconNews } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { noticiaService, type Noticia } from '@/services/api/noticiaService'

const CATEGORIA_COLOR: Record<string, string> = {
  Institucional: 'blue', Normativa: 'violet', RRHH: 'teal', Tecnología: 'green', Finanzas: 'orange',
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:8000'

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [cargando, setCargando] = useState(true)
  const [likeados, setLikeados] = useState<Set<string>>(new Set())
  const [guardados, setGuardados] = useState<Set<string>>(new Set())

  useEffect(() => {
    noticiaService.listar(true).then(setNoticias).catch(() => {}).finally(() => setCargando(false))
  }, [])

  const toggleLike = async (n: Noticia) => {
    const sumar = !likeados.has(n.id)
    setLikeados((prev) => { const s = new Set(prev); sumar ? s.add(n.id) : s.delete(n.id); return s })
    try {
      const actualizada = await noticiaService.like(n.id, sumar)
      setNoticias((prev) => prev.map((x) => x.id === actualizada.id ? actualizada : x))
    } catch {}
  }

  const toggleGuardado = (id: string) => {
    setGuardados((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const formatFecha = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Hace unos minutos'
    if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`
    const d = Math.floor(h / 24)
    return `Hace ${d} día${d > 1 ? 's' : ''}`
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Box maw={680} mx="auto" py={32} px={16}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

              <Group gap="xs" mb="xl">
                <ThemeIcon size={32} radius="md" variant="light" color="blue"><IconNews size={18} /></ThemeIcon>
                <div>
                  <Title order={3}>Noticias generales</Title>
                  <Text size="xs" c="dimmed">Publicaciones institucionales</Text>
                </div>
              </Group>

              {cargando && (
                <Stack gap="md">
                  {[1, 2, 3].map((i) => <Skeleton key={i} height={180} radius="md" />)}
                </Stack>
              )}

              {!cargando && noticias.length === 0 && (
                <Stack align="center" py="xl">
                  <ThemeIcon size={48} variant="light" color="gray" radius="xl"><IconNews size={24} /></ThemeIcon>
                  <Text c="dimmed" size="sm">No hay noticias publicadas aún.</Text>
                </Stack>
              )}

              <Stack gap="md">
                {noticias.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Paper withBorder radius="md" p="lg">
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                          <Group gap="sm">
                            <Avatar size={44} radius="xl" color="blue"><IconUser size={20} /></Avatar>
                            <div>
                              <Text fw={600} size="sm">{n.autor_nombre ?? 'Administración'}</Text>
                              <Text size="xs" c="dimmed">{n.autor_cargo}</Text>
                              <Text size="xs" c="dimmed">{formatFecha(n.creado_en)}</Text>
                            </div>
                          </Group>
                          {n.categoria && (
                            <Badge variant="light" color={CATEGORIA_COLOR[n.categoria] ?? 'gray'} size="sm" radius="sm">
                              {n.categoria}
                            </Badge>
                          )}
                        </Group>

                        <Text fw={600} size="sm">{n.titulo}</Text>

                        {n.imagen_url && (
                          <div style={{ width: '100%', height: 280, borderRadius: 8, overflow: 'hidden' }}>
                            <img src={`${BACKEND_URL}${n.imagen_url}`} alt={n.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        <Text size="sm" style={{ lineHeight: 1.7 }}>{n.contenido}</Text>

                        <Divider />

                        <Group justify="space-between">
                          <Group gap="xs">
                            <motion.div whileTap={{ scale: 0.85 }}>
                              <ActionIcon variant={likeados.has(n.id) ? 'filled' : 'subtle'} color={likeados.has(n.id) ? 'red' : 'gray'} size="sm" radius="xl" onClick={() => toggleLike(n)}>
                                <IconHeart size={15} />
                              </ActionIcon>
                            </motion.div>
                            <Text size="xs" c="dimmed">{n.likes}</Text>
                            <ActionIcon variant="subtle" color="gray" size="sm" radius="xl"><IconMessageCircle size={15} /></ActionIcon>
                            <ActionIcon variant="subtle" color="gray" size="sm" radius="xl"><IconShare3 size={15} /></ActionIcon>
                          </Group>
                          <motion.div whileTap={{ scale: 0.85 }}>
                            <ActionIcon variant={guardados.has(n.id) ? 'filled' : 'subtle'} color={guardados.has(n.id) ? 'blue' : 'gray'} size="sm" radius="xl" onClick={() => toggleGuardado(n.id)}>
                              <IconBookmark size={15} />
                            </ActionIcon>
                          </motion.div>
                        </Group>
                      </Stack>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}
