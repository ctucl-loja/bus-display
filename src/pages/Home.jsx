import MapView from '../components/MapView.jsx'
import Sidebar from '../components/Sidebar.jsx'

// Segunda fila del layout: mapa (~75%) + barra lateral (~25%).
function Home() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:h-full lg:flex-row lg:overflow-hidden">
      <section className="h-[60vh] w-full overflow-hidden rounded-xl border border-slate-800 shadow-lg shadow-black/40 lg:h-full lg:w-3/4">
        <MapView />
      </section>
      <aside className="w-full lg:h-full lg:w-1/4">
        <Sidebar />
      </aside>
    </div>
  )
}

export default Home
