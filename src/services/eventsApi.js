import { env } from '../config/env.js'

// GET /api/events -> canal local de eventos de simtra-bus-manager.
//
// Con `afterId` la respuesta es incremental (solo eventos con id mayor) y llega
// en orden ascendente, que es justo lo que necesita el polling de la pantalla.
export async function getEvents({ eventType, afterId, limit } = {}) {
  const params = new URLSearchParams()
  if (eventType) params.set('event_type', eventType)
  if (afterId != null) params.set('after_id', String(afterId))
  if (limit != null) params.set('limit', String(limit))

  const query = params.toString()
  const url = `${env.localApiUrl}/api/events${query ? `?${query}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudieron obtener los eventos (HTTP ${response.status})`)
  }

  return await response.json()
}
