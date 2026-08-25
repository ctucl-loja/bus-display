import { env } from '../config/env.js'
import { fetchJson } from './http.js'
import { normalizeVehicle } from './normalize.js'

// GET /api/vehicle -> ficha del vehículo cacheada por bus_monitor en la RPi.
// Devuelve null mientras la RPi todavía no la ha cacheado.
export async function fetchVehicle() {
  const vehicle = await fetchJson(`${env.localApiUrl}/api/vehicle`, 'el vehículo')
  return normalizeVehicle(vehicle)
}
