import { useCallback, useEffect, useRef, useState } from 'react'
import { getEvents } from '../services/eventsApi.js'

const EVENT_TYPE = 'checkpoint_arrival'
const POLL_INTERVAL_MS = 1500
// Techo por consulta: si la pantalla estuvo ocupada o la API caída, se
// recuperan los eventos pendientes en tandas, sin perder ninguno.
const MAX_EVENTS_PER_POLL = 20

/**
 * Cola de llegadas confirmadas por bus_monitor.py.
 *
 * Al montar toma como línea base el id del último evento existente y NO lo
 * muestra: reiniciar la pantalla no debe disparar las llegadas de las últimas
 * horas. Desde ahí consulta incrementalmente con `after_id`.
 *
 * Devuelve { current, dismiss }: `current` es el evento que toca mostrar y
 * `dismiss` lo saca de la cola para dar paso al siguiente, de modo que varios
 * eventos seguidos se muestran uno detrás de otro y nunca superpuestos.
 */
export function useCheckpointEvents() {
  const [queue, setQueue] = useState([])
  const lastEventIdRef = useRef(null)   // null = línea base todavía sin establecer
  const inFlightRef = useRef(false)     // evita peticiones solapadas

  useEffect(() => {
    let cancelled = false

    // Línea base: el último evento ya ocurrido se usa como punto de partida y
    // se descarta. Si no hay ninguno, se arranca en 0 y se espera el primero.
    async function initialize() {
      try {
        const latest = await getEvents({ eventType: EVENT_TYPE, limit: 1 })
        if (cancelled) return
        lastEventIdRef.current = latest.length > 0 ? latest[0].id : 0
      } catch {
        // Sin línea base no se puede consultar de forma incremental: se
        // reintenta en el siguiente tick en vez de mostrar el histórico.
      }
    }

    async function poll() {
      if (inFlightRef.current) return

      if (lastEventIdRef.current === null) {
        inFlightRef.current = true
        try {
          await initialize()
        } finally {
          inFlightRef.current = false
        }
        return
      }

      inFlightRef.current = true
      try {
        const events = await getEvents({
          eventType: EVENT_TYPE,
          afterId: lastEventIdRef.current,
          limit: MAX_EVENTS_PER_POLL,
        })
        if (cancelled || events.length === 0) return

        // Llegan en orden ascendente por id: se encolan tal como ocurrieron.
        lastEventIdRef.current = events[events.length - 1].id
        setQueue((pending) => [...pending, ...events])
      } catch {
        // Fallo puntual de la API local (p. ej. FastAPI reiniciándose): se
        // conserva el estado y se reintenta en el siguiente intervalo.
      } finally {
        inFlightRef.current = false
      }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const dismiss = useCallback(() => {
    setQueue((pending) => pending.slice(1))
  }, [])

  return { current: queue[0] ?? null, dismiss }
}
