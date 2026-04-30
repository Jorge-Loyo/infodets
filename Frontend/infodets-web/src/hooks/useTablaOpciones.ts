'use client'

import { useState, useEffect } from 'react'
import { tablaService } from '@/services/api/tablaService'
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/v1'

export function useTablaOpciones(tablaId: string, publico = false) {
  const [opciones, setOpciones] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (publico) {
      axios.get(`${API_BASE}/tablas/${tablaId}`, { params: { solo_activos: true } })
        .then(res => setOpciones(res.data.map((i: { valor: string }) => ({ value: i.valor, label: i.valor }))))
        .catch(() => {})
    } else {
      tablaService.comoOpciones(tablaId).then(setOpciones).catch(() => {})
    }
  }, [tablaId, publico])

  return opciones
}
