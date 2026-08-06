import MapView from '../components/MapView.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useDispatch } from '../hooks/useDispatch.js'
import { findCurrentStep, findCurrentAndNextCheckpoint } from '../utils/itinerary.js'

// Segunda fila del layout: mapa (~75%) + barra lateral (~25%).
// El itinerario se pide una sola vez aquí y se comparte entre el mapa y el sidebar.
function Home() {
  const { time } = useEcuadorClock()
  const { steps, status } = useDispatch()

  const currentStep = findCurrentStep(steps, time)
  const { current, next } = findCurrentAndNextCheckpoint(currentStep, time)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:h-full lg:flex-row lg:overflow-hidden">
      <section className="h-[60vh] w-full overflow-hidden rounded-xl border border-slate-800 shadow-lg shadow-black/40 lg:h-full lg:w-1/2">
        <MapView checkpoints={currentStep?.checkpoints ?? []} />
      </section>
      <aside className="w-full lg:h-full lg:w-1/2">
        <Sidebar status={status} currentStep={currentStep} current={current} next={next} />
      </aside>
    </div>
  )
}

export default Home
