import { useCallback, useEffect, useRef, useState } from 'react'
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
 *
 * `refresh()` fuerza una consulta inmediata y `apply(info)` publica una
 * información ya obtenida. Los usa la vista de Configuración tras conectar a
 * una red: esperar hasta 30 s mostraría la IP de la red anterior como si fuera
 * la actual.
 */
export function useNetworkInfo() {
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState('loading')

  // La consulta manual se dispara desde un handler y puede resolverse después
  // de desmontar la vista, así que el guard vive en refs y no en el efecto.
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const publish = useCallback((result) => {
    if (!mountedRef.current || !result) return
    setInfo(result)
    setStatus(result.connections.length > 0 ? 'ready' : 'empty')
  }, [])

  const load = useCallback(async () => {
    if (inFlightRef.current) return null
    inFlightRef.current = true
    try {
      const result = await fetchNetworkInfo()
      publish(result)
      return result
    } catch {
      // No se limpia `info`: ante un fallo transitorio es preferible seguir
      // mostrando la última red conocida y avisar discretamente.
      if (mountedRef.current) setStatus('error')
      return null
    } finally {
      inFlightRef.current = false
    }
  }, [publish])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  return { info, status, refresh: load, apply: publish }
}
