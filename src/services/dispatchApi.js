import { env } from '../config/env.js'
import { fetchJson } from './http.js'
import { normalizeSteps, normalizeDispatchRefresh } from './normalize.js'
import { isObject } from '../utils/values.js'

// GET /api/dispatch -> último despacho cacheado por bus_monitor en la RPi.
//
// La API local guarda un solo despacho ({ date, register, data: [steps] }) —
// el del bus configurado en la RPi — así que no recibe register ni date por
// query: la fecha se valida aquí para no mostrar el itinerario de ayer si el
// monitor todavía no recargó los despachos del día.
//
// Siempre devuelve un array de tramos ya normalizados.
export async function fetchDispatch(date) {
  const dispatch = await fetchJson(`${env.localApiUrl}/api/dispatch`, 'el itinerario')

  if (!isObject(dispatch)) return []       // null (aún sin cache) u otra forma
  if (dispatch.date !== date) return []    // cache de otro día: se ignora

  return normalizeSteps(dispatch.data)
}

// POST /api/dispatch/refresh -> la API local vuelve a descargar el itinerario
// del día del backend remoto SIMTRA, lo valida, lo guarda y lo devuelve.
//
// No es un GET repetido: `fetchDispatch` solo lee lo que ya está cacheado en la
// RPi, así que si el monitor no ha recargado, devuelve exactamente lo mismo una
// y otra vez. Esta llamada dispara el viaje completo
//
//     pantalla → API local → backend remoto → validación → persistencia
//
// y la respuesta ya trae el itinerario efectivamente guardado.
//
// La pantalla NO envía registro, fecha ni credenciales: el registro sale de
// FAST_API_BUS_REGISTER y la fecha del reloj del equipo en America/Guayaquil.
// Ninguna credencial del backend remoto llega jamás al frontend.
//
// Devuelve { status, detail, date, steps, preservedReports }:
//   steps = array de tramos normalizados cuando la operación cambió el
//           itinerario ('updated', o [] con 'empty' = hoy no hay despachos)
//   steps = null en cualquier error -> NO se toca lo que ya se está mostrando.
export async function refreshDispatch() {
  const response = await fetch(`${env.localApiUrl}/api/dispatch/refresh`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(`No se pudo recargar el itinerario (HTTP ${response.status})`)
  }

  try {
    return normalizeDispatchRefresh(await response.json())
  } catch {
    throw new Error('Respuesta no válida al recargar el itinerario')
  }
}
