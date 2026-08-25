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

export function timeToSeconds(hhmmss) {
  const [h, m, s] = hhmmss.split(':').map(Number)
  return h * 3600 + m * 60 + (s || 0)
}
