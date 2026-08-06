import { useRef, useState } from 'react'
import { useDispatch } from '../hooks/useDispatch.js'

function Itinerary() {
  const { steps, status } = useDispatch()
  const [index, setIndex] = useState(0)

  const scrollRef = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  const step = steps[index]

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  function goNext() {
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  // Scroll arrastrando (dedo o mouse) en vez de depender del gesto nativo de
  // touch — útil cuando la pantalla táctil se reporta como mouse.
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
    <div
      ref={scrollRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="h-full touch-none select-none overflow-y-auto p-6 cursor-grab active:cursor-grabbing"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <span></span>
        {steps.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← Anterior
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Tramo {index + 1} de {steps.length}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={index === steps.length - 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando itinerario…</p>}
      {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">No se pudo cargar el itinerario</p>}

      {step && (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
               (L{step.line.number}) [{step.line.name}] : {step.line.start_route} - {step.line.end_route}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {step.start_schedule} - {step.end_schedule}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-cyan-600/80 dark:border-slate-800 dark:text-cyan-400/80">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Punto de Control</th>
                  <th className="px-4 py-3 font-medium">Hora Calculada</th>
                  <th className="px-4 py-3 font-medium">Hora Reportada</th>
                </tr>
              </thead>
              <tbody>
                {step.checkpoints.map((checkpoint) => (
                  <tr
                    key={checkpoint.id}
                    className="border-b border-slate-200/60 last:border-0 hover:bg-slate-100/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{checkpoint.order}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-100">{checkpoint.point.name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-100">{checkpoint.time_calculated}</td>
                    <td className="px-4 py-3">
                      {checkpoint.time_reported === '00:00:00' ? (
                        <span className="text-slate-400 dark:text-slate-500">Sin reportar</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">{checkpoint.time_reported}</span>
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
