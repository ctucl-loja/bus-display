import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

// Fila 1: Navbar fija (70px). Fila 2: contenido de la ruta activa.
function MainLayout() {
  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
