import { useState } from 'react'
import { requestShutdown } from '../services/powerApi.js'

function PowerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3v9" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  )
}

// Mensaje final por estado de la API. `scheduled` es el único que promete un
// apagado; los demás se dicen tal cual, sin adornar.
const RESULT_MESSAGES = {
  scheduled: { tone: 'ok', text: 'El dispositivo se está apagando. Puede desconectar la alimentación cuando la pantalla se apague.' },
  already_scheduled: { tone: 'ok', text: 'El apagado ya estaba en curso.' },
  unavailable: { tone: 'error', text: 'Este equipo no permite apagarse desde la pantalla.' },
}

const NETWORK_ERROR = {
  tone: 'error',
  text: 'No se pudo contactar con el equipo. El dispositivo sigue encendido.',
}

/**
 * Apagado ordenado de la Raspberry desde la pantalla táctil.
 *
 * En modo kiosco no hay teclado ni escritorio: sin este botón la única forma
 * de apagar el equipo es cortarle la corriente, que es justo lo que corrompe
 * la tarjeta SD.
 *
 * Dos pasos siempre: el botón abre un diálogo de confirmación que dice qué va
 * a pasar, con «Apagar» y «Cancelar». Un solo toque nunca apaga el bus.
 */
function ShutdownButton() {
  // 'idle' | 'confirming' | 'sending' | 'done'
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)

  async function confirm() {
    setPhase('sending')
    try {
      const response = await requestShutdown()
      setResult(RESULT_MESSAGES[response?.status] ?? RESULT_MESSAGES.unavailable)
    } catch {
      setResult(NETWORK_ERROR)
    }
    setPhase('done')
  }

  if (phase === 'done' && result) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-lg border-2 p-4 text-lg font-semibold lg:text-xl ${
          result.tone === 'ok'
            ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300'
            : 'border-red-500/50 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
        }`}
      >
        <p>{result.text}</p>
        {/* Tras un fallo el equipo sigue encendido: se puede reintentar. */}
        {result.tone === 'error' && (
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setPhase('idle')
            }}
            className="mt-3 min-h-14 rounded-lg border border-slate-300 px-5 py-3 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 lg:text-xl dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Volver
          </button>
        )}
      </div>
    )
  }

  if (phase === 'confirming' || phase === 'sending') {
    const sending = phase === 'sending'
    return (
      <div
        role="alertdialog"
        aria-modal="false"
        aria-labelledby="shutdown-title"
        aria-describedby="shutdown-description"
        className="rounded-lg border-2 border-red-500/60 bg-red-50 p-4 dark:bg-red-500/10"
      >
        <h3 id="shutdown-title" className="text-xl font-bold text-red-700 lg:text-2xl dark:text-red-400">
          ¿Apagar el dispositivo?
        </h3>
        <p id="shutdown-description" className="mt-2 text-lg leading-relaxed text-slate-700 lg:text-xl dark:text-slate-200">
          Esto provocará que el dispositivo se apague. La pantalla y el registro de puntos de
          control dejarán de funcionar hasta que alguien vuelva a encender el equipo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={confirm}
            disabled={sending}
            className="min-h-14 rounded-lg bg-red-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60 lg:text-xl"
          >
            {sending ? 'Apagando…' : 'Apagar'}
          </button>
          <button
            type="button"
            onClick={() => setPhase('idle')}
            disabled={sending}
            className="min-h-14 rounded-lg border border-slate-400 px-6 py-3 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 lg:text-xl dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPhase('confirming')}
      className="flex min-h-14 items-center gap-3 rounded-lg border-2 border-red-500/60 px-6 py-3 text-lg font-bold text-red-600 transition-colors hover:bg-red-50 lg:text-xl dark:text-red-400 dark:hover:bg-red-500/10"
    >
      <PowerIcon className="h-7 w-7 shrink-0" />
      Apagar dispositivo
    </button>
  )
}

export default ShutdownButton
