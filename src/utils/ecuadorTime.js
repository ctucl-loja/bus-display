export const ECUADOR_TIME_ZONE = 'America/Guayaquil'

// Formato YYYY-MM-DD (requerido por la API) en zona horaria de Ecuador.
export function toISODate(date) {
  return date.toLocaleDateString('en-CA', { timeZone: ECUADOR_TIME_ZONE })
}

export function timeToSeconds(hhmmss) {
  const [h, m, s] = hhmmss.split(':').map(Number)
  return h * 3600 + m * 60 + (s || 0)
}
