import { env } from '../config/env.js'

// GET /api/dispatch -> último despacho cacheado por bus_monitor en la RPi.
//
// La API local guarda un solo despacho ({ date, register, data: [steps] }) —
// el del bus configurado en la RPi — así que no recibe register ni date por
// query: la fecha se valida aquí para no mostrar el itinerario de ayer si el
// monitor todavía no recargó los despachos del día.
export async function fetchDispatch(date) {
  const url = `${env.localApiUrl}/api/dispatch`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo obtener el itinerario (HTTP ${response.status})`)
  }

  const dispatch = await response.json()

  if (!dispatch) return []          // la RPi aún no ha cacheado ningún despacho
  if (dispatch.date !== date) return []   // cache de otro día: se ignora

  return dispatch.data ?? []
}
