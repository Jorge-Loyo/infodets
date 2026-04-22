'use client'

import {
  Box, Stack, Paper, Group, Avatar, Text, Title,
  Badge, ActionIcon, Divider, Image, ThemeIcon,
} from '@mantine/core'
import {
  IconHeart, IconMessageCircle, IconShare3,
  IconBookmark, IconDots, IconUser, IconNews,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'

interface Noticia {
  id: string
  autor: string
  cargo: string
  fecha: string
  contenido: string
  imagen?: string
  categoria: string
  likes: number
  comentarios: number
  liked: boolean
  guardado: boolean
}

const NOTICIAS_MOCK: Noticia[] = [
  {
    id: '1',
    autor: 'Administración General',
    cargo: 'Dirección Institucional',
    fecha: 'Hace 2 horas',
    categoria: 'Institucional',
    contenido: 'Nos complace informar que el Sistema de Gestión de Conocimiento Dinámico INFODETS ha sido oficialmente puesto en marcha. Este sistema permitirá a todos los funcionarios acceder de forma rápida y precisa a la normativa vigente, resoluciones y documentos institucionales mediante consultas en lenguaje natural.',
    likes: 24,
    comentarios: 5,
    liked: false,
    guardado: false,
  },
  {
    id: '2',
    autor: 'Departamento Legal',
    cargo: 'Área Jurídica',
    fecha: 'Hace 1 día',
    categoria: 'Normativa',
    contenido: 'Se informa a todo el personal que se han actualizado las normativas de licitación pública correspondientes al período 2024. Los documentos ya se encuentran disponibles en el sistema para su consulta. Se recomienda revisar especialmente los artículos 12 al 18 que contienen modificaciones sustanciales respecto al año anterior.',
    likes: 18,
    comentarios: 3,
    liked: true,
    guardado: true,
  },
  {
    id: '3',
    autor: 'Recursos Humanos',
    cargo: 'Gestión de Personal',
    fecha: 'Hace 3 días',
    categoria: 'RRHH',
    contenido: 'Recordamos a todos los funcionarios que el plazo para la actualización de datos personales en el sistema vence el próximo viernes. Es importante mantener la información actualizada para garantizar la correcta gestión de beneficios y comunicaciones institucionales. Ante cualquier consulta, comunicarse con el área de RRHH.',
    likes: 31,
    comentarios: 8,
    liked: false,
    guardado: false,
  },
]

const CATEGORIA_COLOR: Record<string, string> = {
  Institucional: 'blue',
  Normativa: 'violet',
  RRHH: 'teal',
  Tecnología: 'green',
  Finanzas: 'orange',
}

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS_MOCK)

  const toggleLike = (id: string) => {
    setNoticias((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, liked: !n.liked, likes: n.liked ? n.likes - 1 : n.likes + 1 }
          : n
      )
    )
  }

  const toggleGuardado = (id: string) => {
    setNoticias((prev) =>
      prev.map((n) => (n.id === id ? { ...n, guardado: !n.guardado } : n))
    )
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
                <ThemeIcon size={32} radius="md" variant="light" color="blue">
                  <IconNews size={18} />
                </ThemeIcon>
                <div>
                  <Title order={3}>Noticias generales</Title>
                  <Text size="xs" c="dimmed">Publicaciones institucionales</Text>
                </div>
              </Group>

              <Stack gap="md">
                {noticias.map((noticia, i) => (
                  <motion.div
                    key={noticia.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Paper withBorder radius="md" p="lg">
                      <Stack gap="md">

                        {/* Header de la publicación */}
                        <Group justify="space-between" align="flex-start">
                          <Group gap="sm">
                            <Avatar size={44} radius="xl" color="blue">
                              <IconUser size={20} />
                            </Avatar>
                            <div>
                              <Text fw={600} size="sm">{noticia.autor}</Text>
                              <Text size="xs" c="dimmed">{noticia.cargo}</Text>
                              <Text size="xs" c="dimmed">{noticia.fecha}</Text>
                            </div>
                          </Group>
                          <Group gap="xs">
                            <Badge
                              variant="light"
                              color={CATEGORIA_COLOR[noticia.categoria] ?? 'gray'}
                              size="sm"
                              radius="sm"
                            >
                              {noticia.categoria}
                            </Badge>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        {/* Contenido */}
                        <Text size="sm" style={{ lineHeight: 1.7 }}>
                          {noticia.contenido}
                        </Text>

                        <Divider />

                        {/* Acciones */}
                        <Group justify="space-between">
                          <Group gap="xs">
                            <motion.div whileTap={{ scale: 0.85 }}>
                              <ActionIcon
                                variant={noticia.liked ? 'filled' : 'subtle'}
                                color={noticia.liked ? 'red' : 'gray'}
                                size="sm"
                                radius="xl"
                                onClick={() => toggleLike(noticia.id)}
                              >
                                <IconHeart size={15} />
                              </ActionIcon>
                            </motion.div>
                            <Text size="xs" c="dimmed">{noticia.likes}</Text>

                            <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                              <IconMessageCircle size={15} />
                            </ActionIcon>
                            <Text size="xs" c="dimmed">{noticia.comentarios}</Text>

                            <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                              <IconShare3 size={15} />
                            </ActionIcon>
                          </Group>

                          <motion.div whileTap={{ scale: 0.85 }}>
                            <ActionIcon
                              variant={noticia.guardado ? 'filled' : 'subtle'}
                              color={noticia.guardado ? 'blue' : 'gray'}
                              size="sm"
                              radius="xl"
                              onClick={() => toggleGuardado(noticia.id)}
                            >
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
