import { useEffect, useState } from 'react'
import { fetchNetworkInfo } from '../services/networkApi.js'

// Las interfaces y el SSID cambian poco; 30 s es suficiente y evita ejecutar
// comandos del sistema en la RPi más de lo necesario (la API además cachea).
const REFRESH_INTERVAL_MS = 30 * 1000

/**
 * Conectividad del dispositivo.
 *
 * status: 'loading' | 'ready' | 'empty' | 'error'
 *
 *   loading → todavía no hubo una respuesta
 *   ready   → hay al menos una conexión
 *   empty   → respondió sin conexiones (mirar info.status para saber si fue
 *             'disconnected' o 'unavailable')
 *   error   → falló la consulta; `info` conserva la última respuesta válida
 */
export function useNetworkInfo() {
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    // El guard de "no solapar" es local a este efecto, NO un useRef: con un ref
    // compartido entre montajes, un remontaje mientras había una petición en
    // vuelo se saltaba su propia carga inicial y la vista se quedaba en
    // "Consultando…" hasta el siguiente intervalo.
    let inFlight = false

    async function load() {
      if (inFlight) return
      inFlight = true
      try {
        const result = await fetchNetworkInfo()
        if (cancelled) return
        setInfo(result)
        setStatus(result.connections.length > 0 ? 'ready' : 'empty')
      } catch {
        // No se limpia `info`: ante un fallo transitorio es preferible seguir
        // mostrando la última red conocida y avisar discretamente.
        if (!cancelled) setStatus('error')
      } finally {
        inFlight = false
      }
    }

    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { info, status }
}
