import { useEffect, useState } from 'react'
import { fetchLastPosition } from '../services/gpsApi.js'

// El GPS escribe en la API local con mucha más frecuencia que el despacho
// cambia, así que se consulta cada pocos segundos para que el marcador siga
// al bus en el mapa.
const REFRESH_INTERVAL_MS = 3 * 1000

// Última posición conocida del bus. status: 'loading' | 'ready' | 'empty' | 'error'.
// Ante un error de red se conserva la última posición recibida: es preferible
// mostrarla (marcada como desactualizada) a dejar el mapa sin bus.
export function useGpsPosition() {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchLastPosition()
        if (cancelled) return
        setPosition(result)
        setStatus(result ? 'ready' : 'empty')
      } catch {
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

  return { position, status }
}
