import { timeToSeconds } from './ecuadorTime.js'

// Tramo (step) cuyo horario programado contiene la hora actual; si ninguno
// coincide, devuelve el próximo tramo del día o, si ya todos pasaron, el último.
export function findCurrentStep(steps, currentTime) {
  if (!steps || steps.length === 0) return null

  const nowSec = timeToSeconds(currentTime)

  const active = steps.find(
    (step) =>
      nowSec >= timeToSeconds(step.start_schedule) && nowSec <= timeToSeconds(step.end_schedule),
  )
  if (active) return active

  const upcoming = steps.find((step) => timeToSeconds(step.start_schedule) > nowSec)
  return upcoming ?? steps[steps.length - 1]
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
