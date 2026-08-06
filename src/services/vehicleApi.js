import { env } from '../config/env.js'

// GET /api/vehicle/register/:register -> datos del vehículo, propietario y cooperativa.
export async function fetchVehicle(register) {
  const url = `${env.backendUrl}/api/vehicle/register/${register}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo obtener el vehículo (HTTP ${response.status})`)
  }

  const data = await response.json()
  return data.result
}
