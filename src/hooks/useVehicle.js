import { useEffect, useState } from 'react'
import { fetchVehicle } from '../services/vehicleApi.js'

// La ficha del vehículo cambia como mucho una vez al día, pero SÍ hay que
// reintentar: en el arranque de la RPi, Chromium suele montar la pantalla antes
// de que uvicorn responda. Con una sola petición, la tarjeta se quedaba en
// "No se pudo cargar el vehículo" hasta que alguien recargara a mano — y en un
// kiosco sin teclado eso es permanente.
const REFRESH_INTERVAL_MS = 60 * 1000

// Datos del vehículo (propietario, placa, cooperativa) desde la API local.
// status: 'loading' | 'ready' | 'empty' | 'error'
export function useVehicle() {
  const [vehicle, setVehicle] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchVehicle()
        if (cancelled) return
        setVehicle(result)
        setStatus(result ? 'ready' : 'empty')
      } catch {
        // Se conserva la última ficha válida: es preferible mostrarla a vaciar
        // la tarjeta por un fallo puntual de la API local.
        if (!cancelled) setStatus('error')
      }
    }

    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { vehicle, status }
}
