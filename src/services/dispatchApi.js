import { env } from '../config/env.js'

// GET /api/dispatch/:register?date=YYYY-MM-DD -> itinerario del bus para ese día.
export async function fetchDispatch(register, date) {
  const url = `${env.backendUrl}/api/dispatch/${register}?date=${date}`

  const response = await fetch(url, {
   
  })

  if (!response.ok) {
    throw new Error(`No se pudo obtener el itinerario (HTTP ${response.status})`)
  }

  const data = await response.json()
  return data.result
}
