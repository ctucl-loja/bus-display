// Tarjeta de sección para las vistas a pantalla completa (Info, Configuración):
// mismo lenguaje visual que InfoCard, con tamaños pensados para la pantalla de
// 7". Vive aquí, y no dentro de una página, porque Info y Configuración la
// comparten desde que la conectividad y la energía se mudaron a Configuración.
function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:p-6 xl:p-7">
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
