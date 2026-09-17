import MapView from '../components/MapView.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useDispatch } from '../hooks/useDispatch.js'
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
function Map() {
  const { time } = useEcuadorClock()
  const { steps, status } = useDispatch()

  const currentStep = findCurrentStep(steps, time)
  const { current, next } = findCurrentAndNextCheckpoint(currentStep, time)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:h-full lg:flex-row lg:overflow-hidden">
      <section className="h-[60vh] w-full shrink-0 overflow-hidden rounded-xl dark:border dark:border-slate-800 shadow-lg shadow-black/40 lg:h-full lg:w-2/3">
        <MapView checkpoints={currentStep?.checkpoints ?? []} />
      </section>
      <aside className="w-full lg:h-full lg:w-1/3">
        <Sidebar status={status} currentStep={currentStep} current={current} next={next} />
      </aside>
    </div>
  )
}

export default Map
