// Estado temporal de la Home: qué vuelta está en curso y cuál viene después.
//
// Vive aparte de `itinerary.js` porque responde una pregunta DISTINTA. Compara:
//
//   findCurrentStep(steps, hora)  → «qué tramo hay que mostrar»: devuelve el
//       activo; si no hay ninguno, el próximo; y si ya terminaron todos, el
//       último. Nunca devuelve null habiendo tramos, y por eso su resultado
//       NO prueba que el tramo esté en curso. Mapa e Itinerario lo siguen
//       usando tal cual — ahí siempre hay que pintar algo.
//
//   resolveHomeSchedule(steps, hora) → «en qué momento del día está el bus»:
//       distingue explícitamente antes de la primera vuelta, en curso, entre
//       vueltas y terminada la jornada. Home necesita esa diferencia: presentar
//       como activa una vuelta que no ha empezado haría que el conductor viera
//       puntos de control como si los estuviera recorriendo.
//
// Todo aquí es puro: sin React, sin fetch, sin relojes propios. La hora llega
// como 'HH:MM:SS' desde `useEcuadorClock`.

import { sortStepsBySchedule } from './itinerary.js'
import { timeToSeconds } from './ecuadorTime.js'
import { isObject } from './values.js'

// ─────────────────────────────────────────────
// FASES
// ─────────────────────────────────────────────

export const NO_SCHEDULE = 'no_schedule'   // no hay itinerario cargado para hoy
export const UNSCHEDULED = 'unscheduled'   // hay vueltas, pero ninguna con horario legible
export const UNKNOWN_TIME = 'unknown_time' // no se pudo leer la hora actual
export const BEFORE_FIRST = 'before_first' // el recorrido del día todavía no empieza
export const ACTIVE = 'active'             // hay una vuelta en curso
export const BETWEEN = 'between'           // una terminó y la siguiente no ha empezado
export const AFTER_LAST = 'after_last'     // terminaron todas las vueltas del día

function startOf(step) {
  return isObject(step) ? timeToSeconds(step.start_schedule) : null
}

function endOf(step) {
  return isObject(step) ? timeToSeconds(step.end_schedule) : null
}

/** ¿La vuelta tiene una ventana temporal utilizable? Sin ella no puede estar «en curso». */
export function hasUsableSchedule(step) {
  return startOf(step) !== null && endOf(step) !== null
}

/**
 * Momento del día según el itinerario.
 *
 * Devuelve siempre la misma forma:
 *
 *   {
 *     phase,          // una de las constantes de arriba
 *     currentStep,    // la vuelta EN CURSO; null en cualquier otra fase
 *     previousStep,   // la última que terminó (solo en BETWEEN y AFTER_LAST)
 *     nextStep,       // la próxima vuelta programada, o null
 *     steps,          // la lista ordenada (copia; el original no se muta)
 *   }
 *
 * `currentStep` solo tiene valor cuando el reloj cae DENTRO de la ventana de una
 * vuelta. Ese es todo el punto de este módulo: quien lo consuma puede confiar en
 * que un `currentStep` no nulo significa «el bus está haciendo este recorrido».
 *
 * ── Criterio del límite entre dos vueltas ──────────────────────────────────
 *
 * Las ventanas son CERRADAS por los dos extremos (`start <= ahora <= end`),
 * igual que en `findCurrentStepIndex`. Si una vuelta termina a las 07:00:00 y la
 * siguiente empieza a las 07:00:00, ese segundo pertenece a la que TERMINA: se
 * elige la de `start_schedule` más temprano.
 *
 * Dos motivos:
 *
 *   1. Coincide con `findCurrentStep`, así que Home, Mapa e Itinerario no se
 *      contradicen durante ese segundo. El último punto de control de la vuelta
 *      que cierra suele estar justo en esa hora, y es el que el conductor tiene
 *      delante.
 *   2. La vuelta siguiente se busca SIEMPRE por posición posterior en la lista
 *      ordenada, nunca por horario, así que el mismo step no puede aparecer
 *      arriba y abajo aunque compartan el instante.
 *
 * Las vueltas con horario ilegible no pueden estar en curso ni ser elegidas como
 * próxima: `sortStepsBySchedule` las manda al final de la lista, y seleccionar
 * «la última» sin más las escogería por accidente.
 */
