import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ArrivalNotification from '../components/ArrivalNotification.jsx'
import { useCheckpointEvents } from '../hooks/useCheckpointEvents.js'

// Fila 1: Navbar fija (120 px; 132 px desde `xl`). Fila 2: contenido de la
// ruta activa.
//
// Los avisos de llegada viven aqui, no dentro de una pagina: el layout no se
// desmonta al navegar, asi que el polling y su lastEventId sobreviven al cambio
// de ruta y la notificacion aparece igual en /, /map, /itinerary e /info.
function MainLayout() {
  const { current, dismiss } = useCheckpointEvents()

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      {/* `relative` da el marco al aviso de llegada: se superpone al contenido
          de la ruta activa sin desplazarlo y sin invadir el navbar. */}
      <main className="relative flex-1 overflow-hidden">
        <Outlet />
        {current && <ArrivalNotification event={current} onClose={dismiss} />}
      </main>
    </div>
  )
}

export default MainLayout
