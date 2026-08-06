// Card genérica de la barra lateral: título + contenido libre.
function InfoCard({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100/60 p-4 shadow-inner shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-800/40 dark:shadow-black/20">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-600/80 dark:text-cyan-400/80">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default InfoCard
