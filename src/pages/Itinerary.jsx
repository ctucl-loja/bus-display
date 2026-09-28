import { useMemo, useRef, useState } from 'react'
import { useDispatch } from '../hooks/useDispatch.js'
import { clampStepIndex, findCurrentStepIndex, sortStepsBySchedule } from '../utils/itinerary.js'
import { toEcuadorTime } from '../utils/ecuadorTime.js'
import { describeLine } from '../utils/line.js'

// Tamaños pensados para la pantalla táctil de 7" de la RPi (800x480): texto
// grande, filas altas y botones con área de toque cómoda. En `lg` (laptop) y en
// `xl` (el panel de 1280x800) solo se agrega aire y se sube un escalón la
// tipografía; la jerarquía es la misma. A 1280x800 la tabla sigue enseñando
// media docena de puntos de control de una vez.
const NAV_BUTTON_CLASS =
  'min-h-14 rounded-lg border border-slate-300 px-5 py-3 text-xl font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:px-6 lg:text-2xl xl:min-h-16 xl:px-7 xl:text-[26px]'

const CELL_CLASS = 'px-4 py-4 text-xl lg:px-6 lg:text-2xl xl:px-7 xl:py-5 xl:text-[26px]'

function Itinerary() {
  const { steps, status } = useDispatch()

  // Hora de Ecuador al abrir la vista, tomada una sola vez (inicializador
  // perezoso): la selección automática queda estable y el tramo no salta solo
  // mientras el conductor lee la tabla. No se usa un reloj en vivo porque
  // re-renderizaría la tabla una vez por segundo.
  const [openedAt] = useState(() => toEcuadorTime(new Date()))

  // null = manda la selección automática. En cuanto el conductor usa
  // «Anterior»/«Siguiente» manda él, y los refrescos del despacho cada 60 s ya
  // no mueven el tramo.
  const [manualIndex, setManualIndex] = useState(null)

  // La posición dentro del arreglo solo es significativa una vez ordenados los
  // tramos por horario: así «Anterior/Siguiente» avanza cronológicamente y el
  // índice inicial apunta al tramo correcto aunque la API los devuelva sueltos.
  const orderedSteps = useMemo(() => sortStepsBySchedule(steps), [steps])

  // El despacho llega de forma asíncrona: esto pasa solo de 0 al tramo que
  // corresponde a la hora actual en el render en que los tramos aparecen, sin
  // efectos ni renders extra. Sin tramos, findCurrentStepIndex devuelve -1.
  const autoIndex = Math.max(findCurrentStepIndex(orderedSteps, openedAt), 0)

  // La cantidad de tramos puede cambiar cuando el monitor recarga el despacho:
  // el índice se acota siempre para que la selección no quede fuera de rango.
  const lastIndex = Math.max(orderedSteps.length - 1, 0)
  const safeIndex = clampStepIndex(manualIndex ?? autoIndex, orderedSteps.length)
  const step = orderedSteps[safeIndex] ?? null

  const scrollRef = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  function goPrev() {
    setManualIndex(Math.max(safeIndex - 1, 0))
  }

  function goNext() {
    setManualIndex(Math.min(safeIndex + 1, lastIndex))
  }

  // Scroll arrastrando (dedo o mouse) en vez de depender del gesto nativo de
  // touch — útil cuando la pantalla táctil se reporta como mouse. Arrastra en
  // los dos ejes: la tabla puede desbordar tanto a lo alto como a lo ancho.
  function onPointerDown(event) {
    const el = scrollRef.current
    if (!el || event.target.closest('button, a, input, select, textarea')) return
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }
    el.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    const el = scrollRef.current
    if (!el || !dragRef.current.dragging) return
    el.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX)
    el.scrollTop = dragRef.current.scrollTop - (event.clientY - dragRef.current.startY)
  }

  function onPointerUp(event) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (scrollRef.current?.hasPointerCapture(event.pointerId)) {
      scrollRef.current.releasePointerCapture(event.pointerId)
    }
  }

  return (
    // Columna fija: los controles y la línea quedan siempre a la vista y solo
    // la tabla hace scroll. En 480 px de alto, tener que subir para cambiar de
    // tramo sería el peor gesto posible para el conductor.
    <div className="flex h-full flex-col gap-3 p-3 lg:gap-4 lg:p-6 xl:gap-5 xl:p-7">
      {orderedSteps.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={goPrev} disabled={safeIndex === 0} className={NAV_BUTTON_CLASS}>
            ← Anterior
          </button>
          <span className="text-xl text-slate-500 dark:text-slate-400 lg:text-2xl xl:text-3xl">
            Tramo {safeIndex + 1} de {orderedSteps.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={safeIndex === lastIndex}
            className={NAV_BUTTON_CLASS}
          >
            Siguiente →
          </button>
        </div>
      )}

      {status === 'loading' && (
        <p className="text-xl text-slate-500 dark:text-slate-400 lg:text-2xl xl:text-3xl">Cargando itinerario…</p>
      )}
      {status === 'empty' && (
        <p className="text-xl text-slate-500 dark:text-slate-400 lg:text-2xl xl:text-3xl">Sin despacho para hoy</p>
      )}
      {status === 'error' && (
        <p className="text-xl text-red-600 dark:text-red-400 lg:text-2xl xl:text-3xl">No se pudo cargar el itinerario</p>
      )}

      {step && (
        <>
          {/* Línea y horario en una sola fila: en 480 px de alto cada fila que
              se ahorra arriba es una fila más de tabla visible. */}
          <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60 lg:px-6 lg:py-4 xl:px-7 xl:py-5">
            <p className="text-2xl font-semibold text-cyan-600 dark:text-cyan-400 lg:text-3xl xl:text-4xl">
              {describeLine(step.line)}
            </p>
            <p className="text-xl tabular-nums text-slate-500 dark:text-slate-400 lg:text-2xl xl:text-3xl">
              {step.start_schedule && step.end_schedule
                ? `${step.start_schedule} - ${step.end_schedule}`
                : 'Sin horario'}
            </p>
          </div>

          {/* Único contenedor con scroll: vertical y horizontal, por arrastre o
              con la rueda. La tabla no baja de min-w para que las columnas no
              se aplasten en pantallas angostas. */}
          <div
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="min-h-0 flex-1 cursor-grab touch-none select-none overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40 active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/40"
          >
            <table className="w-full min-w-[42rem] text-left xl:min-w-[52rem]">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-200 text-base uppercase tracking-wide text-cyan-600/80 dark:border-slate-800 dark:text-cyan-400/80 lg:text-lg xl:text-xl">
                  <th className="px-4 py-3 font-medium lg:px-6 xl:px-7 xl:py-4">#</th>
                  <th className="px-4 py-3 font-medium lg:px-6 xl:px-7 xl:py-4">Punto de Control</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium lg:px-6 xl:px-7 xl:py-4">Hora Calculada</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium lg:px-6 xl:px-7 xl:py-4">Hora Reportada</th>
                </tr>
              </thead>
              <tbody>
                {step.checkpoints.map((checkpoint) => (
                  <tr
                    key={checkpoint.key}
                    className="border-b border-slate-200/60 last:border-0 hover:bg-slate-100/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className={`${CELL_CLASS} text-slate-500 dark:text-slate-400`}>
                      {checkpoint.order ?? '—'}
                    </td>
                    <td className={`${CELL_CLASS} font-medium text-slate-700 dark:text-slate-100`}>
                      {checkpoint.point?.name ?? 'Punto sin nombre'}
                    </td>
                    <td
                      className={`${CELL_CLASS} whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-100`}
                    >
                      {checkpoint.time_calculated ?? 'Sin horario'}
                    </td>
                    <td className={`${CELL_CLASS} whitespace-nowrap tabular-nums`}>
                      {/* time_reported ausente y '00:00:00' significan lo mismo:
                          el monitor todavía no marcó este punto. */}
                      {!checkpoint.time_reported || checkpoint.time_reported === '00:00:00' ? (
                        <span className="text-slate-400 dark:text-slate-500">Sin reportar</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {checkpoint.time_reported}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default Itinerary
