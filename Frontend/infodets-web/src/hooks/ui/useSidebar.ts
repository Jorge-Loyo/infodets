'use client'

import { useUiStore } from '@/store/uiStore'

export function useSidebar() {
  const { sidebarAbierto, toggleSidebar, setSidebar } = useUiStore()
  return { sidebarAbierto, toggleSidebar, setSidebar }
}
