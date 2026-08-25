import { useEffect, useState } from 'react'
import { fetchDispatch } from '../services/dispatchApi.js'
import { toISODate } from '../utils/ecuadorTime.js'

const REFRESH_INTERVAL_MS = 60 * 1000

// Trae el itinerario del día desde la API local de simtra-bus-manager y lo
// refresca periódicamente: el monitor de la RPi va escribiendo el time_reported
// de cada checkpoint en ese mismo despacho conforme el bus cruza las geocercas.
// status: 'loading' | 'ready' | 'empty' | 'error'
export function useDispatch() {
  const [steps, setSteps] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const date = toISODate(new Date())
        const result = await fetchDispatch(date)
        if (!cancelled) {
          setSteps(result)
          setStatus(result.length === 0 ? 'empty' : 'ready')
        }
      } catch (err) {
        // No se vacía `steps`: ante un fallo transitorio de la API local es
        // preferible seguir mostrando el itinerario que ya se tenía, marcando
        // el estado como 'error'.
        if (!cancelled) {
          setError(err)
          setStatus('error')
        }
      }
    }

    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { steps, status, error }
}
