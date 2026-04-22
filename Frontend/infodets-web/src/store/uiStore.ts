import { create } from 'zustand'

interface UiStore {
  sidebarAbierto: boolean
  toggleSidebar: () => void
  setSidebar: (abierto: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarAbierto: true,
  toggleSidebar: () => set((state) => ({ sidebarAbierto: !state.sidebarAbierto })),
  setSidebar: (abierto) => set({ sidebarAbierto: abierto }),
}))
