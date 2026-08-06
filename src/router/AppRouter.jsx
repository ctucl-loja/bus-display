import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import Home from '../pages/Home.jsx'
import Itinerary from '../pages/Itinerary.jsx'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
