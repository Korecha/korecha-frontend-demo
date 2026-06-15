import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Location } from '../../types'

const CORRIDOR_CENTER: [number, number] = [8.98, 38.76]

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

const liveIcon = L.divIcon({
  className: '',
  html: '<div class="driver-live-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const routeIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:9999px;background:#10b981;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

interface DriverMapProps {
  driverPosition?: { lat: number; lng: number } | null
  routeLocations?: Location[]
  isLive?: boolean
  className?: string
  interactive?: boolean
}

export function DriverMap({
  driverPosition,
  routeLocations = [],
  isLive = false,
  className = 'h-full w-full',
  interactive = true,
}: DriverMapProps) {
  const center: [number, number] = driverPosition
    ? [driverPosition.lat, driverPosition.lng]
    : CORRIDOR_CENTER
  const zoom = driverPosition ? 13 : 7

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="h-full w-full"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} zoom={zoom} />
        {driverPosition && isLive && (
          <Marker position={[driverPosition.lat, driverPosition.lng]} icon={liveIcon}>
            <Popup>You are live on the map</Popup>
          </Marker>
        )}
        {routeLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.coordinates.lat, loc.coordinates.lng]}
            icon={routeIcon}
          >
            <Popup>
              <span className="font-semibold">{loc.name}</span>
              <br />
              <span className="text-xs text-slate-500">{loc.region}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
