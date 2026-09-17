// Mensaje de carga / vacío / error de una tarjeta.
//
// Home y el panel de Mapa muestran los MISMOS textos operativos con tamaños
// distintos. Tenerlos en un solo sitio evita que las dos vistas se
// desincronicen (antes el texto vivía duplicado dentro de Sidebar).
const TONE = {
  error: 'text-red-600 dark:text-red-400',
  loading: 'text-slate-500 dark:text-slate-400',
  empty: 'text-slate-500 dark:text-slate-400',
}

const SIZE = {
  sm: 'text-sm xl:text-base',
  lg: 'text-2xl xl:text-3xl',
}

function StatusMessage({ status, messages, size = 'sm' }) {
  const text = messages?.[status]
  if (!text) return null

  return <p className={`${SIZE[size] ?? SIZE.sm} ${TONE[status] ?? TONE.loading}`}>{text}</p>
}

export default StatusMessage
