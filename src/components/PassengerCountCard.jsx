import Card from './Card.jsx'
import StatusMessage from './StatusMessage.jsx'
import { PASSENGER_MESSAGES } from '../utils/statusMessages.js'
import { toEcuadorTime } from '../utils/ecuadorTime.js'

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
 * Es presentacional: recibe `total`, `status` y `updatedAt` en vez de consultar
 * la API, para que la vista que la use decida de dónde sale el dato.
 *
 * Ocupa toda la altura de su contenedor (`h-full`) con el número centrado y
 * escalado a la altura de la pantalla: hoy es el único widget de `/metrics`.
 *
 * Igual que la ficha del vehículo, con `status: 'error'` se sigue mostrando el
 * último conteo válido y el aviso va aparte, en tono discreto.
 */
function PassengerCountCard({ total, status, updatedAt, label = 'Pasajeros hoy' }) {
  const hasValue = total !== null && total !== undefined

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 ring-1 ring-cyan-500/30 lg:h-16 lg:w-16 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30">
          <PersonIcon className="h-7 w-7 lg:h-9 lg:w-9" />
        </div>
        <p className="text-xl font-semibold uppercase tracking-wide text-cyan-600/90 dark:text-cyan-400/90 lg:text-2xl">
          {label}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center" aria-live="polite">
        {hasValue ? (
          <p className="font-mono text-[clamp(5rem,32vh,16rem)] font-bold leading-none tabular-nums text-slate-900 dark:text-slate-50">
            {total}
          </p>
        ) : (
          <StatusMessage status={status} messages={PASSENGER_MESSAGES} size="lg" />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-base lg:text-lg">
        {hasValue && status === 'error' ? (
          <p className="text-amber-600 dark:text-amber-400">
            No se pudo actualizar el conteo de pasajeros
          </p>
        ) : (
          <span />
        )}
        {updatedAt && (
          <p className="tabular-nums text-slate-500 dark:text-slate-400">
            Actualizado {toEcuadorTime(updatedAt)}
          </p>
        )}
      </div>
    </Card>
  )
}

export default PassengerCountCard
