// Tarjeta de sección para las vistas a pantalla completa (Info, Configuración):
// mismo lenguaje visual que InfoCard, con tamaños pensados para la pantalla de
// 7". Vive aquí, y no dentro de una página, porque Info y Configuración la
// comparten desde que la conectividad y la energía se mudaron a Configuración.
//
// `className` (opcional) se suma a las clases base, p. ej. para que la tarjeta
// ocupe toda la altura disponible. `padding` (opcional) reemplaza el relleno
// por defecto para tarjetas que comparten pantalla, como el conteo de
// pasajeros en el panel del mapa.
const DEFAULT_PADDING = 'p-4 lg:p-6 xl:p-7'

function Card({ title, children, className = '', padding = DEFAULT_PADDING }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${padding} ${className}`}>
      {title && (
        <h2 className="mb-3 text-base font-semibold uppercase tracking-wide text-cyan-600/90 dark:text-cyan-400/90 lg:text-lg xl:mb-4 xl:text-xl">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export default Card
