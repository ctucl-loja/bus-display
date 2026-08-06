import { useEffect, useState } from 'react'
import { fetchVehicle } from '../services/vehicleApi.js'
import { env } from '../config/env.js'

// Datos del vehículo (propietario, placa, cooperativa) para env.busRegister.
export function useVehicle() {
  const [vehicle, setVehicle] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    fetchVehicle(env.busRegister)
      .then((result) => {
        if (!cancelled) {
          setVehicle(result)
          setStatus('ready')
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
