import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import busMarkerIcon from '../assets/icons/bus-marker.svg'
import busLiveIcon from '../assets/icons/bus-amarillo-marker.svg'
import { useTheme } from '../context/ThemeContext.jsx'
import { useGpsPosition } from '../hooks/useGpsPosition.js'

const LOJA_COORDS = [-3.9931, -79.2042]

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const checkpointIcon = L.icon({
  iconUrl: busMarkerIcon,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

// Marcador del bus: más grande que los puntos de control para distinguirlo de un vistazo.
const busIcon = L.icon({
  iconUrl: busLiveIcon,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
})

// La hora llega como la serializa FastAPI ("2026-08-18T10:25:00[.123]"); se
// extrae el HH:MM:SS tal cual, sin conversión de zona horaria: la RPi ya
// guarda hora de Ecuador y el navegador corre en el mismo dispositivo.
function formatTime(timestamp) {
  const match = String(timestamp ?? '').match(/(\d{2}:\d{2}:\d{2})/)
  return match ? match[1] : '--:--:--'
}

// Centra el mapa en el bus cada vez que llega una posición nueva.
function FollowBus({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    if (latitude == null || longitude == null) return
    map.panTo([latitude, longitude], { animate: true })
  }, [map, latitude, longitude])

  return null
}

function MapView({ checkpoints = [] }) {
  const { theme } = useTheme()
  const { position, status } = useGpsPosition()

  return (
    <MapContainer center={LOJA_COORDS} zoom={18} scrollWheelZoom className="h-full w-full">
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={TILE_URLS[theme]}
      />

      {checkpoints.map((checkpoint) => (
        <Marker
          key={checkpoint.id}
          position={[checkpoint.point.latitude, checkpoint.point.longitude]}
          icon={checkpointIcon}
        >
          <Popup>
            {checkpoint.point.name}
            <br />
            {checkpoint.time_calculated}
          </Popup>
        </Marker>
      ))}

      {position && (
        <>
          <Marker position={[position.latitude, position.longitude]} icon={busIcon} zIndexOffset={1000}>
            <Popup>
              <strong>Posición del bus</strong>
              <br />
              {formatTime(position.timestamp)}
              {position.speed != null && <> · {position.speed.toFixed(0)} km/h</>}
              {status === 'error' && (
                <>
                  <br />
                  <span className="text-red-600">Sin conexión con el GPS</span>
                </>
              )}
            </Popup>
          </Marker>
          <FollowBus latitude={position.latitude} longitude={position.longitude} />
        </>
      )}
    </MapContainer>
  )
}

export default MapView
