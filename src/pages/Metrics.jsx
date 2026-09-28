import PassengerCountCard from '../components/PassengerCountCard.jsx'
import { usePassengersToday } from '../hooks/usePassengersToday.js'

/**
 * Vista de métricas (`/metrics`): analíticas del bus.
 *
 * Por ahora solo el conteo de pasajeros del día. La rejilla ya está pensada
 * para sumar más tarjetas al lado sin rehacer la página.
 */
function Metrics() {
  const { total, status } = usePassengersToday()

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 lg:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:gap-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 lg:text-4xl">
          Métricas
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          <PassengerCountCard total={total} status={status} />
        </div>
      </div>
    </div>
  )
}

export default Metrics
