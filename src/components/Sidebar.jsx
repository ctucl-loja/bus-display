import InfoCard from './InfoCard.jsx'
import { env } from '../config/env.js'

// Datos ficticios del vehículo: la API de dispatch no los incluye todavía.
const VEHICLE = {
  propietario: 'Juan Carlos Pérez',
  placa: 'LDA-1234',
  cooperativa: 'URBAEXPRESS',
}

function Sidebar({ status, currentStep, current, next }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white/60 p-4 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/40">
      <InfoCard title="Línea">
        {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">No se pudo cargar el itinerario</p>}
        {status === 'loading' && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando itinerario…</p>}
        {currentStep && (
          <p className="mt-1 text-xl text-slate-700 dark:text-slate-100">
            (L{currentStep.line.number}) [{currentStep.line.name}] : {currentStep.line.start_route} - {currentStep.line.end_route}
          </p>
        )}
      </InfoCard>

      <InfoCard title="Punto actual">
        <p className="text-xl text-slate-700 dark:text-slate-100">{current?.point.name ?? '—'}</p>
        <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
          {current?.time_calculated ?? '--:--:--'}
        </p>
      </InfoCard>

      <InfoCard title="Siguiente punto">
        <p className="text-xl text-slate-700 dark:text-slate-100">{next?.point.name ?? 'Sin más puntos'}</p>
        <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
          {next?.time_calculated ?? '--:--:--'}
        </p>
      </InfoCard>

      <InfoCard title="Vehículo">
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">Registro</dt>
          <dd className="text-right text-slate-700 dark:text-slate-100">{env.busRegister}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Propietario</dt>
          <dd className="text-right text-slate-700 dark:text-slate-100">{VEHICLE.propietario}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Placa</dt>
          <dd className="text-right text-slate-700 dark:text-slate-100">{VEHICLE.placa}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Cooperativa</dt>
          <dd className="text-right text-cyan-600 dark:text-cyan-400">{VEHICLE.cooperativa}</dd>
        </dl>
      </InfoCard>
    </div>
  )
}

export default Sidebar
