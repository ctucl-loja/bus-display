import { describeLine } from '../utils/line.js'
import { SCHEDULE_UNAVAILABLE } from '../utils/homeSchedule.js'

// Tarjeta de vuelta (step) de la Home. La usan las DOS filas de ancho completo
// —«Línea actual» y «Siguiente vuelta»— porque muestran exactamente lo mismo:
// código del despacho, nombre de la línea y horario de inicio y fin.
//
// No reutiliza `InfoCard` a propósito, aunque comparte su aspecto: los horarios
// van en la MISMA línea que el encabezado, a la derecha, y `InfoCard` no deja
// poner nada junto al título. Esa fila estaba vacía, y aprovecharla ahorra una
// línea de texto por tarjeta — las dos que faltaban para que las tres filas y el
// botón de recarga quepan completos en los 360 px de la pantalla de 7", sin
// recurrir a tipografía diminuta.
//
// Las clases del marco y del título son las de `InfoCard` size="compact", para
// que las cuatro tarjetas de Home se vean como una sola familia.
const FRAME_CLASS =
  'flex flex-col justify-center rounded-lg border border-slate-200 bg-slate-100/60 ' +
  'px-3 py-2 shadow-inner shadow-slate-200/40 lg:px-5 lg:py-3 ' +
  'dark:border-slate-800 dark:bg-slate-800/40 dark:shadow-black/20'

const TITLE_CLASS =
  'text-base font-semibold uppercase tracking-wide text-cyan-600/80 lg:text-lg dark:text-cyan-400/80'

function ScheduleField({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm text-slate-500 lg:text-base dark:text-slate-400">{label}</span>
      <span className="font-mono text-lg font-bold tabular-nums text-amber-600 lg:text-xl dark:text-amber-400">
        {value}
      </span>
    </div>
  )
}

/**
 * @param {string}  title    Encabezado de la tarjeta.
 * @param {object?} step     Vuelta a mostrar, o null.
 * @param {string}  message  Texto cuando no hay vuelta que mostrar.
 * @param {string?} badge    Etiqueta de estado, p. ej. «Vuelta finalizada». Se
 *                           usa cuando la vuelta se enseña solo como contexto:
 *                           sin ella, una vuelta terminada se lee como la
 *                           actual, que es justo lo contrario.
 * @param {boolean} muted    Presentación atenuada, para ese mismo contexto.
 */
function LapCard({ title, step, message, badge = null, muted = false }) {
  return (
    <div className={FRAME_CLASS}>
      {/* Encabezado: título a la izquierda, horarios a la derecha. Envuelven
          juntos en pantallas estrechas en vez de partirse por la mitad. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <div className="flex items-baseline gap-2">
          <h3 className={TITLE_CLASS}>{title}</h3>
          {badge && (
            <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>

        {step && (
          <div className="flex shrink-0 items-baseline gap-4">
            <ScheduleField label="Inicio:" value={step.start_schedule ?? SCHEDULE_UNAVAILABLE} />
            <ScheduleField label="Fin:" value={step.end_schedule ?? SCHEDULE_UNAVAILABLE} />
          </div>
        )}
      </div>

      {step ? (
        <p
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[22px] leading-tight font-bold break-words lg:text-[28px] ${
            muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {/* Código del despacho, enmarcado y en otro color: es lo que permite
              comprobar de un vistazo que el bus corre el itinerario correcto,
              así que no debe confundirse con el nombre de la línea. */}
          <span className="rounded-lg border-2 border-violet-500/60 bg-violet-100 px-2 py-0.5 font-mono tracking-wide text-violet-700 dark:border-violet-400/60 dark:bg-violet-500/15 dark:text-violet-300">
            {step.code ?? 'Sin código'}
          </span>
          <span className="min-w-0">{describeLine(step.line)}</span>
        </p>
      ) : (
        <p className="text-lg leading-snug font-semibold text-slate-500 lg:text-xl dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  )
}

export default LapCard
