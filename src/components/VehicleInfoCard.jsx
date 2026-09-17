import Card from './Card.jsx'
import StatusMessage from './StatusMessage.jsx'
import { VEHICLE_MESSAGES } from '../utils/statusMessages.js'
import { useVehicle } from '../hooks/useVehicle.js'

// Texto para un campo ausente. Nunca se deja pasar `undefined` o `null` a la
// pantalla: un guion dice «no hay dato», y eso es lo que hay que decir.
const MISSING = 'No disponible'

function VehicleField({ label, value, accent = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-base text-slate-500 dark:text-slate-400 lg:text-lg">{label}</dt>
      <dd
        className={`text-xl font-bold break-words lg:text-2xl ${
          accent ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * Ficha del vehículo: la ÚNICA de la aplicación.
 *
 * Antes estaba repartida entre Home y el panel lateral de `/map`, con campos
 * distintos en cada una —Home no mostraba el propietario— y con dos hooks
 * consultando la API en paralelo. Ahora vive solo aquí, en `/info`, que es donde
 * se consulta de vez en cuando; Home y Mapa quedaron para lo que el conductor
 * mira en marcha y ya no hacen polling del vehículo.
 *
 * Reúne los campos de las dos versiones anteriores: registro, placa, cooperativa
 * y propietario.
 *
 * `useVehicle` conserva la última ficha válida ante un fallo puntual de la API
 * local, así que con `status: 'error'` se sigue mostrando lo último bueno y el
 * aviso va aparte, en tono discreto.
 */
function VehicleInfoCard() {
  const { vehicle, status } = useVehicle()

  const owner = [vehicle?.user?.name, vehicle?.user?.lastname].filter(Boolean).join(' ')

  return (
    <Card title="Información del vehículo">
      {/* Solo se muestra el mensaje de estado cuando no hay ficha que enseñar:
          con datos conservados, el aviso de abajo dice lo necesario. */}
      {!vehicle && <StatusMessage status={status} messages={VEHICLE_MESSAGES} size="lg" />}

      {vehicle && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <VehicleField label="Registro" value={vehicle.register ?? MISSING} />
          <VehicleField label="Placa" value={vehicle.plate ?? MISSING} />
          <VehicleField label="Cooperativa" value={vehicle.company?.name ?? MISSING} accent />
          <VehicleField label="Propietario" value={owner || MISSING} />
        </dl>
      )}

      {vehicle && status === 'error' && (
        <p className="mt-3 text-base text-amber-600 dark:text-amber-400">
          No se pudo actualizar la información del vehículo
        </p>
      )}
    </Card>
  )
}

export default VehicleInfoCard
