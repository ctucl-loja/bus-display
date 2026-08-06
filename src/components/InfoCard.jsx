// Card genérica de la barra lateral: título + contenido libre.
function InfoCard({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 shadow-inner shadow-black/20">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400/80">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default InfoCard
