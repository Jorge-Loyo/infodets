import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MensajeHistorial {
  pregunta: string
  respuesta: string
  confianza: number
  creado_en: string
}

export interface ConversacionHistorial {
  conversacionId: string
  mensajes: MensajeHistorial[]
}

interface UiStore {
  sidebarAbierto: boolean
  toggleSidebar: () => void
  setSidebar: (abierto: boolean) => void
  consultasCount: number
  incrementarConsultas: () => void
  conversacionCargada: ConversacionHistorial | null
  cargarConversacion: (c: ConversacionHistorial) => void
  limpiarConversacion: () => void
  noLeidos: number
  setNoLeidos: (n: number) => void
  noticiasNoLeidas: number
  setNoticiasNoLeidas: (n: number) => void
  ultimaVisitaNoticias: string
  marcarNoticiasVistas: () => void
  // Tema visual
  headerColor: string
  paletaColor: string
  tipografia: string
  logoUrl: string
  logoSize: number
  colorScheme: 'light' | 'dark'
  // Colores personalizados
  colorSidebar: string
  colorTexto: string
  colorBoton: string
  colorFondo: string
  colorTarjeta: string
  setHeaderColor: (c: string) => void
  setPaletaColor: (c: string) => void
  setTipografia: (t: string) => void
  setLogoUrl: (url: string) => void
  setLogoSize: (s: number) => void
  setColorScheme: (s: 'light' | 'dark') => void
  setColoresPersonalizados: (c: { colorSidebar?: string, colorTexto?: string, colorBoton?: string, colorFondo?: string, colorTarjeta?: string }) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarAbierto: true,
      toggleSidebar: () => set((state) => ({ sidebarAbierto: !state.sidebarAbierto })),
      setSidebar: (abierto) => set({ sidebarAbierto: abierto }),
      consultasCount: 0,
      incrementarConsultas: () => set((state) => ({ consultasCount: state.consultasCount + 1 })),
      conversacionCargada: null,
      cargarConversacion: (c) => set({ conversacionCargada: c }),
      limpiarConversacion: () => set({ conversacionCargada: null }),
      noLeidos: 0,
      setNoLeidos: (n) => set({ noLeidos: n }),
      noticiasNoLeidas: 0,
      setNoticiasNoLeidas: (n) => set({ noticiasNoLeidas: n }),
      ultimaVisitaNoticias: new Date(0).toISOString(),
      marcarNoticiasVistas: () => set({ noticiasNoLeidas: 0, ultimaVisitaNoticias: new Date().toISOString() }),
      // Tema visual
      headerColor: '#ffffff',
      paletaColor: 'blue',
      tipografia: 'Plus Jakarta Sans',
      logoUrl: '',
      logoSize: 32,
      colorScheme: 'light' as const,
      // Colores personalizados
      colorSidebar: '',
      colorTexto: '',
      colorBoton: '',
      colorFondo: '',
      colorTarjeta: '',
      setHeaderColor: (c) => set({ headerColor: c }),
      setPaletaColor: (c) => set({ paletaColor: c }),
      setTipografia: (t) => set({ tipografia: t }),
      setLogoUrl: (url) => set({ logoUrl: url }),
      setLogoSize: (s) => set({ logoSize: s }),
      setColorScheme: (s) => set({ colorScheme: s }),
      setColoresPersonalizados: (c) => set(c),
    }),
    {
      name: 'infodets-ui',
      partialize: (state) => ({
        ultimaVisitaNoticias: state.ultimaVisitaNoticias,
        headerColor: state.headerColor,
        paletaColor: state.paletaColor,
        tipografia: state.tipografia,
        logoUrl: state.logoUrl,
        logoSize: state.logoSize,
        colorScheme: state.colorScheme,
        colorSidebar: state.colorSidebar,
        colorTexto: state.colorTexto,
        colorBoton: state.colorBoton,
        colorFondo: state.colorFondo,
        colorTarjeta: state.colorTarjeta,
      }),
    }
  )
)
