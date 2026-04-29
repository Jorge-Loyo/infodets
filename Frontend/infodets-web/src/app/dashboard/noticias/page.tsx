'use client'

import {
  Box, Stack, Paper, Group, Avatar, Text, Title,
  Badge, ActionIcon, Divider, ThemeIcon, Button,
  Modal, Textarea, Select, TextInput,
  LoadingOverlay, FileInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconUser, IconEdit, IconTrash, IconPlus, IconNews, IconPhoto, IconRefresh, IconEye, IconEyeOff } from '@tabler/icons-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:8000'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { noticiaService, type Noticia } from '@/services/api/noticiaService'
import { useTablaOpciones } from '@/hooks/useTablaOpciones'
import { useSessionStore } from '@/store/sessionStore'

const CATEGORIA_COLOR: Record<string, string> = {
  Institucional: 'blue', Normativa: 'violet', RRHH: 'teal', Tecnología: 'green', Finanzas: 'orange',
}

const FORM_VACIO = { titulo: '', contenido: '', categoria: '', autor_nombre: '', autor_cargo: '', imagen: null as File | null }

interface FormProps {
  form: typeof FORM_VACIO
  setForm: React.Dispatch<React.SetStateAction<typeof FORM_VACIO>>
  opcionesCategorias: { value: string; label: string }[]
}

