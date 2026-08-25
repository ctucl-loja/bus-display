import { timeToSeconds } from './ecuadorTime.js'
import { isObject } from './values.js'

// Horarios de un tramo en segundos, o null cuando no son utilizables. Ningún
// tramo con horario ilegible participa de una decisión temporal.
function startOf(step) {
  return isObject(step) ? timeToSeconds(step.start_schedule) : null
}

function endOf(step) {
  return isObject(step) ? timeToSeconds(step.end_schedule) : null
}

// Copia de los tramos ordenada cronológicamente. Ni el despacho ni la API local
// garantizan el orden del arreglo, así que la posición dentro de la lista solo
// es confiable después de ordenar por horario.
//
// Los tramos con horario ilegible NO se descartan —el conductor debe poder
// verlos igual— pero se mandan al final, donde no desplazan a los demás.
export function sortStepsBySchedule(steps) {
  if (!Array.isArray(steps)) return []

  return steps.filter(isObject).sort((a, b) => {
    const aStart = startOf(a)
    const bStart = startOf(b)
    if (aStart === null && bStart === null) return 0
    if (aStart === null) return 1
    if (bStart === null) return -1
    return aStart - bStart
  })
}

// Posición del tramo (step) que corresponde a `currentTime`:
//   1. el que contiene la hora actual (start <= ahora <= end);
//   2. si ninguno, el próximo que todavía no empieza;
//   3. si ya todos terminaron, el último del día.
//
// La búsqueda es independiente del orden del arreglo: "el próximo" es el de
// start_schedule más temprano entre los pendientes, no el que venga después en
// la lista. Devuelve -1 cuando no hay ningún tramo.
export function findCurrentStepIndex(steps, currentTime) {
  if (!Array.isArray(steps) || steps.length === 0) return -1

  const nowSec = timeToSeconds(currentTime)
  // Sin una hora fiable no se puede elegir por horario; se deja la decisión al
  // llamador en vez de inventar un tramo.
  if (nowSec === null) return -1

  const active = steps.findIndex((step) => {
    const start = startOf(step)
    const end = endOf(step)
    return start !== null && end !== null && nowSec >= start && nowSec <= end
  })
  if (active !== -1) return active

  let upcoming = -1
  let latest = -1

  steps.forEach((step, i) => {
    const start = startOf(step)
    if (start === null) return
    if (start > nowSec && (upcoming === -1 || start < startOf(steps[upcoming]))) {
      upcoming = i
    }
    if (latest === -1 || start > startOf(steps[latest])) {
      latest = i
    }
  })

  if (upcoming !== -1) return upcoming
  if (latest !== -1) return latest

  // Hay tramos, pero ninguno con horario legible: se muestra el primero para no
  // dejar la pantalla vacía.
  return 0
}

// Índice siempre dentro de rango. El despacho se recarga cada 60 s y puede
// traer menos tramos que antes: sin esto, el índice seleccionado quedaría fuera
// del arreglo y la tabla desaparecería sin explicación.
export function clampStepIndex(index, length) {
  if (!Number.isInteger(length) || length <= 0) return 0
  if (!Number.isFinite(index) || index < 0) return 0
  return Math.min(Math.trunc(index), length - 1)
}

// Tramo (step) cuyo horario programado contiene la hora actual; si ninguno
// coincide, devuelve el próximo tramo del día o, si ya todos pasaron, el último.
export function findCurrentStep(steps, currentTime) {
  const index = findCurrentStepIndex(steps, currentTime)
  return index === -1 ? null : (steps[index] ?? null)
}

// Dentro de un tramo, el punto de control actual es el último cuya hora
// programada ya pasó; el siguiente es el que viene después de ese.
//
// Un checkpoint sin hora programada no puede mover el puntero, pero tampoco
// interrumpe el recorrido: se salta y se sigue con el resto.
export function findCurrentAndNextCheckpoint(step, currentTime) {
  if (!isObject(step)) return { current: null, next: null }

  const checkpoints = Array.isArray(step.checkpoints) ? step.checkpoints.filter(isObject) : []
  if (checkpoints.length === 0) return { current: null, next: null }

  let current = checkpoints[0]
  let next = checkpoints[1] ?? null

  const nowSec = timeToSeconds(currentTime)
  if (nowSec === null) return { current, next }

  for (let i = 0; i < checkpoints.length; i += 1) {
    const scheduled = timeToSeconds(checkpoints[i].time_calculated)
    if (scheduled === null) continue
    if (scheduled > nowSec) break
    current = checkpoints[i]
    next = checkpoints[i + 1] ?? null
  }

  return { current, next }
}
