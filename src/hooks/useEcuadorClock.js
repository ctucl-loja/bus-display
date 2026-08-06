import { useEffect, useState } from 'react'
import { ECUADOR_TIME_ZONE } from '../utils/ecuadorTime.js'

function formatDate(date) {
  const formatted = date.toLocaleDateString('es-EC', {
    timeZone: ECUADOR_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTime(date) {
  return date.toLocaleTimeString('es-EC', {
    timeZone: ECUADOR_TIME_ZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Reloj en vivo (fecha + hora) en zona horaria de Ecuador, basado en el reloj del sistema.
export function useEcuadorClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return { date: formatDate(now), time: formatTime(now) }
}
