import InfoCard from './InfoCard.jsx'
import StatusMessage from './StatusMessage.jsx'
import { DISPATCH_MESSAGES } from '../utils/statusMessages.js'
import { describeLine } from '../utils/line.js'

// Panel lateral de la vista de mapa. Compacto a propósito: comparte la pantalla
// con el mapa.
//
// La ficha del vehículo ya NO está aquí: se movió a `/info`, donde hay una sola
// tarjeta «Información del vehículo» con todos sus campos. Antes vivía duplicada
// entre este panel y Home, y por tanto había dos vistas haciendo polling de un
// dato que cambia como mucho una vez al día. Al quitarla, `/map` dejó de
// consultar `useVehicle` por completo.
function Sidebar({ status, currentStep, current, next }) {
  return (
    <div className="flex h-full font-bold flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white/60 p-4 xl:gap-5 xl:p-5 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/40">
      <InfoCard title="Línea">
        <StatusMessage status={status} messages={DISPATCH_MESSAGES} />
        {currentStep && (
          <p className="mt-1 text-xl xl:text-2xl text-slate-700 dark:text-slate-100">
            {describeLine(currentStep.line)}
          </p>
        )}
      </InfoCard>

      <InfoCard title="Punto actual">
        <p className="text-xl xl:text-2xl font-bold text-slate-700 dark:text-slate-100">
          {current?.point?.name ?? '—'}
        </p>
        <p className="mt-1 text-xl xl:text-2xl font-bold text-amber-600 dark:text-amber-400">
          {current?.time_calculated ?? 'Sin horario'}
        </p>
      </InfoCard>

      <InfoCard title="Siguiente punto">
        <p className="text-xl xl:text-2xl font-bold text-slate-700 dark:text-slate-100">
          {next?.point?.name ?? 'Sin más puntos'}
        </p>
        <p className="mt-1 text-xl xl:text-2xl font-bold text-amber-600 dark:text-amber-400">
          {next?.time_calculated ?? 'Sin horario'}
        </p>
      </InfoCard>
    </div>
  )
}

export default Sidebar
