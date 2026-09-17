import { describeLine } from '../utils/line.js'
import { SCHEDULE_UNAVAILABLE } from '../utils/homeSchedule.js'

// Tarjeta de vuelta (step) de la Home. La usan las DOS filas de ancho completo
// —«Línea actual» y «Siguiente vuelta»— porque muestran exactamente lo mismo:
// código del despacho, nombre de la línea y horario de inicio y fin.
//
// No reutiliza `InfoCard` a propósito, aunque la variante `current` comparte su
// aspecto: los horarios van en la MISMA línea que el encabezado, a la derecha, y
// `InfoCard` no deja poner nada junto al título. Esa fila estaba vacía, y
// aprovecharla ahorra una línea de texto por tarjeta — las dos que faltaban para
// que las tres filas y el botón de recarga quepan completos en los 360 px de la
// pantalla de 7", sin recurrir a tipografía diminuta. En el panel de 1280x800
// (`xl`) el mismo ahorro es lo que deja subir el nombre de la línea a 36 px.
//
// ── Las dos variantes ───────────────────────────────────────────────────────
//
//   current → gris neutro, el mismo lenguaje que el resto de tarjetas de Home.
//   next    → ÁMBAR, a propósito distinto. «Siguiente vuelta» es la información
//             que el conductor busca de un vistazo para saber qué le toca
//             después, y con el estilo neutro se confundía con «Línea actual»:
//             dos tarjetas de ancho completo, mismo formato, mismos colores.
//
// El ámbar se aplica SOLO a la variante `next`. Ni las tarjetas de puntos ni
// `InfoCard` cambian.
//
// ── Contraste (verificado con la fórmula WCAG, no a ojo) ────────────────────
//
//   TEMA CLARO — fondo amber-100 (L 0.893)
//     nombre de línea / horarios  amber-950   13.5:1
//     título / etiquetas          amber-800    6.4:1
//     mensaje sin vuelta          amber-900    8.2:1
//
//   TEMA OSCURO — fondo amber-400 (L 0.579)
//     nombre de línea / horarios  amber-950    9.0:1
//     título / etiquetas          amber-900    5.4:1
//     mensaje sin vuelta          amber-950    9.0:1
//
//   Mínimos AA: 4.5:1 texto normal, 3:1 texto grande. Todos pasan, y la
//   diferencia (13.5 vs 6.4 · 9.0 vs 5.4) es la jerarquía: el nombre y los
//   horarios pesan más que sus etiquetas.
//
// En tema oscuro la tarjeta NO se invierte a un fondo casi negro: se mantiene un
// ámbar de luminosidad media (0.579) con texto oscuro encima. Un `amber-500/10`
// sobre slate-950 —lo que sale de invertir por reflejo— la habría dejado igual
// de apagada que las demás, que es justo lo que había que evitar.

const VARIANTS = {
  current: {
    frame:
      'border-slate-200 bg-slate-100/60 shadow-inner shadow-slate-200/40 ' +
      'dark:border-slate-800 dark:bg-slate-800/40 dark:shadow-black/20',
    title: 'text-cyan-600/80 dark:text-cyan-400/80',
    name: 'text-slate-800 dark:text-slate-100',
    nameMuted: 'text-slate-500 dark:text-slate-400',
    code:
      'border-violet-500/60 bg-violet-100 text-violet-700 ' +
      'dark:border-violet-400/60 dark:bg-violet-500/15 dark:text-violet-300',
    scheduleLabel: 'text-slate-500 dark:text-slate-400',
    scheduleValue: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    message: 'text-slate-500 dark:text-slate-400',
  },
  next: {
    // Borde más marcado que en `current`: es lo que separa el bloque ámbar del
    // fondo de la página en tema claro, donde ambos son luminosos.
    frame:
      'border-2 border-amber-400 bg-amber-100 shadow-sm shadow-amber-200/50 ' +
      'dark:border-amber-300 dark:bg-amber-400 dark:shadow-black/30',
    title: 'text-amber-800 dark:text-amber-900',
    name: 'text-amber-950 dark:text-amber-950',
    nameMuted: 'text-amber-800 dark:text-amber-900',
    // El badge se aclara en vez de oscurecerse: sobre un fondo ámbar, un
    // recuadro violeta (el de `current`) desentona y pierde contraste.
    code:
      'border-amber-600 bg-amber-50 text-amber-950 ' +
      'dark:border-amber-800 dark:bg-amber-50 dark:text-amber-950',
    scheduleLabel: 'text-amber-800 dark:text-amber-900',
    scheduleValue: 'text-amber-950 dark:text-amber-950',
    badge: 'bg-amber-200 text-amber-900 dark:bg-amber-200 dark:text-amber-900',
    // Los mensajes de «sin más vueltas», carga y error viven dentro de esta
    // misma tarjeta: heredan la paleta para seguir siendo legibles sobre ámbar.
    message: 'text-amber-900 dark:text-amber-950',
  },
}

const FRAME_BASE =
  'flex flex-col justify-center rounded-lg border px-3 py-2 lg:px-5 lg:py-3 xl:px-6 xl:py-3'

function ScheduleField({ label, value, variant }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-sm lg:text-base xl:text-lg ${variant.scheduleLabel}`}>{label}</span>
      <span className={`font-mono text-lg font-bold tabular-nums lg:text-xl xl:text-2xl ${variant.scheduleValue}`}>
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
 * @param {string}  variant  'current' (neutra) | 'next' (ámbar, destacada).
 */
function LapCard({ title, step, message, badge = null, muted = false, variant = 'current' }) {
  const theme = VARIANTS[variant] ?? VARIANTS.current

  return (
    <div className={`${FRAME_BASE} ${theme.frame}`}>
      {/* Encabezado: título a la izquierda, horarios a la derecha. Envuelven
          juntos en pantallas estrechas en vez de partirse por la mitad. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <div className="flex items-baseline gap-2">
          <h3 className={`text-base font-semibold uppercase tracking-wide lg:text-lg xl:text-xl ${theme.title}`}>
            {title}
          </h3>
          {badge && (
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide xl:text-sm ${theme.badge}`}>
              {badge}
            </span>
          )}
        </div>

        {step && (
          <div className="flex shrink-0 items-baseline gap-4">
            <ScheduleField label="Inicio:" value={step.start_schedule ?? SCHEDULE_UNAVAILABLE} variant={theme} />
            <ScheduleField label="Fin:" value={step.end_schedule ?? SCHEDULE_UNAVAILABLE} variant={theme} />
          </div>
        )}
      </div>

      {step ? (
        <p
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[22px] leading-tight font-bold break-words lg:text-[28px] xl:text-[36px] ${
            muted ? theme.nameMuted : theme.name
          }`}
        >
          {/* Código del despacho, enmarcado y en otro color: es lo que permite
              comprobar de un vistazo que el bus corre el itinerario correcto,
              así que no debe confundirse con el nombre de la línea. */}
          <span className={`rounded-lg border-2 px-2 py-0.5 font-mono tracking-wide ${theme.code}`}>
            {step.code ?? 'Sin código'}
          </span>
          <span className="min-w-0">{describeLine(step.line)}</span>
        </p>
      ) : (
        <p className={`text-lg leading-snug font-semibold lg:text-xl xl:text-2xl ${theme.message}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default LapCard
