import { useEffect, useState } from 'react'
import { fetchDispatch } from '../services/dispatchApi.js'
import { env } from '../config/env.js'
import { toISODate } from '../utils/ecuadorTime.js'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

// Trae el itinerario del bus (env.busRegister) para el día actual y lo
// refresca periódicamente para que siga vigente durante toda la jornada.
export function useDispatch() {
  const [steps, setSteps] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const date = toISODate(new Date())
        const result = await fetchDispatch(env.busRegister, date)
        if (!cancelled) {
          setSteps(result)
          setStatus('ready')
        }
      } catch (err) {
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