function FormularioNoticia({ form, setForm, opcionesCategorias }: FormProps) {
  return (
    <Stack gap="md">
      <TextInput label="Título" placeholder="Título de la publicación" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} radius="md" required />
      <Select label="Categoría" placeholder="Selecciona una categoría" data={opcionesCategorias} value={form.categoria} onChange={(v) => setForm((f) => ({ ...f, categoria: v ?? '' }))} radius="md" />
      <Group grow>
        <TextInput label="Autor" placeholder="Nombre del autor" value={form.autor_nombre} onChange={(e) => setForm((f) => ({ ...f, autor_nombre: e.target.value }))} radius="md" />
        <TextInput label="Cargo" placeholder="Cargo del autor" value={form.autor_cargo} onChange={(e) => setForm((f) => ({ ...f, autor_cargo: e.target.value }))} radius="md" />
      </Group>
      <Textarea label="Contenido" placeholder="Escribe el contenido..." value={form.contenido} onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))} rows={5} radius="md" required />
      <FileInput label="Imagen (opcional)" placeholder="Selecciona una imagen" accept="image/*" leftSection={<IconPhoto size={16} />} value={form.imagen} onChange={(f) => setForm((prev) => ({ ...prev, imagen: f }))} radius="md" clearable />
      {form.imagen && (
        <div style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
          <img src={URL.createObjectURL(form.imagen)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </Stack>
  )
}

export default function AdminNoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState<Noticia | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [idEliminar, setIdEliminar] = useState<string | null>(null)
  const opcionesCategorias = useTablaOpciones('categorias_noticias')
  const { usuario } = useSessionStore()

  const [modalNueva, { open: openNueva, close: closeNueva }] = useDisclosure(false)
  const [modalEditar, { open: openEditar, close: closeEditar }] = useDisclosure(false)
  const [modalEliminar, { open: openEliminar, close: closeEliminar }] = useDisclosure(false)

  const cargar = async () => {
    setCargando(true)
    try {
      setNoticias(await noticiaService.listar())
    } catch {
      notifications.show({ color: 'red', message: 'Error al cargar noticias' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const buildForm = () => {
    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('contenido', form.contenido)
    if (form.categoria) fd.append('categoria', form.categoria)
    if (form.autor_nombre) fd.append('autor_nombre', form.autor_nombre)
    if (form.autor_cargo) fd.append('autor_cargo', form.autor_cargo)
    if (form.imagen) fd.append('imagen', form.imagen)
    return fd
  }

  const handleCrear = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) return
    setGuardando(true)
    try {
      const nueva = await noticiaService.crear(buildForm())
      setNoticias((prev) => [nueva, ...prev])
      setForm(FORM_VACIO)
      closeNueva()
      notifications.show({ color: 'green', message: 'Noticia creada como borrador' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al crear noticia' })
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = async () => {
    if (!editando) return
    setGuardando(true)
    try {
      const fd = buildForm()
      const actualizada = await noticiaService.actualizar(editando.id, fd)
      setNoticias((prev) => prev.map((n) => n.id === actualizada.id ? actualizada : n))
      closeEditar()
      notifications.show({ color: 'green', message: 'Noticia actualizada' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al actualizar noticia' })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!idEliminar) return
    try {
      await noticiaService.eliminar(idEliminar)
      setNoticias((prev) => prev.filter((n) => n.id !== idEliminar))
      closeEliminar()
      notifications.show({ color: 'green', message: 'Noticia eliminada' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al eliminar noticia' })
    }
  }

  const togglePublicada = async (n: Noticia) => {
    try {
      const fd = new FormData()
      fd.append('publicada', String(!n.publicada))
      const actualizada = await noticiaService.actualizar(n.id, fd)
      setNoticias((prev) => prev.map((x) => x.id === actualizada.id ? actualizada : x))
    } catch {
      notifications.show({ color: 'red', message: 'Error al cambiar estado' })
    }
  }

  const abrirEditar = (n: Noticia) => {
    setEditando(n)
    setForm({ titulo: n.titulo, contenido: n.contenido, categoria: n.categoria ?? '', autor_nombre: n.autor_nombre ?? '', autor_cargo: n.autor_cargo ?? '', imagen: null })
    openEditar()
  }

  return (
    <Box p={32} pos="relative">
      <LoadingOverlay visible={cargando} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3}>Administrador de Noticias</Title>
            <Text c="dimmed" size="sm">Crea, edita y gestiona las publicaciones institucionales.</Text>
          </div>
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={16} />} variant="light" radius="md" onClick={cargar}>Actualizar</Button>
            <Button leftSection={<IconPlus size={16} />} radius="md" onClick={() => { setForm({ ...FORM_VACIO, autor_nombre: usuario?.nombre ?? '', autor_cargo: usuario?.cargo ?? '' }); openNueva() }}>
              Nueva noticia
            </Button>
          </Group>
        </Group>

        <Stack gap="md">
          {noticias.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Paper withBorder radius="md" p="lg">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm">
                      <Avatar size={40} radius="xl" color="blue"><IconUser size={18} /></Avatar>
                      <div>
                        <Text fw={600} size="sm">{n.autor_nombre ?? 'Sin autor'}</Text>
                        <Text size="xs" c="dimmed">{n.autor_cargo} · {new Date(n.creado_en).toLocaleDateString('es-AR')}</Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      {n.categoria && <Badge variant="light" color={CATEGORIA_COLOR[n.categoria] ?? 'gray'} size="sm">{n.categoria}</Badge>}
                      <Button
                        size="xs"
                        radius="md"
                        variant={n.publicada ? 'filled' : 'light'}
                        color={n.publicada ? 'green' : 'gray'}
                        leftSection={n.publicada ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                        onClick={() => togglePublicada(n)}
                      >
                        {n.publicada ? 'Publicada' : 'Publicar'}
                      </Button>
                    </Group>
                  </Group>

                  <Text fw={600} size="sm">{n.titulo}</Text>

                  {n.imagen_url && (
                    <div style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
                      <img src={`${BACKEND_URL}${n.imagen_url}`} alt={n.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <Text size="sm" c="dimmed" lineClamp={2} style={{ lineHeight: 1.6 }}>{n.contenido}</Text>

                  <Divider />

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">❤️ {n.likes} likes</Text>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" color="yellow" size="sm" radius="md" onClick={() => abrirEditar(n)}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" radius="md" onClick={() => { setIdEliminar(n.id); openEliminar() }}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Group>
                </Stack>
              </Paper>
            </motion.div>
          ))}

          {!cargando && noticias.length === 0 && (
            <Stack align="center" py="xl">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl"><IconNews size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No hay noticias. Crea la primera.</Text>
            </Stack>
          )}
        </Stack>
      </motion.div>

      <Modal opened={modalNueva} onClose={closeNueva} title="Nueva noticia" radius="md" size="lg">
        <FormularioNoticia form={form} setForm={setForm} opcionesCategorias={opcionesCategorias} />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={closeNueva}>Cancelar</Button>
          <Button loading={guardando} onClick={handleCrear}>Crear borrador</Button>
        </Group>
      </Modal>

      <Modal opened={modalEditar} onClose={closeEditar} title="Editar noticia" radius="md" size="lg">
        <FormularioNoticia form={form} setForm={setForm} opcionesCategorias={opcionesCategorias} />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={closeEditar}>Cancelar</Button>
          <Button loading={guardando} onClick={handleEditar}>Guardar cambios</Button>
        </Group>
      </Modal>

      <Modal opened={modalEliminar} onClose={closeEliminar} title="Eliminar noticia" radius="md" centered size="sm">
        <Text size="sm" c="dimmed" mb="md">¿Eliminar esta noticia? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={closeEliminar}>Cancelar</Button>
          <Button color="red" onClick={handleEliminar}>Eliminar</Button>
        </Group>
      </Modal>
    </Box>
  )
}
