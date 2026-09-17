function ReloadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

const TONE_CLASSES = {
  ok: 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300',
  error: 'border-red-500/50 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

/**
 * «Volver a cargar itinerario».
 *
 * Dispara el viaje completo, no una relectura del caché ni una recarga de la
 * página:
 *
 *     pantalla → POST local → backend remoto SIMTRA → validación →
 *     persistencia en simtra-bus-manager → respuesta → Home actualizada
 *
 * Toda la lógica vive en `useDispatch().refresh`; este componente solo es el
 * control: bloquea el doble envío, anuncia que está trabajando y muestra el
 * resultado tal cual lo devolvió el equipo.
 *
 * Sin confirmación previa a propósito: recargar es una operación segura e
 * idempotente —si falla, el itinerario anterior se conserva—, al contrario que
 * el apagado o el reinicio.
 */
function ReloadDispatchButton({ onReload, refreshing, result, onDismiss }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onReload}
        disabled={refreshing}
        // aria-busy comunica el trabajo en curso además del cambio de texto:
        // el botón deshabilitado por sí solo no dice por qué.
        aria-busy={refreshing}
        className="flex min-h-16 items-center justify-center gap-3 rounded-lg border-2 border-cyan-500/60 px-6 py-4 text-xl font-bold text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-60 lg:text-2xl dark:text-cyan-400 dark:hover:bg-cyan-500/10"
      >
        <ReloadIcon className={`h-8 w-8 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Actualizando itinerario…' : 'Volver a cargar itinerario'}
      </button>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border-2 p-4 text-lg font-semibold lg:text-xl ${TONE_CLASSES[result.tone] ?? TONE_CLASSES.error}`}
        >
          <p>{result.detail}</p>

          {/* Marcaciones que el bus registró y el servidor todavía no conocía:
              se conservaron al fusionar. Decirlo evita que el conductor crea
              que la recarga le borró llegadas ya hechas. */}
          {result.preservedReports > 0 && (
            <p className="mt-1 text-base font-normal">
              Se conservaron {result.preservedReports} llegada(s) registradas en este equipo y aún
              no enviadas al servidor.
            </p>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="mt-3 min-h-14 rounded-lg border border-slate-300 px-5 py-3 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 lg:text-xl dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Entendido
          </button>
        </div>
      )}
    </div>
  )
}

export default ReloadDispatchButton
