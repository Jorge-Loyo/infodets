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
    }),
    {
      name: 'infodets-ui',
      partialize: (state) => ({
        ultimaVisitaNoticias: state.ultimaVisitaNoticias,
      }),
    }
  )
)
