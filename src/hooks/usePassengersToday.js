import { useEffect, useState } from 'react'
import { fetchPassengersToday } from '../services/passengerApi.js'

// El conteo sube con cada pasajero que registra el equipo y la vista de
// métricas debe mostrar siempre el último sin salir y volver a entrar. La API
// es local (misma RPi), así que consultarla cada pocos segundos es barato.
const REFRESH_INTERVAL_MS = 5 * 1000
// Menor que el intervalo: una petición colgada no debe frenar las siguientes.
const REQUEST_TIMEOUT_MS = 4 * 1000

// Conteo de pasajeros del día desde la API local.
// status: 'loading' | 'ready' | 'error'
// updatedAt: Date de la última lectura válida (null hasta la primera).
export function usePassengersToday() {
  const [total, setTotal] = useState(null)
  const [status, setStatus] = useState('loading')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    let cancelled = false
    // Evita solapar peticiones si la API tarda más que el intervalo.
    let inFlight = false

    async function load() {
      if (inFlight || document.hidden) return
      inFlight = true
      try {
        const result = await fetchPassengersToday({ timeoutMs: REQUEST_TIMEOUT_MS })
        if (cancelled) return
        setTotal(result)
        setStatus('ready')
        setUpdatedAt(new Date())
      } catch {
        // Se conserva el último conteo válido ante un fallo puntual.
        if (!cancelled) setStatus('error')
      } finally {
        inFlight = false
      }
    }

    // Al volver a la pestaña o a la ventana se refresca en el acto, sin
    // esperar al siguiente tick.
    function refreshWhenVisible() {
      if (!document.hidden) load()
    }

    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [])

  return { total, status, updatedAt }
}
