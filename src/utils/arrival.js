// Presentación de los eventos `checkpoint_arrival`.
//
// La pantalla NO calcula puntualidad: usa `difference_seconds` tal como lo
// envía bus_monitor.py, para que ambos sistemas hablen de la misma marcación.

export const ARRIVAL_STATUS = {
  ON_TIME: 'ON_TIME',
  EARLY: 'EARLY',
  LATE: 'LATE',
}

// El estado técnico viaja en el evento; la traducción vive aquí.
export const ARRIVAL_LABELS = {
  [ARRIVAL_STATUS.ON_TIME]: 'A TIEMPO',
  [ARRIVAL_STATUS.EARLY]: 'ADELANTADO',
  [ARRIVAL_STATUS.LATE]: 'ATRASADO',
}

// Signo que acompaña a la diferencia. Nunca se depende solo del color.
export const ARRIVAL_SIGNS = {
  [ARRIVAL_STATUS.ON_TIME]: '✓',
  [ARRIVAL_STATUS.EARLY]: '−',
  [ARRIVAL_STATUS.LATE]: '+',
}

/** "18 s" · "2 min 15 s" · "1 min 05 s" (siempre en valor absoluto). */
export function formatDifference(seconds) {
  const total = Math.abs(Math.round(seconds ?? 0))
  if (total < 60) return `${total} s`

  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes} min ${String(rest).padStart(2, '0')} s`
}

/** "06:41:02" -> "06:41" (los segundos solo importan en la diferencia). */
export function formatClock(time) {
  const match = String(time ?? '').match(/^(\d{2}:\d{2})/)
  return match ? match[1] : '--:--'
}
