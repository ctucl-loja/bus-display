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

// Tamaño del número dentro de su caja, que es un contenedor de tamaño
// (`container-type: size`): el menor entre una fracción de la altura y lo que
// permite el ancho para la cantidad de dígitos. Un dígito monoespaciado mide
// ~0,6 em, así que 4 o más dígitos se encogen en vez de desbordar la tarjeta.
const MONO_DIGIT_EM = 0.62

function numberFontSize(total, { heightPct, widthPct }) {
  const digits = Math.max(String(total).length, 1)
  const byWidth = (widthPct / (digits * MONO_DIGIT_EM)).toFixed(2)
  return `min(${heightPct}cqh, ${byWidth}cqw)`
}

const VARIANTS = {
  // Única tarjeta de `/metrics`: ocupa toda la altura de su contenedor.
  full: {
    card: 'flex h-full flex-col',
    padding: undefined,
    header: 'gap-3 lg:gap-4',
    iconBox: 'h-12 w-12 lg:h-16 lg:w-16',
    icon: 'h-7 w-7 lg:h-9 lg:w-9',
    label: 'text-xl lg:text-2xl',
    numberBox: 'min-h-0 flex-1',
    number: { heightPct: 85, widthPct: 92 },
    statusSize: 'lg',
    footer: 'flex-wrap gap-2 text-base lg:text-lg',
    errorText: 'No se pudo actualizar el conteo de pasajeros',
  },
  // Panel lateral de `/map`: altura propia y fija para no robarle espacio al
  // Sidebar ni estirarse cuando la página se apila por debajo de `lg`.
  compact: {
    card: '@container flex flex-col gap-1',
    padding: 'px-3 py-2 lg:px-4 lg:py-3 xl:px-5',
    header: 'gap-2 xl:gap-3',
    iconBox: 'h-8 w-8 xl:h-10 xl:w-10',
    icon: 'h-5 w-5 xl:h-6 xl:w-6',
    label: 'truncate text-sm lg:text-base xl:text-lg',
    numberBox: 'h-20 shrink-0 lg:h-24 xl:h-28',
    number: { heightPct: 95, widthPct: 96 },
    statusSize: 'sm',
    // Alto fijo de una línea: el aviso de error no hace saltar el panel.
    footer: 'h-4 gap-2 whitespace-nowrap text-xs xl:h-5 xl:text-sm',
    errorText: 'No se pudo actualizar',
    // El momento de la actualización solo si la tarjeta tiene ancho para él.
    updatedAt: 'hidden @min-[15rem]:block',
  },
}

/**
 * Tarjeta de un solo número: icono de persona, total de pasajeros y etiqueta.
 *
 * Es presentacional: recibe `total`, `status` y `updatedAt` en vez de consultar
 * la API, para que la vista que la use decida de dónde sale el dato.
 *
 * `variant`:
 *   full    → (predeterminada) ocupa toda la altura de su contenedor; es el
 *             único widget de `/metrics`.
 *   compact → tarjeta baja para el panel lateral de `/map`.
 *
 * En ambas el número se ajusta al ancho y alto reales de su caja.
 *
 * Igual que la ficha del vehículo, con `status: 'error'` se sigue mostrando el
 * último conteo válido y el aviso va aparte, en tono discreto.
 */
function PassengerCountCard({ total, status, updatedAt, label = 'Pasajeros hoy', variant = 'full', className = '' }) {
  const v = VARIANTS[variant] ?? VARIANTS.full
  const hasValue = total !== null && total !== undefined

  return (
    <Card className={`${v.card} ${className}`} padding={v.padding}>
      <div className={`flex min-w-0 items-center ${v.header}`}>
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 ring-1 ring-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30 ${v.iconBox}`}>
          <PersonIcon className={v.icon} />
        </div>
        <p className={`font-semibold uppercase tracking-wide text-cyan-600/90 dark:text-cyan-400/90 ${v.label}`}>
          {label}
        </p>
      </div>

      <div className={`flex items-center justify-center overflow-hidden [container-type:size] ${v.numberBox}`} aria-live="polite">
        {hasValue ? (
          <p
            className="whitespace-nowrap font-mono font-bold leading-none tabular-nums text-slate-900 dark:text-slate-50"
            style={{ fontSize: numberFontSize(total, v.number) }}
          >
            {total}
          </p>
        ) : (
          <StatusMessage status={status} messages={PASSENGER_MESSAGES} size={v.statusSize} />
        )}
      </div>

      <div className={`flex min-w-0 items-center justify-between ${v.footer}`}>
        {hasValue && status === 'error' ? (
          <p className="min-w-0 truncate text-amber-600 dark:text-amber-400">
            {v.errorText}
          </p>
        ) : (
          <span />
        )}
        {updatedAt && (
          <p className={`shrink-0 tabular-nums text-slate-500 dark:text-slate-400 ${v.updatedAt ?? ''}`}>
            Actualizado {toEcuadorTime(updatedAt)}
          </p>
        )}
      </div>
    </Card>
  )
}

export default PassengerCountCard
