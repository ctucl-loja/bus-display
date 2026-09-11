import InfoCard from '../components/InfoCard.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { DISPATCH_MESSAGES, VEHICLE_MESSAGES } from '../utils/statusMessages.js'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useDispatch } from '../hooks/useDispatch.js'
import { useVehicle } from '../hooks/useVehicle.js'
import { findCurrentStep, findCurrentAndNextCheckpoint } from '../utils/itinerary.js'
import { describeLine } from '../utils/line.js'

// Home (`/`): la misma información operativa que el panel del mapa, pero con
// todo el ancho del body y tipografía legible desde el asiento del conductor.
//
// El mapa NO se monta aquí: vive en `/map`. Por eso Home tampoco hace polling
// de GPS; solo consume el despacho y la ficha del vehículo de la API local.
//
// Presupuesto vertical en la pantalla de 7" (800x480): el navbar ocupa 120 px,
// así que quedan 360 px. Punto actual y Siguiente punto van arriba, en una
// fila de dos columnas, y son lo que se ve al abrir; Línea y Vehículo quedan
// debajo, alcanzables con desplazamiento táctil.
//
// Del vehículo se muestran registro, placa y cooperativa. El propietario NO se
// muestra aquí: es un dato personal que no interviene en la operación del
// recorrido. Sigue estando en el panel lateral de `/map`.

// Datos principales (28–40 px) frente a etiquetas y secundarios (18–24 px).
const POINT_NAME_CLASS =
  'text-[30px] leading-tight font-bold break-words text-slate-800 dark:text-slate-50 lg:text-[40px]'
const POINT_TIME_CLASS =
  'mt-1 font-mono text-[32px] leading-none font-bold tabular-nums text-amber-600 dark:text-amber-400 lg:text-[40px]'

function VehicleField({ label, value, accent = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-lg text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={`text-2xl font-bold break-words ${
          accent ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function Home() {
  const { time } = useEcuadorClock()
  const { steps, status } = useDispatch()
  const { vehicle, status: vehicleStatus } = useVehicle()

  // Misma selección temporal que la vista de mapa: el punto actual se decide
  // por horario calculado, no por la marcación GPS.
  const currentStep = findCurrentStep(steps, time)
  const { current, next } = findCurrentAndNextCheckpoint(currentStep, time)

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-6">
      <div className="flex w-full flex-col gap-3 lg:gap-5">
        {/* Prioridad: los dos puntos, uno junto al otro y a plena anchura. */}
        <div className="grid gap-3 md:grid-cols-2 lg:gap-5">
          <InfoCard title="Punto actual" size="lg">
            <p className={POINT_NAME_CLASS}>{current?.point?.name ?? '—'}</p>
            <p className={POINT_TIME_CLASS}>{current?.time_calculated ?? 'Sin horario'}</p>
          </InfoCard>

          <InfoCard title="Siguiente punto" size="lg">
            <p className={POINT_NAME_CLASS}>{next?.point?.name ?? 'Sin más puntos'}</p>
            <p className={POINT_TIME_CLASS}>{next?.time_calculated ?? 'Sin horario'}</p>
          </InfoCard>
        </div>

        <InfoCard title="Línea" size="lg">
          <StatusMessage status={status} messages={DISPATCH_MESSAGES} size="lg" />
          {currentStep && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[28px] leading-tight font-bold break-words text-slate-800 lg:text-[34px] dark:text-slate-100">
              {/* Código del despacho, enmarcado y en otro color: es lo que
                  permite comprobar de un vistazo que el bus está corriendo el
                  itinerario correcto, así que no debe confundirse con el
                  nombre de la línea. */}
              <span className="rounded-lg border-2 border-violet-500/60 bg-violet-100 px-3 py-0.5 font-mono tracking-wide text-violet-700 dark:border-violet-400/60 dark:bg-violet-500/15 dark:text-violet-300">
                {currentStep.code ?? 'Sin código'}
              </span>
              <span>{describeLine(currentStep.line)}</span>
            </p>
          )}
        </InfoCard>

        <InfoCard title="Vehículo" size="lg">
          <StatusMessage status={vehicleStatus} messages={VEHICLE_MESSAGES} size="lg" />
          {vehicle && (
            <dl className="mt-1 grid grid-cols-3 gap-x-6 gap-y-2">
              <VehicleField label="Registro" value={vehicle.register ?? '—'} />
              <VehicleField label="Placa" value={vehicle.plate ?? '—'} />
              <VehicleField label="Cooperativa" value={vehicle.company?.name ?? '—'} accent />
            </dl>
          )}
        </InfoCard>
      </div>
    </div>
  )
}

export default Home