export function resolveHomeSchedule(steps, currentTime) {
  // `sortStepsBySchedule` filtra y ordena sobre una copia: el arreglo que llega
  // de la API no se toca.
  const sorted = sortStepsBySchedule(steps)

  const empty = {
    phase: NO_SCHEDULE,
    currentStep: null,
    previousStep: null,
    nextStep: null,
    steps: sorted,
  }

  if (sorted.length === 0) return empty

  const nowSec = timeToSeconds(currentTime)
  if (nowSec === null) {
    // Sin hora fiable no se puede afirmar nada sobre la secuencia del día. Se
    // dice eso en vez de elegir una vuelta al azar.
    return { ...empty, phase: UNKNOWN_TIME }
  }

  // Índice de la vuelta EN CURSO. `findIndex` sobre la lista ya ordenada por
  // `start_schedule` ascendente implementa el criterio del límite: ante dos
  // ventanas que se solapan gana la de inicio más temprano.
  const activeIndex = sorted.findIndex((step) => {
    if (!hasUsableSchedule(step)) return false
    return nowSec >= startOf(step) && nowSec <= endOf(step)
  })

  if (activeIndex !== -1) {
    return {
      phase: ACTIVE,
      currentStep: sorted[activeIndex],
      previousStep: null,
      // Por POSICIÓN, no por horario: así el mismo step nunca puede salir en
      // las dos tarjetas, ni siquiera si dos vueltas comparten `start_schedule`.
      nextStep: nextScheduledFrom(sorted, activeIndex + 1),
      steps: sorted,
    }
  }

  // No hay ninguna en curso. Se sitúa el reloj respecto de las que sí tienen
  // horario legible.
  const scheduled = sorted.filter((step) => startOf(step) !== null)

  if (scheduled.length === 0) {
    // Hay vueltas, pero ninguna con horario utilizable: no se puede afirmar
    // ninguna secuencia temporal.
    return { ...empty, phase: UNSCHEDULED }
  }

  const upcoming = scheduled.find((step) => startOf(step) > nowSec) ?? null

  // La última que ya empezó (y por tanto ya terminó, porque ninguna está en
  // curso). `scheduled` está ordenada, así que es la última que cumple.
  let previous = null
  for (const step of scheduled) {
    if (startOf(step) <= nowSec) previous = step
  }

  if (previous === null) {
    // Todas están por delante: el recorrido del día aún no ha empezado.
    return { phase: BEFORE_FIRST, currentStep: null, previousStep: null, nextStep: upcoming, steps: sorted }
  }

  if (upcoming === null) {
    // Ya empezaron todas y ninguna sigue en curso: la jornada terminó.
    return { phase: AFTER_LAST, currentStep: null, previousStep: previous, nextStep: null, steps: sorted }
  }

  return { phase: BETWEEN, currentStep: null, previousStep: previous, nextStep: upcoming, steps: sorted }
}

/** Primera vuelta con `start_schedule` legible a partir de `from` (incluido), o null. */
function nextScheduledFrom(sorted, from) {
  for (let i = from; i < sorted.length; i += 1) {
    if (startOf(sorted[i]) !== null) return sorted[i]
  }
  return null
}

// ─────────────────────────────────────────────
// TEXTOS
//
// Aquí y no en el componente para poder probarlos: el texto de cada fase es
// parte del contrato de la pantalla, no decoración.
// ─────────────────────────────────────────────

export const SCHEDULE_UNAVAILABLE = 'Horario no disponible'

// Mensaje de la tarjeta superior cuando NO hay una vuelta en curso.
const CURRENT_LAP_MESSAGES = {
  [NO_SCHEDULE]: 'No hay un itinerario cargado para hoy. Usa «Volver a cargar itinerario» para consultar el servidor.',
  [UNSCHEDULED]: 'Las vueltas de hoy no tienen un horario utilizable.',
  [UNKNOWN_TIME]: 'No se pudo determinar la hora actual del equipo.',
  [BEFORE_FIRST]: 'El recorrido del día aún no inicia.',
  [BETWEEN]: 'No hay una vuelta en curso.',
  [AFTER_LAST]: 'El itinerario del día finalizó.',
}

// Mensaje de la tarjeta inferior cuando no hay una vuelta siguiente.
const NEXT_LAP_MESSAGES = {
  [NO_SCHEDULE]: 'Sin itinerario cargado.',
  [UNSCHEDULED]: SCHEDULE_UNAVAILABLE,
  [UNKNOWN_TIME]: 'No se puede determinar la siguiente vuelta.',
  [ACTIVE]: 'No hay más líneas programadas después de la actual.',
  [AFTER_LAST]: 'El itinerario del día finalizó: no hay más vueltas programadas.',
  [BETWEEN]: 'No hay más vueltas programadas.',
  [BEFORE_FIRST]: 'No hay vueltas programadas.',
}

export function currentLapMessage(phase) {
  return CURRENT_LAP_MESSAGES[phase] ?? CURRENT_LAP_MESSAGES[NO_SCHEDULE]
}

export function nextLapMessage(phase) {
  return NEXT_LAP_MESSAGES[phase] ?? NEXT_LAP_MESSAGES[NO_SCHEDULE]
}

/**
 * Texto de los puntos de control cuando no hay una vuelta en curso.
 *
 * Nunca se muestran los puntos de una vuelta que no ha empezado o que ya
 * terminó: el conductor los leería como el recorrido que tiene delante.
 */
export function pointsMessage(phase) {
  if (phase === BEFORE_FIRST) return 'El recorrido aún no inicia'
  if (phase === BETWEEN) return 'Sin vuelta en curso'
  if (phase === AFTER_LAST) return 'Jornada finalizada'
  if (phase === UNKNOWN_TIME) return 'Hora no disponible'
  if (phase === UNSCHEDULED) return SCHEDULE_UNAVAILABLE
  return 'Sin itinerario'
}

/**
 * ¿La vuelta que se muestra arriba ya terminó?
 *
 * En BETWEEN y AFTER_LAST la tarjeta superior enseña la vuelta anterior como
 * CONTEXTO, y tiene que ir etiquetada: sin la etiqueta se leería como la vuelta
 * en curso, que es justo lo contrario de lo que pasa.
 */
export function isFinishedContext(phase) {
  return phase === BETWEEN || phase === AFTER_LAST
}
