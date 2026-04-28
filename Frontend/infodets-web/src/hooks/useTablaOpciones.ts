'use client'

import { useState, useEffect } from 'react'
import { tablaService } from '@/services/api/tablaService'

export function useTablaOpciones(tablaId: string) {
  const [opciones, setOpciones] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    tablaService.comoOpciones(tablaId).then(setOpciones).catch(() => {})
  }, [tablaId])

  return opciones
}
