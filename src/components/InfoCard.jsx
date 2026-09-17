// Card genérica: título + contenido libre.
//
// `size` solo cambia la presentación, no el contenido:
//
//   sm      → la tarjeta de la barra lateral del mapa, que comparte pantalla
//             con el mapa;
//   lg      → tipografía grande, legible desde el asiento del conductor;
//   compact → la de las tres filas de Home. Es 'lg' con el relleno justo para
//             que las tres filas quepan completas en los 360 px que deja el
//             navbar a 800x480, sin recurrir a tipografía diminuta.
//
// Los tres tamaños crecen un escalón en `xl` (≥1280 px), que es el panel de
// 1280x800: mismo diseño, tipografía proporcional a la pantalla real.
const TITLE_SIZE = {
  sm: 'mb-2 text-xs xl:text-sm',
  lg: 'mb-1 text-xl xl:mb-1.5 xl:text-2xl',
  compact: 'mb-0.5 text-base lg:text-lg xl:mb-1 xl:text-xl',
}

const PADDING = {
  sm: 'p-4 xl:p-5',
  lg: 'px-5 py-3 xl:px-6 xl:py-4',
  compact: 'px-3 py-2 lg:px-5 lg:py-3 xl:px-6 xl:py-4',
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
