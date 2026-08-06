import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import busMarkerIcon from '../assets/icons/bus-marker.svg'

const LOJA_COORDS = [-3.9931, -79.2042]

const checkpointIcon = L.icon({
  iconUrl: busMarkerIcon,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

function MapView({ checkpoints = [] }) {
  return (
    <MapContainer center={LOJA_COORDS} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
    </MapContainer>
  )
}

export default MapView
