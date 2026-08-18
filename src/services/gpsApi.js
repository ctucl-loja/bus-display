import { env } from '../config/env.js'

// GET /api/gps/last_position -> última lectura del GPS guardada en la RPi.
// Devuelve null mientras el receptor todavía no ha reportado ninguna posición.
export async function fetchLastPosition() {
  const url = `${env.localApiUrl}/api/gps/last_position`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo obtener la posición GPS (HTTP ${response.status})`)
  }

  const data = await response.json()

  if (!data) return null

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    speed: data.speed == null ? null : Number(data.speed),
    timestamp: data.timestamp,
  }
}
