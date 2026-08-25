export const ECUADOR_TIME_ZONE = 'America/Guayaquil'

// Formato YYYY-MM-DD (requerido por la API) en zona horaria de Ecuador.
export function toISODate(date) {
  return date.toLocaleDateString('en-CA', { timeZone: ECUADOR_TIME_ZONE })
}

// Formato HH:MM:SS en zona horaria de Ecuador: la misma forma en que el
// despacho expresa start_schedule, end_schedule y time_calculated, así que
// sirve tanto para el reloj del navbar como para comparar contra horarios.
export function toEcuadorTime(date) {
  return date.toLocaleTimeString('es-EC', {
    timeZone: ECUADOR_TIME_ZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 'HH:MM:SS' (o 'HH:MM') -> segundos desde medianoche, o null si no es un
// horario utilizable. Devolver null y no NaN es deliberado: NaN se propaga en
// silencio por cada comparación y termina eligiendo el tramo equivocado.
const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/

export function timeToSeconds(hhmmss) {
  if (typeof hhmmss !== 'string') return null

  const match = TIME_PATTERN.exec(hhmmss.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = match[3] === undefined ? 0 : Number(match[3])

  if (hours > 23 || minutes > 59 || seconds > 59) return null

  return hours * 3600 + minutes * 60 + seconds
}
