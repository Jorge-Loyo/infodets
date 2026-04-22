'use client'

import {
  Box, Stack, Paper, Group, Avatar, Text, Title,
  Badge, ActionIcon, Divider, ThemeIcon, Button,
  Modal, Textarea, Select, TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconUser, IconEdit, IconTrash, IconPlus,
  IconNews, IconEye,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Noticia {
  id: string
  autor: string
  cargo: string
  fecha: string
  contenido: string
  categoria: string
  likes: number
  comentarios: number
  publicada: boolean
}

const NOTICIAS_MOCK: Noticia[] = [
  {
    id: '1',
    autor: 'Administración General',
    cargo: 'Dirección Institucional',
    fecha: 'Hace 2 horas',
    categoria: 'Institucional',
    contenido: 'Nos complace informar que el Sistema de Gestión de Conocimiento Dinámico INFODETS ha sido oficialmente puesto en marcha.',
    likes: 24,
    comentarios: 5,
    publicada: true,
  },
  {
    id: '2',
    autor: 'Departamento Legal',
    cargo: 'Área Jurídica',
    fecha: 'Hace 1 día',
    categoria: 'Normativa',
    contenido: 'Se informa a todo el personal que se han actualizado las normativas de licitación pública correspondientes al período 2024.',
    likes: 18,
    comentarios: 3,
    publicada: true,
  },
  {
    id: '3',
    autor: 'Recursos Humanos',
    cargo: 'Gestión de Personal',
    fecha: 'Hace 3 días',
    categoria: 'RRHH',
    contenido: 'Recordamos a todos los funcionarios que el plazo para la actualización de datos personales vence el próximo viernes.',
    likes: 31,
    comentarios: 8,
    publicada: false,
  },
]

const CATEGORIA_COLOR: Record<string, string> = {
  Institucional: 'blue',
  Normativa: 'violet',
  RRHH: 'teal',
  Tecnología: 'green',
  Finanzas: 'orange',
}

interface NoticiaForm {
  titulo: string
  contenido: string
  categoria: string
}

const FORM_INICIAL: NoticiaForm = { titulo: '', contenido: '', categoria: '' }

export default function AdminNoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS_MOCK)
  const [noticiaEditando, setNoticiaEditando] = useState<Noticia | null>(null)
  const [form, setForm] = useState<NoticiaForm>(FORM_INICIAL)

  const [modalNueva, { open: openNueva, close: closeNueva }] = useDisclosure(false)
  const [modalEditar, { open: openEditar, close: closeEditar }] = useDisclosure(false)
  const [modalEliminar, { open: openEliminar, close: closeEliminar }] = useDisclosure(false)
  const [idEliminar, setIdEliminar] = useState<string | null>(null)

  const handleEditar = (n: Noticia) => {
    setNoticiaEditando({ ...n })
    openEditar()
  }

  const handleConfirmarEliminar = (id: string) => {
    setIdEliminar(id)
    openEliminar()
  }

  const handleEliminar = () => {
    if (idEliminar) setNoticias((prev) => prev.filter((n) => n.id !== idEliminar))
    closeEliminar()
  }

  const togglePublicada = (id: string) => {
    setNoticias((prev) =>
      prev.map((n) => (n.id === id ? { ...n, publicada: !n.publicada } : n))
    )
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3}>Administrador de Noticias</Title>
            <Text c="dimmed" size="sm">Crea, edita y gestiona las publicaciones institucionales.</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} radius="md" onClick={openNueva}>
            Nueva noticia
          </Button>
        </Group>

        <Stack gap="md">
          {noticias.map((noticia, i) => (
            <motion.div
              key={noticia.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Paper withBorder radius="md" p="lg">
                <Stack gap="sm">

                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm">
                      <Avatar size={40} radius="xl" color="blue">
                        <IconUser size={18} />
                      </Avatar>
                      <div>
                        <Text fw={600} size="sm">{noticia.autor}</Text>
                        <Text size="xs" c="dimmed">{noticia.cargo} · {noticia.fecha}</Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge
                        variant="light"
                        color={CATEGORIA_COLOR[noticia.categoria] ?? 'gray'}
                        size="sm"
                      >
                        {noticia.categoria}
                      </Badge>
                      <Badge
                        variant="filled"
                        color={noticia.publicada ? 'green' : 'gray'}
                        size="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => togglePublicada(noticia.id)}
                      >
                        {noticia.publicada ? 'Publicada' : 'Borrador'}
                      </Badge>
                    </Group>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2} style={{ lineHeight: 1.6 }}>
                    {noticia.contenido}
                  </Text>

                  <Divider />

                  <Group justify="space-between">
                    <Group gap="md">
                      <Text size="xs" c="dimmed">❤️ {noticia.likes} likes</Text>
                      <Text size="xs" c="dimmed">💬 {noticia.comentarios} comentarios</Text>
                    </Group>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" color="blue" size="sm" radius="md">
                        <IconEye size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="yellow"
                        size="sm"
                        radius="md"
                        onClick={() => handleEditar(noticia)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        radius="md"
                        onClick={() => handleConfirmarEliminar(noticia.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                </Stack>
              </Paper>
            </motion.div>
          ))}
        </Stack>

      </motion.div>

      {/* Modal nueva noticia */}
      <Modal
        opened={modalNueva}
        onClose={() => { closeNueva(); setForm(FORM_INICIAL) }}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
              <IconNews size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">Nueva noticia</Text>
          </Group>
        }
        radius="md"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Título"
            placeholder="Título de la publicación"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.currentTarget.value })}
            radius="md"
          />
          <Select
            label="Categoría"
            placeholder="Selecciona una categoría"
            data={['Institucional', 'Normativa', 'RRHH', 'Tecnología', 'Finanzas']}
            value={form.categoria}
            onChange={(v) => setForm({ ...form, categoria: v ?? '' })}
            radius="md"
          />
          <Textarea
            label="Contenido"
            placeholder="Escribe el contenido de la publicación..."
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.currentTarget.value })}
            rows={5}
            radius="md"
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => { closeNueva(); setForm(FORM_INICIAL) }} radius="md">
              Cancelar
            </Button>
            <Button radius="md" onClick={closeNueva}>Publicar</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal editar noticia */}
      <Modal
        opened={modalEditar}
        onClose={closeEditar}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="yellow" radius="sm">
              <IconEdit size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">Editar noticia</Text>
          </Group>
        }
        radius="md"
        centered
        size="lg"
      >
        {noticiaEditando && (
          <Stack gap="md">
            <Select
              label="Categoría"
              data={['Institucional', 'Normativa', 'RRHH', 'Tecnología', 'Finanzas']}
              value={noticiaEditando.categoria}
              onChange={(v) => setNoticiaEditando({ ...noticiaEditando, categoria: v ?? noticiaEditando.categoria })}
              radius="md"
            />
            <Textarea
              label="Contenido"
              value={noticiaEditando.contenido}
              onChange={(e) => setNoticiaEditando({ ...noticiaEditando, contenido: e.currentTarget.value })}
              rows={5}
              radius="md"
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeEditar} radius="md">Cancelar</Button>
              <Button radius="md" onClick={closeEditar}>Guardar cambios</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        opened={modalEliminar}
        onClose={closeEliminar}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="red" radius="sm">
              <IconTrash size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">Eliminar noticia</Text>
          </Group>
        }
        radius="md"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            ¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeEliminar} radius="md">Cancelar</Button>
            <Button color="red" radius="md" onClick={handleEliminar}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
