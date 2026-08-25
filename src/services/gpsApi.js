import { env } from '../config/env.js'
import { fetchJson } from './http.js'
import { normalizeGpsPosition } from './normalize.js'

// GET /api/gps/last_position -> última lectura del GPS guardada en la RPi.
// Devuelve null mientras el receptor no haya reportado una posición utilizable.
export async function fetchLastPosition() {
  const data = await fetchJson(`${env.localApiUrl}/api/gps/last_position`, 'la posición GPS')
  return normalizeGpsPosition(data)
}
