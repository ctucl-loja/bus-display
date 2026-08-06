const ITINERARY_ROWS = [
  { id: 1, linea: 'L18', bus: 'BUS-021', punto: 'Terminal Norte', hora: '08:15', estado: 'En Ruta' },
  { id: 2, linea: 'L18', bus: 'BUS-021', punto: 'Parada Central', hora: '08:24', estado: 'En Ruta' },
  { id: 3, linea: 'L05', bus: 'BUS-013', punto: 'Terminal Sur', hora: '08:30', estado: 'A Tiempo' },
  { id: 4, linea: 'L05', bus: 'BUS-013', punto: 'Av. Universitaria', hora: '08:41', estado: 'Retrasado' },
  { id: 5, linea: 'L02', bus: 'BUS-007', punto: 'Plaza Central', hora: '08:45', estado: 'En Ruta' },
  { id: 6, linea: 'L18', bus: 'BUS-021', punto: 'Terminal Norte', hora: '08:55', estado: 'A Tiempo' },
  { id: 7, linea: 'L09', bus: 'BUS-030', punto: 'Mercado Mayorista', hora: '09:02', estado: 'Detenido' },
  { id: 8, linea: 'L02', bus: 'BUS-007', punto: 'Hospital Regional', hora: '09:10', estado: 'En Ruta' },
  { id: 9, linea: 'L05', bus: 'BUS-013', punto: 'Terminal Sur', hora: '09:18', estado: 'Retrasado' },
  { id: 10, linea: 'L09', bus: 'BUS-030', punto: 'Parque Central', hora: '09:25', estado: 'A Tiempo' },
]

const STATUS_STYLES = {
  'En Ruta': 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-400/30',
  'A Tiempo': 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/30',
  Retrasado: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-400/30',
  Detenido: 'bg-red-500/10 text-red-400 ring-1 ring-red-400/30',
}

function Itinerary() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-100">Itinerary</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/40">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-cyan-400/80">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Línea</th>
              <th className="px-4 py-3 font-medium">Bus</th>
              <th className="px-4 py-3 font-medium">Punto de Control</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ITINERARY_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 text-slate-400">{row.id}</td>
                <td className="px-4 py-3 text-slate-100">{row.linea}</td>
                <td className="px-4 py-3 text-slate-100">{row.bus}</td>
                <td className="px-4 py-3 text-slate-100">{row.punto}</td>
                <td className="px-4 py-3 text-slate-400">{row.hora}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[row.estado]}`}
                  >
                    {row.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Itinerary
