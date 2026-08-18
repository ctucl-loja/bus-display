import { useEffect, useState } from 'react'
import { fetchVehicle } from '../services/vehicleApi.js'

// Datos del vehículo (propietario, placa, cooperativa) desde la API local.
// status: 'loading' | 'ready' | 'empty' | 'error'
export function useVehicle() {
  const [vehicle, setVehicle] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    fetchVehicle()
      .then((result) => {
        if (!cancelled) {
          setVehicle(result)
          setStatus(result ? 'ready' : 'empty')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { vehicle, status }
}
