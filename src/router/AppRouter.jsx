import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import Home from '../pages/Home.jsx'
import Map from '../pages/Map.jsx'
import Itinerary from '../pages/Itinerary.jsx'
import Info from '../pages/Info.jsx'
import Settings from '../pages/Settings.jsx'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* `/` abre la Home ampliada (sin mapa). El mapa y su panel
              lateral —la Home anterior— viven ahora en `/map`. */}
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
          <Route path="/itinerary" element={<Itinerary />} />
          {/* Dentro de MainLayout como el resto: conserva navbar, avisos de
              llegada y el polling, que sobreviven al cambio de ruta. */}
          <Route path="/info" element={<Info />} />
          {/* Configuracion: red del equipo, conexion Wi-Fi, apagado y reinicio.
              Tambien dentro de MainLayout, para que las acciones sobre el
              dispositivo no interrumpan los avisos de llegada. */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
