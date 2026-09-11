import InfoCard from './InfoCard.jsx'
import StatusMessage from './StatusMessage.jsx'
import { DISPATCH_MESSAGES, VEHICLE_MESSAGES } from '../utils/statusMessages.js'
import { useVehicle } from '../hooks/useVehicle.js'
import { describeLine } from '../utils/line.js'

// Panel lateral de la vista de mapa. Compacto a propósito: comparte la pantalla
// con el mapa. La versión grande de estos mismos datos vive en Home.
function Sidebar({ status, currentStep, current, next }) {
  const { vehicle, status: vehicleStatus } = useVehicle()
  return (
    <div className="flex h-full font-bold flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white/60 p-4 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/40">
      <InfoCard title="Línea">
        <StatusMessage status={status} messages={DISPATCH_MESSAGES} />
        {currentStep && (
          <p className="mt-1 text-xl text-slate-700 dark:text-slate-100">
            {describeLine(currentStep.line)}
          </p>
        )}
      </InfoCard>

      <InfoCard title="Punto actual">
        <p className="text-xl font-bold text-slate-700 dark:text-slate-100">
          {current?.point?.name ?? '—'}
        </p>
        <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
          {current?.time_calculated ?? 'Sin horario'}
        </p>
      </InfoCard>

      <InfoCard title="Siguiente punto">
        <p className="text-xl font-bold text-slate-700 dark:text-slate-100">
          {next?.point?.name ?? 'Sin más puntos'}
        </p>
        <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
          {next?.time_calculated ?? 'Sin horario'}
        </p>
      </InfoCard>

      <InfoCard title="Vehículo">
        <StatusMessage status={vehicleStatus} messages={VEHICLE_MESSAGES} />
        {vehicle && (
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Registro</dt>
            <dd className="text-right text-slate-700 dark:text-slate-100">{vehicle.register ?? '—'}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Propietario</dt>
            <dd className="text-right text-slate-700 dark:text-slate-100">
              {[vehicle.user?.name, vehicle.user?.lastname].filter(Boolean).join(' ') || '—'}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Placa</dt>
            <dd className="text-right text-slate-700 dark:text-slate-100">{vehicle.plate ?? '—'}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Cooperativa</dt>
            <dd className="text-right text-cyan-600 dark:text-cyan-400">
              {vehicle.company?.name ?? '—'}
            </dd>
          </dl>
        )}
      </InfoCard>
    </div>
  )
}

export default Sidebar
