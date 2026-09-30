import PassengerCountCard from '../components/PassengerCountCard.jsx'
import { usePassengersToday } from '../hooks/usePassengersToday.js'

/**
 * Vista de métricas (`/metrics`): analíticas del bus.
 *
 * Por ahora solo el conteo de pasajeros del día, que ocupa toda la página y se
 * refresca solo (ver usePassengersToday). Al sumar más tarjetas, volver a una
 * rejilla.
 */
function Metrics() {
  const { total, status, updatedAt } = usePassengersToday()

  return (
    <div className="h-full overflow-hidden p-4 lg:p-6">
      <h1 className="sr-only">Métricas</h1>
      <PassengerCountCard total={total} status={status} updatedAt={updatedAt} />
    </div>
  )
}

export default Metrics
