'use client'

import {
  Box, Title, Text, Paper, Grid, Stack, Group, Button,
  ColorInput, Select, Divider, ThemeIcon, Image,
  FileInput, ActionIcon, Tooltip, Badge, Slider, SimpleGrid, Switch,
} from '@mantine/core'
import {
  IconPalette, IconTypography, IconPhoto, IconRefresh, IconCheck,
  IconWand, IconLayoutSidebar, IconTextSize, IconSquareRounded, IconBorderAll,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useUiStore } from '@/store/uiStore'
import axiosInstance from '@/lib/axiosInstance'

const TIPOGRAFIAS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (por defecto)' },
  { value: 'Inter, sans-serif',  label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Georgia, serif',     label: 'Georgia' },
  { value: 'system-ui, sans-serif', label: 'Sistema' },
]

const PALETAS = [
  { value: 'blue',   label: 'Azul' },
  { value: 'violet', label: 'Violeta' },
  { value: 'teal',   label: 'Verde azulado' },
  { value: 'green',  label: 'Verde' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'orange', label: 'Naranja' },
  { value: 'red',    label: 'Rojo' },
  { value: 'gray',   label: 'Gris' },
]

const TEMAS_PREDEFINIDOS = [
  { label: 'Estándar',       headerColor: '#ffffff', paletaColor: 'blue',   tipografia: 'Plus Jakarta Sans', colorScheme: 'light' as const, esPersonalizado: false, colores: null },
  { label: 'Moderno',        headerColor: '#5c2d91', paletaColor: 'violet', tipografia: 'Inter, sans-serif',  colorScheme: 'dark'  as const, esPersonalizado: false, colores: null },
  {
    label: 'Ciudad',
    headerColor: '#38485C',
    paletaColor: 'yellow',
    tipografia: 'Plus Jakarta Sans',
    colorScheme: 'light' as const,
    esPersonalizado: false,
    colores: {
      colorFondo:    '#F3F6F9',
      colorSidebar:  '#38485C',
      colorTarjeta:  '#ffffff',
      colorTexto:    '#38485C',
      colorBoton:    '#FFDB2E',
    },
  },
  { label: 'Personalizado',  headerColor: null,      paletaColor: null,     tipografia: null,                 colorScheme: null,             esPersonalizado: true,  colores: null  },
]

const PREGUNTAS_COLORES = [
  { key: 'colorFondo',   label: 'Fondo general',   icono: IconBorderAll,     descripcion: '¿Qué color querés para el fondo de la página?' },
  { key: 'colorSidebar', label: 'Menú lateral',    icono: IconLayoutSidebar, descripcion: '¿Qué color querés para la barra de navegación?' },
  { key: 'colorTarjeta', label: 'Tarjetas',        icono: IconSquareRounded, descripcion: '¿Qué color querés para las cards y paneles?' },
  { key: 'colorTexto',   label: 'Texto',           icono: IconTextSize,      descripcion: '¿Qué color querés para el texto principal?' },
  { key: 'colorBoton',   label: 'Botones',         icono: IconPalette,       descripcion: '¿Qué color querés para los botones de acción?' },
]

