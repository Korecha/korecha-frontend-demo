import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import type { Container, Location } from '../../types'
import { formatDate, SIZE_LABELS } from '../../utils/format'

const CORRIDOR_CENTER: [number, number] = [9.16, 40.08]
const CORRIDOR_ZOOM = 6

const CORRIDOR_ROUTE: [number, number][] = [
  [11.5721, 43.1456],
  [11.7869, 42.8844],
  [9.5892, 41.8661],
  [8.5953, 39.1214],
  [9.03, 38.74],
]

const LOCATION_TYPE_COLORS: Record<string, string> = {
  PORT: '#2563eb',
  DRY_PORT: '#7c3aed',
  BORDER: '#f59e0b',
  CITY: '#10b981',
  WAREHOUSE: '#64748b',
  TRUCK_STOP: '#0ea5e9',
}

const CONTAINER_STATUS_COLORS: Record<string, string> = {
  AT_PORT: '#0891b2',
  IN_TRANSIT: '#7c3aed',
  LOADED: '#2563eb',
  AVAILABLE: '#10b981',
  EMPTY: '#0ea5e9',
  DISCHARGED: '#64748b',
  MAINTENANCE: '#f59e0b',
}

function markerIcon(color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function containerIcon(status: string) {
  const color = CONTAINER_STATUS_COLORS[status] || '#334155'
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:7px;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(15,23,42,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:800">C</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

interface AdminCorridorMapProps {
  containers: Container[]
  locations: Location[]
}

export function AdminCorridorMap({ containers, locations }: AdminCorridorMapProps) {
  const containersWithCoordinates = containers.filter((container) => container.location?.coordinates)
  const activeLocations = locations.filter((location) => location.isActive !== false)

  return (
    <div className="overflow-hidden rounded-2xl border border-korecha-border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-korecha-border px-6 py-4">
        <div>
          <h3 className="font-bold text-slate-900">Corridor Map</h3>
          <p className="mt-1 text-sm text-slate-500">
            Djibouti to Addis corridor with container locations and platform waypoints.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Waypoints
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-violet-600" />
            Containers
          </span>
        </div>
      </div>

      <div className="h-[420px]">
        <MapContainer center={CORRIDOR_CENTER} zoom={CORRIDOR_ZOOM} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={CORRIDOR_ROUTE} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.55 }} />

          {activeLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.coordinates.lat, location.coordinates.lng]}
              icon={markerIcon(LOCATION_TYPE_COLORS[location.type] || '#64748b')}
            >
              <Popup>
                <span className="font-semibold">{location.name}</span>
                <br />
                <span className="text-xs text-slate-500">
                  {location.type.replace(/_/g, ' ')} · {location.region}
                </span>
              </Popup>
            </Marker>
          ))}

          {containersWithCoordinates.map((container) => {
            const coordinates = container.location?.coordinates
            if (!coordinates) return null

            return (
              <Marker
                key={container.id}
                position={[coordinates.lat, coordinates.lng]}
                icon={containerIcon(container.status)}
              >
                <Popup>
                  <span className="font-mono font-semibold">{container.containerNumber}</span>
                  <br />
                  <span className="text-xs text-slate-500">
                    {SIZE_LABELS[container.size] || container.size} · {container.type}
                  </span>
                  <br />
                  <span className="text-xs text-slate-500">Status: {container.status.replace(/_/g, ' ')}</span>
                  <br />
                  <span className="text-xs text-slate-500">Owner: {container.organization?.name || '—'}</span>
                  <br />
                  <span className="text-xs text-slate-500">Location: {container.location?.label || '—'}</span>
                  <br />
                  <span className="text-xs text-slate-500">Last free day: {formatDate(container.lastFreeDay)}</span>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-slate-500">
        <span>{containersWithCoordinates.length} containers with map coordinates</span>
        <span>{activeLocations.length} active corridor locations</span>
      </div>
    </div>
  )
}
