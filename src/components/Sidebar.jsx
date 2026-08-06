import InfoCard from './InfoCard.jsx'
import { env } from '../config/env.js'

// Datos ficticios de ruta, vehículo y puntos de control, sin lógica de negocio todavía.
const LINE = {
  codigo: 'A2',
  variante: 'L8',
  ruta: 'CIUDAD VICTORIA - LOLITA SAMANIEGO',
}

const VEHICLE = {
  propietario: 'Juan Carlos Pérez',
  placa: 'LDA-1234',
  cooperativa: 'URBAEXPRESS',
}

const CURRENT_STOP = { nombre: 'Redondel Argelia', hora: '08:22:00' }
const NEXT_STOP = { nombre: 'Iglesia San Francisco', hora: '08:25:30' }

function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/40">
      <InfoCard title="Línea">
        <p className="mt-1 text-sm text-slate-100">
          ({LINE.variante}) : {LINE.ruta}
        </p>
      </InfoCard>

      <InfoCard title="Punto actual">
        <p className="text-sm text-slate-100">{CURRENT_STOP.nombre}</p>
        <p className="mt-1 text-xl font-bold text-amber-400">{CURRENT_STOP.hora}</p>
      </InfoCard>

      <InfoCard title="Siguiente punto">
        <p className="text-sm text-slate-100">{NEXT_STOP.nombre}</p>
        <p className="mt-1 text-xl font-bold text-amber-400">{NEXT_STOP.hora}</p>
      </InfoCard>

      <InfoCard title="Vehículo">
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-400">Registro</dt>
          <dd className="text-right text-slate-100">{env.busRegister}</dd>
          <dt className="text-slate-400">Propietario</dt>
          <dd className="text-right text-slate-100">{VEHICLE.propietario}</dd>
          <dt className="text-slate-400">Placa</dt>
          <dd className="text-right text-slate-100">{VEHICLE.placa}</dd>
          <dt className="text-slate-400">Cooperativa</dt>
          <dd className="text-right text-cyan-400">{VEHICLE.cooperativa}</dd>
        </dl>
      </InfoCard>
    </div>
  )
}

export default Sidebar
