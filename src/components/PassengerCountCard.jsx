import Card from './Card.jsx'
import StatusMessage from './StatusMessage.jsx'
import { PASSENGER_MESSAGES } from '../utils/statusMessages.js'

export function PersonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
    </svg>
  )
}

/**
 * Tarjeta de un solo número: icono de persona, total de pasajeros y etiqueta.
 *
 * Es presentacional: recibe `total` y `status` en vez de consultar la API, para
 * que la vista que la use decida de dónde sale el dato (hoy `/metrics`, mañana
 * cualquier otra tarjeta de analíticas). Usa `Card`, así que no trae alturas ni
 * posiciones propias y no altera el layout de quien la contenga.
 *
 * Igual que la ficha del vehículo, con `status: 'error'` se sigue mostrando el
 * último conteo válido y el aviso va aparte, en tono discreto.
 */
function PassengerCountCard({ total, status, label = 'Pasajeros hoy' }) {
  const hasValue = total !== null && total !== undefined

  return (
    <Card>
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 ring-1 ring-cyan-500/30 lg:h-20 lg:w-20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30">
          <PersonIcon className="h-9 w-9 lg:h-11 lg:w-11" />
        </div>

        <div className="min-w-0">
          <p className="text-base font-semibold uppercase tracking-wide text-cyan-600/90 dark:text-cyan-400/90 lg:text-lg">
            {label}
          </p>
          {hasValue ? (
            <p className="font-mono text-5xl font-bold tabular-nums text-slate-900 dark:text-slate-50 lg:text-6xl">
              {total}
            </p>
          ) : (
            <StatusMessage status={status} messages={PASSENGER_MESSAGES} size="lg" />
          )}
        </div>
      </div>

      {hasValue && status === 'error' && (
        <p className="mt-3 text-base text-amber-600 dark:text-amber-400">
          No se pudo actualizar el conteo de pasajeros
        </p>
      )}
    </Card>
  )
}

export default PassengerCountCard
