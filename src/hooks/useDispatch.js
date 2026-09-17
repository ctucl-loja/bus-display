import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDispatch, refreshDispatch } from '../services/dispatchApi.js'
import { toISODate } from '../utils/ecuadorTime.js'

const REFRESH_INTERVAL_MS = 60 * 1000

// Mensaje final de una recarga manual, por estado del endpoint. Solo 'updated'
// y 'empty' cambiaron el itinerario; el resto lo dejaron intacto y así se dice.
const REFRESH_MESSAGES = {
  updated: { tone: 'ok' },
  empty: { tone: 'ok' },
  auth_error: { tone: 'error' },
  remote_error: { tone: 'error' },
  invalid: { tone: 'error' },
  save_error: { tone: 'error' },
}

const REFRESH_NETWORK_ERROR = {
  tone: 'error',
  detail: 'No se pudo contactar con el equipo. Se mantiene el itinerario anterior.',
}

// Trae el itinerario del día desde la API local de simtra-bus-manager y lo
// refresca periódicamente: el monitor de la RPi va escribiendo el time_reported
// de cada checkpoint en ese mismo despacho conforme el bus cruza las geocercas.
//
// status: 'loading' | 'ready' | 'empty' | 'error'   ← estado de LECTURA
//
// La recarga manual (`refresh`) tiene su propio estado —`refreshing` y
// `refreshResult`— separado del de lectura a propósito: mientras se recarga,
// Home debe seguir mostrando el itinerario actual con normalidad, no volver a
// "Cargando itinerario…".
export function useDispatch() {
  const [steps, setSteps] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState(null)

  // Secuencia de escritura. Cada actualización de `steps` lleva un número; una
  // respuesta con un número menor que el último aplicado se descarta.
  //
  // Sin esto, el polling de 60 s que salió ANTES de la recarga puede terminar
  // DESPUÉS y devolver el itinerario viejo encima del recién descargado: el
  // conductor vería el botón decir "actualizado" y los datos de siempre.
  const appliedRef = useRef(0)
  const sequenceRef = useRef(0)
  // El bloqueo de doble envío es un ref, no el estado `refreshing`: dos toques
  // seguidos en la pantalla táctil ocurren dentro del mismo ciclo de render, y
  // el segundo todavía leería `refreshing === false` en su clausura.
  const refreshingRef = useRef(false)
  // `cancelled` del efecto no alcanza para la recarga manual, que se dispara
  // desde un handler y puede resolverse después de desmontar la vista.
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Aplica un resultado solo si no llegó tarde. Devuelve si se aplicó.
  const applySteps = useCallback((result, ticket) => {
    if (!mountedRef.current || ticket < appliedRef.current) return false
    appliedRef.current = ticket
    setSteps(result)
    setStatus(result.length === 0 ? 'empty' : 'ready')
    setError(null)
    return true
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const ticket = ++sequenceRef.current
      try {
        const date = toISODate(new Date())
        const result = await fetchDispatch(date)
        if (!cancelled) applySteps(result, ticket)
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
  }, [applySteps])

  /**
   * Recarga manual: la API local vuelve a descargar el itinerario del backend
   * remoto, lo valida, lo guarda y lo devuelve.
   *
   * El resultado se aplica INMEDIATAMENTE (ya viene normalizado), sin esperar
   * al siguiente ciclo de 60 s. Si falla, el itinerario anterior se conserva.
   *
   * Es idempotente frente a toques repetidos: mientras hay una recarga en
   * curso, las siguientes llamadas no hacen nada.
   */
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return null
    refreshingRef.current = true

    setRefreshing(true)
    setRefreshResult(null)
    const ticket = ++sequenceRef.current

    try {
      const result = await refreshDispatch()

      // `steps: null` = la operación no tocó el itinerario (error remoto, de
      // guardado o payload inválido). Se conserva lo que ya se mostraba.
      if (result.steps !== null) {
        applySteps(result.steps, ticket)
      }

      if (mountedRef.current) {
        setRefreshResult({
          status: result.status,
          tone: REFRESH_MESSAGES[result.status]?.tone ?? 'error',
          detail: result.detail,
          preservedReports: result.preservedReports,
        })
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setRefreshResult({ status: 'remote_error', ...REFRESH_NETWORK_ERROR })
      }
      return { status: 'remote_error', detail: err.message, steps: null }
    } finally {
      refreshingRef.current = false
      if (mountedRef.current) setRefreshing(false)
    }
  }, [applySteps])

  const dismissRefreshResult = useCallback(() => setRefreshResult(null), [])

  return { steps, status, error, refresh, refreshing, refreshResult, dismissRefreshResult }
}
