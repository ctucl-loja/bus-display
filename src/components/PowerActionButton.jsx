import { useState } from 'react'
import { requestShutdown, requestReboot } from '../services/powerApi.js'
import { POWER_ACTION_TEXTS, POWER_NETWORK_ERROR, resultMessage } from '../utils/powerMessages.js'

function PowerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3v9" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  )
}

function RestartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

// Cada acción = sus textos (utils/powerMessages.js, probados aparte) más el
// icono y la llamada a la API. El frontend no elige ningún comando: solo la
// ruta. El comando vive en el equipo.
const ACTIONS = {
  shutdown: { ...POWER_ACTION_TEXTS.shutdown, Icon: PowerIcon, request: requestShutdown },
  reboot: { ...POWER_ACTION_TEXTS.reboot, Icon: RestartIcon, request: requestReboot },
}

/**
 * Apagado o reinicio de la Raspberry desde la pantalla táctil.
 *
 * En modo kiosco no hay teclado ni escritorio: sin estos botones, la única
 * forma de apagar o reiniciar el equipo es cortarle la corriente, que es justo
 * lo que corrompe la tarjeta SD.
 *
 * Dos pasos SIEMPRE, para las dos acciones: el botón abre un diálogo de
 * confirmación que dice qué va a pasar, con la acción y «Cancelar». Un solo
 * toque nunca apaga ni reinicia el bus.
 *
 * El frontend no elige ningún comando: solo la ruta de la API. El comando vive
 * en el equipo.
 */
function PowerActionButton({ action = 'shutdown' }) {
  const config = ACTIONS[action] ?? ACTIONS.shutdown

  // 'idle' | 'confirming' | 'sending' | 'done'
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)

  async function confirm() {
    // El propio `phase` bloquea el reenvío: el botón de confirmar queda
    // deshabilitado en cuanto se entra en 'sending'.
    if (phase === 'sending') return
    setPhase('sending')
    try {
      setResult(resultMessage(await config.request(), action))
    } catch {
      setResult(POWER_NETWORK_ERROR)
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
        aria-labelledby={`power-${action}-title`}
        aria-describedby={`power-${action}-description`}
        className="rounded-lg border-2 border-red-500/60 bg-red-50 p-4 dark:bg-red-500/10"
      >
        <h3 id={`power-${action}-title`} className="text-xl font-bold text-red-700 lg:text-2xl dark:text-red-400">
          {config.title}
        </h3>
        <p id={`power-${action}-description`} className="mt-2 text-lg leading-relaxed text-slate-700 lg:text-xl dark:text-slate-200">
          {config.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={confirm}
            disabled={sending}
            className="min-h-14 rounded-lg bg-red-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60 lg:text-xl"
          >
            {sending ? config.sending : config.confirm}
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

  const { Icon } = config
  return (
    <button
      type="button"
      onClick={() => setPhase('confirming')}
      className="flex min-h-14 items-center gap-3 rounded-lg border-2 border-red-500/60 px-6 py-3 text-lg font-bold text-red-600 transition-colors hover:bg-red-50 lg:text-xl dark:text-red-400 dark:hover:bg-red-500/10"
    >
      <Icon className="h-7 w-7 shrink-0" />
      {config.button}
    </button>
  )
}

export default PowerActionButton
