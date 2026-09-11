// Card genérica: título + contenido libre.
//
// `size` solo cambia la presentación, no el contenido: 'sm' es la tarjeta
// compacta de la barra lateral del mapa; 'lg' es la de Home, que dispone de
// todo el ancho del body y usa tipografía legible a distancia.
const TITLE_SIZE = {
  sm: 'mb-2 text-xs',
  lg: 'mb-1 text-xl',
}

const PADDING = {
  sm: 'p-4',
  lg: 'px-5 py-3',
}

function InfoCard({ title, size = 'sm', className = '', children }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-100/60 shadow-inner shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-800/40 dark:shadow-black/20 ${PADDING[size] ?? PADDING.sm} ${className}`}
    >
      <h3
        className={`font-semibold uppercase tracking-wide text-cyan-600/80 dark:text-cyan-400/80 ${TITLE_SIZE[size] ?? TITLE_SIZE.sm}`}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

export default InfoCard
