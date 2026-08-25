import { timeToSeconds } from './ecuadorTime.js'

// Copia de los tramos ordenada cronológicamente. Ni el despacho ni la API local
// garantizan el orden del arreglo, así que la posición dentro de la lista solo
// es confiable después de ordenar por horario.
export function sortStepsBySchedule(steps) {
  if (!steps || steps.length === 0) return []
  return [...steps].sort(
    (a, b) => timeToSeconds(a.start_schedule) - timeToSeconds(b.start_schedule),
  )
}

// Posición del tramo (step) que corresponde a `currentTime`:
//   1. el que contiene la hora actual (start <= ahora <= end);
//   2. si ninguno, el próximo que todavía no empieza;
//   3. si ya todos terminaron, el último del día.
//
// La búsqueda es independiente del orden del arreglo: "el próximo" es el de
// start_schedule más temprano entre los pendientes, no el que venga después en
// la lista. Devuelve -1 cuando no hay tramos.
export function findCurrentStepIndex(steps, currentTime) {
  if (!steps || steps.length === 0) return -1

  const nowSec = timeToSeconds(currentTime)
  const startOf = (step) => timeToSeconds(step.start_schedule)

  const active = steps.findIndex(
    (step) => nowSec >= startOf(step) && nowSec <= timeToSeconds(step.end_schedule),
  )
  if (active !== -1) return active

  let upcoming = -1
  let latest = 0

  steps.forEach((step, i) => {
    if (startOf(step) > nowSec && (upcoming === -1 || startOf(step) < startOf(steps[upcoming]))) {
      upcoming = i
    }
    if (startOf(step) > startOf(steps[latest])) {
      latest = i
    }
  })

  return upcoming !== -1 ? upcoming : latest
}

// Tramo (step) cuyo horario programado contiene la hora actual; si ninguno
// coincide, devuelve el próximo tramo del día o, si ya todos pasaron, el último.
export function findCurrentStep(steps, currentTime) {
  const index = findCurrentStepIndex(steps, currentTime)
  return index === -1 ? null : steps[index]
}

// Dentro de un tramo, el punto de control actual es el último cuya hora
// programada ya pasó; el siguiente es el que viene después de ese.
export function findCurrentAndNextCheckpoint(step, currentTime) {
  if (!step) return { current: null, next: null }

  const nowSec = timeToSeconds(currentTime)
  const { checkpoints } = step

  let current = checkpoints[0]
  let next = checkpoints[1] ?? null

  for (let i = 0; i < checkpoints.length; i += 1) {
    if (timeToSeconds(checkpoints[i].time_calculated) <= nowSec) {
      current = checkpoints[i]
      next = checkpoints[i + 1] ?? null
    } else {
      break
    }
  }

  return { current, next }
}
