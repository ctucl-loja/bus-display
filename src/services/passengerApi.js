import { env } from '../config/env.js'
import { fetchJson } from './http.js'

// GET /api/passenger/today -> { date, total, passengers } de la API local.
//
// Solo interesa el total: la lista de pasajeros no se muestra, así que se
// descarta aquí para que el hook no cargue con ella. Un `total` que no sea un
// entero no negativo se trata como respuesta no válida, igual que un cuerpo
// vacío en `fetchJson`: el hook conserva entonces el último conteo bueno.
export async function fetchPassengersToday() {
  const data = await fetchJson(`${env.localApiUrl}/api/passenger/today`, 'los pasajeros de hoy')
  const total = data?.total

  if (!Number.isInteger(total) || total < 0) {
    throw new Error('Respuesta no válida al obtener los pasajeros de hoy')
  }

  return total
}
