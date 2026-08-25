import { useEffect } from 'react'
import {
  ARRIVAL_LABELS,
  ARRIVAL_SIGNS,
  ARRIVAL_STATUS,
  formatClock,
  formatDifference,
} from '../utils/arrival.js'

export const ARRIVAL_NOTIFICATION_DURATION = 5000

// Semántica de color por estado, en tema claro y oscuro. El estado también se
// escribe con palabras: el color nunca es el único indicador.
const STYLES = {
  [ARRIVAL_STATUS.ON_TIME]: {
    border: 'border-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  [ARRIVAL_STATUS.EARLY]: {
    border: 'border-amber-500',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  [ARRIVAL_STATUS.LATE]: {
    border: 'border-red-500',
    accent: 'text-red-600 dark:text-red-400',
  },
}

const NEUTRAL = { border: 'border-slate-400', accent: 'text-slate-600 dark:text-slate-300' }

/**
 * Aviso de llegada a un punto de control. Se cierra solo y no requiere que el
 * conductor toque nada.
 *
 * Se posiciona en absoluto respecto del área de contenido (el <main> del
 * layout, que es `relative`), no respecto de la ventana: así queda dentro de la
 * vista —sobre el mapa en Home, sobre la tabla en Itinerario— sin desplazarlos
 * y sin taparle al conductor el reloj ni la navegación del navbar.
 *
 * Solo presenta: la puntualidad viene ya calculada por bus_monitor.py.
 */
function ArrivalNotification({ event, onClose }) {
  const payload = event?.payload ?? {}
  const status = payload.arrival_status
  const style = STYLES[status] ?? NEUTRAL
  // Un estado desconocido (o ausente, cuando el checkpoint no traía hora
  // programada) no se traduce a "A TIEMPO": se avisa de la llegada sin afirmar
  // una puntualidad que el monitor no calculó.
  const label = ARRIVAL_LABELS[status] ?? 'LLEGADA REGISTRADA'
  const difference = formatDifference(payload.difference_seconds)

  // El temporizador se reinicia con cada evento nuevo (clave: event.id).
  useEffect(() => {
    const id = setTimeout(onClose, ARRIVAL_NOTIFICATION_DURATION)
    return () => clearTimeout(id)
  }, [event?.id, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-6 z-[1200] flex justify-center px-4"
    >
      <div
        className={`pointer-events-auto w-full max-w-2xl rounded-2xl border-l-8 ${style.border} bg-white/95 p-6 shadow-2xl shadow-black/30 backdrop-blur dark:bg-slate-900/95`}
      >
        <p className="text-3xl font-bold tracking-wide text-slate-900 dark:text-slate-50">
          {payload.point_name ?? 'Punto de control'}
        </p>

        <p className={`mt-2 flex flex-wrap items-baseline gap-x-3 text-4xl font-bold ${style.accent}`}>
          {ARRIVAL_SIGNS[status] && <span aria-hidden="true">{ARRIVAL_SIGNS[status]}</span>}
          <span>{label}</span>
          {/* La diferencia solo se muestra si se conoce y aporta algo: en
              ON_TIME es ruido, y sin dato sería inventarla. */}
          {status !== ARRIVAL_STATUS.ON_TIME && difference && (
            <span className="text-3xl font-semibold">{difference}</span>
          )}
        </p>

        <dl className="mt-4 flex gap-10 text-xl">
          <div>
            <dt className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Programado
            </dt>
            <dd className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {formatClock(payload.scheduled_time)}
            </dd>
          </div>
          <div>
            <dt className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Llegada
            </dt>
            <dd className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {formatClock(payload.reported_time)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default ArrivalNotification