export default function TemasPage() {
  const {
    headerColor, paletaColor, tipografia, logoUrl, logoSize, colorScheme,
    colorSidebar, colorTexto, colorBoton, colorFondo, colorTarjeta,
    setHeaderColor, setPaletaColor, setTipografia, setLogoUrl, setLogoSize,
    setColorScheme, setColoresPersonalizados, setTemaActivo,
  } = useUiStore()

  const [localHeader, setLocalHeader]         = useState(headerColor)
  const [localPaleta, setLocalPaleta]         = useState(paletaColor)
  const [localTipo, setLocalTipo]             = useState(tipografia)
  const [localLogo, setLocalLogo]             = useState(logoUrl)
  const [localLogoSize, setLocalLogoSize]     = useState(logoSize)
  const [localColorScheme, setLocalColorScheme] = useState(colorScheme)
  const [archivoLogo, setArchivoLogo]         = useState<File | null>(null)
  const [temaActivoLocal, setTemaActivoLocal] = useState<string | null>(null)
  const [localColores, setLocalColores]       = useState({ colorFondo, colorSidebar, colorTarjeta, colorTexto, colorBoton })

  const esPersonalizado = temaActivoLocal === 'Personalizado'
  const haycambios = localHeader !== headerColor || localPaleta !== paletaColor || localTipo !== tipografia || localLogo !== logoUrl || localLogoSize !== logoSize || localColorScheme !== colorScheme

  const aplicarTema = async () => {
    try {
      const urlFinal = await subirLogoAlBackend()
      setHeaderColor(localHeader)
      setPaletaColor(localPaleta)
      setTipografia(localTipo)
      setLogoUrl(urlFinal)
      setLogoSize(localLogoSize)
      setColorScheme(localColorScheme)
      if (esPersonalizado || temaActivoLocal === 'Ciudad') setColoresPersonalizados(localColores)
      setTemaActivo(temaActivoLocal ?? 'Estándar')
      notifications.show({ color: 'green', message: 'Tema aplicado correctamente ✅' })
    } catch {
      notifications.show({ color: 'red', message: 'Error al subir el logo' })
    }
  }

  const resetear = () => {
    setLocalHeader('#ffffff'); setLocalPaleta('blue'); setLocalTipo('Plus Jakarta Sans')
    setLocalLogo(''); setLocalLogoSize(32); setLocalColorScheme('light')
    setArchivoLogo(null); setTemaActivoLocal('Estándar')
    setLocalColores({ colorFondo: '', colorSidebar: '', colorTarjeta: '', colorTexto: '', colorBoton: '' })
  }

  const seleccionarTema = (tema: typeof TEMAS_PREDEFINIDOS[0]) => {
    setTemaActivoLocal(tema.label)
    if (tema.esPersonalizado) return
    setLocalHeader(tema.headerColor!)
    setLocalPaleta(tema.paletaColor!)
    setLocalTipo(tema.tipografia!)
    setLocalColorScheme(tema.colorScheme!)
    if (tema.colores) setLocalColores(tema.colores)
  }

  const handleLogo = async (file: File | null) => {
    setArchivoLogo(file)
    if (file) {
      // Preview local inmediata
      const reader = new FileReader()
      reader.onload = (e) => setLocalLogo(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      // Eliminar logo del backend
      try {
        await axiosInstance.delete('/sistema/logo')
      } catch {}
      setLocalLogo('')
    }
  }

  const subirLogoAlBackend = async (): Promise<string> => {
    if (!archivoLogo) return localLogo
    const form = new FormData()
    form.append('archivo', archivoLogo)
    const res = await axiosInstance.post<{ logo_url: string }>('/sistema/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Construir URL absoluta apuntando al backend
    const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:8000'
    const url = res.data.logo_url.startsWith('http') ? res.data.logo_url : `${docsUrl}${res.data.logo_url}`
    return url
  }

  return (
    <Box p={32}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Encabezado */}
        <Group justify="space-between" align="flex-start" mb="xl">
          <div>
            <Title order={3}>Temas y Visualización</Title>
            <Text c="dimmed" size="sm" mt={4}>Personaliza la apariencia de la plataforma.</Text>
          </div>
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={16} />} variant="subtle" color="gray" radius="md" onClick={resetear}>
              Restablecer
            </Button>
            <Button leftSection={<IconCheck size={16} />} radius="md" onClick={aplicarTema} disabled={!haycambios}>
              Aplicar cambios
            </Button>
          </Group>
        </Group>

        <Stack gap="xl">

          {/* ── SECCIÓN 1: Logo ─────────────────────────────── */}
          <Paper withBorder radius="md" p="xl">
            <Group mb="lg" gap="xs">
              <ThemeIcon size={36} radius="md" variant="light" color="teal"><IconPhoto size={20} /></ThemeIcon>
              <div>
                <Text fw={600}>Logo del sistema</Text>
                <Text size="xs" c="dimmed">Aplica a todos los temas.</Text>
              </div>
            </Group>
            <Grid align="center">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap="sm">
                  <FileInput
                    placeholder="📁  Cargar logo"
                    accept="image/*"
                    value={archivoLogo}
                    onChange={handleLogo}
                    radius="md"
                    clearable
                    styles={{
                      input: { cursor: 'pointer', backgroundColor: 'var(--mantine-color-blue-6)', color: 'white', fontWeight: 600, border: 'none', textAlign: 'center', fontSize: '14px', height: '42px', boxShadow: '0 2px 8px rgba(28,126,214,0.4)' },
                      placeholder: { color: 'white', opacity: 1, textAlign: 'center', width: '100%' },
                    }}
                  />
                  {localLogo && (
                    <Tooltip label="Quitar logo">
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setLocalLogo(''); setArchivoLogo(null); setLocalLogoSize(32) }}>
                        <IconRefresh size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                {localLogo ? (
                  <Stack gap={6}>
                    <Text size="sm" fw={500}>Tamaño: {localLogoSize}px</Text>
                    <Slider
                      min={20} max={80} step={2}
                      value={localLogoSize} onChange={setLocalLogoSize}
                      marks={[{ value: 20, label: 'S' }, { value: 40, label: 'M' }, { value: 60, label: 'L' }, { value: 80, label: 'XL' }]}
                      radius="md" color="teal" mb={16}
                    />
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center">Cargá un logo para ajustar el tamaño.</Text>
                )}
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                  <Stack align="center" gap="xs">
                    {localLogo ? (
                      <>
                        <Image src={localLogo} alt="Logo preview" h={localLogoSize} fit="contain" />
                        <Badge size="xs" color="teal">Vista previa — {localLogoSize}px</Badge>
                      </>
                    ) : (
                      <>
                        <Text fw={700} size="lg" c="blue">INFODETS</Text>
                        <Badge size="xs" color="gray">Texto por defecto</Badge>
                      </>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* ── SECCIÓN 2: Temas ────────────────────────────── */}
          <Paper withBorder radius="md" p="xl">
            <Group mb="lg" gap="xs">
              <ThemeIcon size={36} radius="md" variant="light" color="blue"><IconPalette size={20} /></ThemeIcon>
              <div>
                <Text fw={600}>Tema</Text>
                <Text size="xs" c="dimmed">Seleccioná una base visual para la plataforma.</Text>
              </div>
            </Group>
            <Group gap="md">
              {TEMAS_PREDEFINIDOS.map((tema) => (
                <motion.div key={tema.label} whileHover={{ y: -3 }} style={{ flex: 1, minWidth: 100, maxWidth: 160 }}>
                  <Paper
                    withBorder radius="md" p="md"
                    style={{ cursor: 'pointer', textAlign: 'center', outline: temaActivoLocal === tema.label ? '2px solid var(--mantine-color-blue-6)' : 'none', outlineOffset: 3 }}
                    onClick={() => seleccionarTema(tema)}
                  >
                    {tema.esPersonalizado ? (
                      <Box style={{ height: 40, borderRadius: 8, background: 'linear-gradient(135deg, #1c7ed6, #9c36b5, #f08c00)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconWand size={18} color="white" />
                      </Box>
                    ) : tema.label === 'Ciudad' ? (
                      <Box style={{ height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 10, display: 'flex' }}>
                        <Box style={{ flex: 1, backgroundColor: '#38485C' }} />
                        <Box style={{ width: 14, backgroundColor: '#FFDB2E' }} />
                        <Box style={{ flex: 2, backgroundColor: '#F3F6F9' }} />
                      </Box>
                    ) : (
                      <Box style={{ height: 40, borderRadius: 8, backgroundColor: tema.headerColor!, border: '1px solid var(--mantine-color-default-border)', marginBottom: 10 }} />
                    )}
                    <Text size="sm" fw={600}>{tema.label}</Text>
                    {temaActivoLocal === tema.label && <Badge size="xs" color="blue" mt={4}>Activo</Badge>}
                  </Paper>
                </motion.div>
              ))}
            </Group>
          </Paper>

          {/* ── SECCIÓN 3: Ajustes generales ────────────────── */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder radius="md" p="xl" h="100%">
                <Group mb="lg" gap="xs">
                  <ThemeIcon size={36} radius="md" variant="light" color="orange"><IconPalette size={20} /></ThemeIcon>
                  <div>
                    <Text fw={600}>Apariencia general</Text>
                    <Text size="xs" c="dimmed">Modo de color y tipografía.</Text>
                  </div>
                </Group>
                <Stack gap="md">
                  <Group justify="space-between" p="sm" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
                    <div>
                      <Text size="sm" fw={500}>Modo oscuro</Text>
                      <Text size="xs" c="dimmed">Cambia toda la interfaz al modo oscuro</Text>
                    </div>
                    <Switch
                      checked={localColorScheme === 'dark'}
                      onChange={e => setLocalColorScheme(e.currentTarget.checked ? 'dark' : 'light')}
                      color="blue"
                    />
                  </Group>
                  <Select
                    label="Tipografía"
                    data={TIPOGRAFIAS}
                    value={localTipo}
                    onChange={v => setLocalTipo(v ?? 'Plus Jakarta Sans')}
                    radius="md"
                  />
                  <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-default-hover)">
                    <Text size="sm" style={{ fontFamily: localTipo }}>
                      Texto de ejemplo — {localTipo.split(',')[0]}
                    </Text>
                  </Paper>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Paleta — siempre visible */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder radius="md" p="xl" h="100%">
                <Group mb="lg" gap="xs">
                  <ThemeIcon size={36} radius="md" variant="light" color="violet"><IconTypography size={20} /></ThemeIcon>
                  <div>
                    <Text fw={600}>Color de acento</Text>
                    <Text size="xs" c="dimmed">Color principal de botones y elementos activos.</Text>
                  </div>
                </Group>
                <Stack gap="md">
                  <Select
                    label="Paleta"
                    data={PALETAS}
                    value={localPaleta}
                    onChange={v => setLocalPaleta(v ?? 'blue')}
                    radius="md"
                    disabled={!esPersonalizado}
                    description={!esPersonalizado ? 'Seleccioná el tema Personalizado para editar' : undefined}
                  />
                  <Group gap="sm" wrap="wrap">
                    {PALETAS.map(p => (
                      <Tooltip key={p.value} label={p.label} withArrow>
                        <Box
                          onClick={() => esPersonalizado && setLocalPaleta(p.value)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            cursor: esPersonalizado ? 'pointer' : 'default',
                            backgroundColor: `var(--mantine-color-${p.value}-6)`,
                            outline: localPaleta === p.value ? '3px solid var(--mantine-color-gray-7)' : 'none',
                            outlineOffset: 2,
                            opacity: esPersonalizado ? 1 : 0.5,
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Color barra — solo Personalizado */}
            {esPersonalizado && (
              <Grid.Col span={12}>
                <Paper withBorder radius="md" p="xl">
                  <Group mb="lg" gap="xs">
                    <ThemeIcon size={36} radius="md" variant="light" color="orange"><IconPalette size={20} /></ThemeIcon>
                    <div>
                      <Text fw={600}>Color de la barra superior</Text>
                      <Text size="xs" c="dimmed">Solo disponible en tema Personalizado.</Text>
                    </div>
                  </Group>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <ColorInput
                        label="Color de fondo"
                        value={localHeader}
                        onChange={setLocalHeader}
                        radius="md" format="hex"
                        swatches={['#ffffff', '#1a1b1e', '#003087', '#2d6a4f', '#5c2d91', '#1c7ed6', '#f8f9fa']}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" fw={500} mb={6}>Vista previa</Text>
                      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                        <Box style={{ backgroundColor: localHeader, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Box style={{ width: 24, height: 14, borderRadius: 3, background: 'rgba(128,128,128,0.3)' }} />
                          <Text fw={700} size="sm" c="blue">INFODETS</Text>
                        </Box>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Grid.Col>
            )}
          </Grid>

          {/* ── SECCIÓN 4: Colores personalizados ───────────── */}
          {esPersonalizado && (
            <Paper withBorder radius="md" p="xl">
              <Group mb="lg" gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="pink"><IconWand size={20} /></ThemeIcon>
                <div>
                  <Text fw={600}>Colores de la interfaz</Text>
                  <Text size="xs" c="dimmed">Definí cada color respondiendo las preguntas.</Text>
                </div>
              </Group>
              <Divider mb="lg" />
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {PREGUNTAS_COLORES.map((p, i) => (
                  <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Paper withBorder p="md" radius="md">
                      <Group mb="sm" gap="xs">
                        <ThemeIcon size={30} radius="md" variant="light" color="pink"><p.icono size={15} /></ThemeIcon>
                        <Text size="sm" fw={600}>{p.label}</Text>
                      </Group>
                      <Text size="xs" c="dimmed" mb="sm">{p.descripcion}</Text>
                      <ColorInput
                        placeholder="Elegí un color..."
                        value={localColores[p.key as keyof typeof localColores]}
                        onChange={v => setLocalColores(prev => ({ ...prev, [p.key]: v }))}
                        radius="md" format="hex"
                        swatches={['#ffffff', '#1a1b1e', '#1c7ed6', '#2d6a4f', '#5c2d91', '#f08c00', '#e03131', '#f8f9fa', '#212529']}
                      />
                      {localColores[p.key as keyof typeof localColores] && (
                        <Box mt="xs" style={{ height: 6, borderRadius: 4, backgroundColor: localColores[p.key as keyof typeof localColores] }} />
                      )}
                    </Paper>
                  </motion.div>
                ))}
              </SimpleGrid>
            </Paper>
          )}

        </Stack>
      </motion.div>
    </Box>
  )
}
