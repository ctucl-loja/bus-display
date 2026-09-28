import { useEffect, useState } from 'react'
import { fetchPassengersToday } from '../services/passengerApi.js'

// El conteo sube con cada pasajero que registra el equipo, así que se refresca
// con frecuencia; 30 s basta para una pantalla que se mira de vez en cuando.
const REFRESH_INTERVAL_MS = 30 * 1000

// Conteo de pasajeros del día desde la API local.
// status: 'loading' | 'ready' | 'error'
export function usePassengersToday() {
  const [total, setTotal] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchPassengersToday()
        if (cancelled) return
        setTotal(result)
        setStatus('ready')
      } catch {
        // Se conserva el último conteo válido ante un fallo puntual.
        if (!cancelled) setStatus('error')
      }
    }

    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { total, status }
}
