import { env } from '../config/env.js'

// GET /api/vehicle -> ficha del vehículo cacheada por bus_monitor en la RPi.
//
// La API local guarda la respuesta completa del backend remoto en `data` y
// duplica register/plate en columnas propias; aquí se aplana para que los
// componentes reciban la misma forma que entregaba el backend remoto.
export async function fetchVehicle() {
  const url = `${env.localApiUrl}/api/vehicle`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo obtener el vehículo (HTTP ${response.status})`)
  }

  const vehicle = await response.json()

  if (!vehicle) return null   // la RPi aún no ha cacheado el vehículo

  return {
    ...(vehicle.data ?? {}),
    register: vehicle.register,
    plate: vehicle.plate ?? vehicle.data?.plate ?? null,
  }
}
