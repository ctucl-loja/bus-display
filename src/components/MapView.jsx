import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import busMarkerIcon from '../assets/icons/bus-marker.svg'
import busLiveIcon from '../assets/icons/bus-amarillo-marker.svg'
import { useTheme } from '../context/ThemeContext.jsx'
import { useGpsPosition } from '../hooks/useGpsPosition.js'

const LOJA_COORDS = [-3.9931, -79.2042]

// Teselas de OpenStreetMap: son libres y NO piden API key, a diferencia de los
// basemaps de CARTO que usábamos antes (ahora estampan "API KEY REQUIRED" sobre
// cada tesela). Para conservar el aspecto sobrio de los mapas anteriores no se
// cambia de proveedor por tema: se usa la misma capa y se la tiñe por CSS
// (.map-tiles-dark / .map-tiles-light en index.css), así el tema oscuro sigue
// siendo oscuro y el claro sigue siendo pálido y sin saturación.
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const TILE_CLASSNAMES = {
  dark: 'map-tiles-dark',
  light: 'map-tiles-light',
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

// Leaflet lanza (o dibuja en un lugar arbitrario) con coordenadas no finitas,
// así que se filtra antes de renderizar: un punto sin ubicación utilizable
// simplemente no se pinta.
function hasValidCoords(point) {
  return Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude)
}

function MapView({ checkpoints = [] }) {
  const { theme } = useTheme()
  const { position, status } = useGpsPosition()

  const drawable = Array.isArray(checkpoints)
    ? checkpoints.filter((checkpoint) => hasValidCoords(checkpoint?.point))
    : []

  return (
    <MapContainer center={LOJA_COORDS} zoom={18} scrollWheelZoom className="h-full w-full">
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={OSM_TILE_URL}
        className={TILE_CLASSNAMES[theme]}
        maxZoom={19}
      />

      {drawable.map((checkpoint) => (
        <Marker
          key={checkpoint.key ?? checkpoint.id}
          position={[checkpoint.point.latitude, checkpoint.point.longitude]}
          icon={checkpointIcon}
        >
          <Popup>
            {checkpoint.point.name ?? 'Punto sin nombre'}
            <br />
            {checkpoint.time_calculated ?? 'Sin horario'}
          </Popup>
        </Marker>
      ))}

      {hasValidCoords(position) && (
        <>
          <Marker position={[position.latitude, position.longitude]} icon={busIcon} zIndexOffset={1000}>
            <Popup>
              <strong>Posición del bus</strong>
              <br />
              {formatTime(position.timestamp)}
              {Number.isFinite(position.speed) && <> · {position.speed.toFixed(0)} km/h</>}
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
