// Conectividad de LA RASPBERRY (no del navegador que abre la pantalla).
//
// Vivía dentro de src/pages/Info.jsx. Se extrajo al mudarse la sección a la
// vista de Configuración: la implementación es una sola y las dos vistas —y el
// formulario de Wi-Fi, que reutiliza `ConnectionRow` para enseñar el resultado—
// consumen este módulo en vez de duplicarla.

// No se exporta: es un detalle de presentacion de ConnectionRow, y un
// export que no es un componente rompe el fast refresh de este archivo.
const CONNECTION_LABELS = {
  wifi: 'Wi-Fi',
  ethernet: 'Conexión por cable',
  other: 'Otra conexión',
}

export function WifiIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2 8.8a15 15 0 0 1 20 0" />
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M8.5 16.1a6 6 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  )
}

export function EthernetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M7 9V5h10v4" />
      <path d="M8 20v-3M12 20v-3M16 20v-3" />
    </svg>
  )
}

export function NetworkIcon({ type, className }) {
  if (type === 'wifi') return <WifiIcon className={className} />
  if (type === 'ethernet') return <EthernetIcon className={className} />
  return null
}

export function ConnectionRow({ connection }) {
  const label = CONNECTION_LABELS[connection.type] ?? CONNECTION_LABELS.other

  return (
    <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      <NetworkIcon type={connection.type} className="mt-1 h-8 w-8 shrink-0 text-cyan-600 dark:text-cyan-400" />
      <dl className="min-w-0 flex-1 space-y-1 text-lg lg:text-xl">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">Tipo:</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-100">{label}</dd>
        </div>
        {connection.type === 'wifi' && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-slate-500 dark:text-slate-400">Red:</dt>
            <dd className="break-all font-semibold text-slate-800 dark:text-slate-100">
              {connection.name ?? 'Nombre no disponible'}
            </dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">Interfaz:</dt>
          <dd className="font-mono text-slate-800 dark:text-slate-100">
            {connection.interface ?? '—'}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">
            {connection.ipv4.length > 1 ? 'Direcciones IP:' : 'Dirección IP:'}
          </dt>
          <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-100">
            {connection.ipv4.length > 0 ? connection.ipv4.join(' · ') : 'Sin dirección asignada'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function StaleNotice() {
  return (
    <p className="text-base text-amber-600 dark:text-amber-400">
      No se pudo actualizar la información de red
    </p>
  )
}

/**
 * Lista de conexiones activas del equipo.
 *
 * Recibe `info` y `status` en vez de llamar al hook: la vista de Configuración
 * comparte UNA instancia de `useNetworkInfo` entre esta lista y el formulario
 * de Wi-Fi, para que conectarse a una red actualice lo que se ve aquí de
 * inmediato en vez de esperar al refresco de 30 s.
 *
 * Conserva los cinco estados: cargando, conectado, desconectado, no disponible
 * y error con los últimos datos conocidos.
 */
function Connectivity({ info, status }) {
  const connections = info?.connections ?? []

  if (status === 'loading') {
    return <p className="text-lg text-slate-500 dark:text-slate-400 lg:text-xl">Consultando información de red…</p>
  }

  // Con un fallo transitorio se conserva la última información válida y el
  // aviso va aparte, en tono discreto.
  if (connections.length === 0) {
    const message =
      info?.status === 'disconnected'
        ? 'Sin conexión de red detectada'
        : 'Información de red no disponible'
    return (
      <>
        <p className="text-lg text-slate-500 dark:text-slate-400 lg:text-xl">{message}</p>
        {status === 'error' && <StaleNotice />}
      </>
    )
  }

  return (
    <div className="space-y-3">
      {connections.map((connection) => (
        <ConnectionRow key={connection.key} connection={connection} />
      ))}
      {status === 'error' && <StaleNotice />}
    </div>
  )
}

export default Connectivity
