import MapView from '../components/MapView.jsx'
import Sidebar from '../components/Sidebar.jsx'
import PassengerCountCard from '../components/PassengerCountCard.jsx'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useDispatch } from '../hooks/useDispatch.js'
import { usePassengersToday } from '../hooks/usePassengersToday.js'
import { findCurrentStep, findCurrentAndNextCheckpoint } from '../utils/itinerary.js'

// Vista de mapa (`/map`): mapa (~75%) + barra lateral (~25%).
//
// Es la Home original. Se movió a su propia ruta cuando `/` pasó a mostrar la
// información operativa en grande y sin mapa. El itinerario se pide una sola vez
// aquí y se comparte entre el mapa y el sidebar.
//
// El panel lateral ya no incluye la ficha del vehículo: vive en `/info`, en una
// sola tarjeta con todos sus campos. Por eso esta vista tampoco consulta
// `useVehicle` — solo el despacho y el GPS.
//
// `shrink-0` en la sección del mapa: por debajo de `lg` las dos secciones se
// apilan dentro de un contenedor flex, y sin él el mapa se comprimía a unos
// pocos píxeles para dejar sitio al panel — justo en la pantalla de 7", que es
// donde importa. El contenedor ya desplaza verticalmente.
//
// El panel lateral es una columna: arriba el conteo de pasajeros del día
// (tarjeta compacta, alto fijo y `shrink-0`) y debajo el Sidebar, que en `lg`
// toma el resto (`flex-1 min-h-0`) y desplaza su propio contenido. Por debajo
// de `lg` ambos miden lo que su contenido y desplaza la página. El conteo se
// pide aquí, no dentro de la tarjeta, que es solo presentacional.
function Map() {
  const { time } = useEcuadorClock()
  const { steps, status } = useDispatch()
  const passengers = usePassengersToday()

  const currentStep = findCurrentStep(steps, time)
  const { current, next } = findCurrentAndNextCheckpoint(currentStep, time)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:h-full lg:flex-row lg:overflow-hidden xl:gap-5 xl:p-5">
      <section className="h-[60vh] w-full shrink-0 overflow-hidden rounded-xl dark:border dark:border-slate-800 shadow-lg shadow-black/40 lg:h-full lg:w-2/3">
        <MapView checkpoints={currentStep?.checkpoints ?? []} />
      </section>
      <aside className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:w-1/3 xl:gap-5">
        <PassengerCountCard
          variant="compact"
          className="shrink-0"
          total={passengers.total}
          status={passengers.status}
          updatedAt={passengers.updatedAt}
        />
        <div className="lg:min-h-0 lg:flex-1">
          <Sidebar status={status} currentStep={currentStep} current={current} next={next} />
        </div>
      </aside>
    </div>
  )
}

export default Map
