import { env } from '../config/env.js'
import { fetchJson } from './http.js'
import { normalizeSteps } from './normalize.js'
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
