import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getCurrentPositionReliable, getGeoErrorMessage } from '../../utils/geolocation'
import type { Location } from '../../types'

const CORRIDOR_CENTER: [number, number] = [8.98, 38.76]

export interface MapPoint {
  label: string
  coordinates: { lat: number; lng: number }
  locationId?: string
}

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 2px 6px rgba(37,99,235,.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const deliveryIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#f59e0b;border:3px solid white;box-shadow:0 2px 6px rgba(245,158,11,.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const presetIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;border-radius:9999px;background:#94a3b8;border:2px solid white;opacity:.85"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FitRouteBounds({ pickup, delivery }: { pickup: MapPoint | null; delivery: MapPoint | null }) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = []
    if (pickup) points.push([pickup.coordinates.lat, pickup.coordinates.lng])
    if (delivery) points.push([delivery.coordinates.lat, delivery.coordinates.lng])
    if (points.length === 1) {
      map.flyTo(points[0], 12, { duration: 0.6 })
    } else if (points.length === 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 })
    }
  }, [pickup, delivery, map])
  return null
}

interface JobLocationPickerProps {
  pickup: MapPoint | null
  delivery: MapPoint | null
  activeMode: 'pickup' | 'delivery'
  onModeChange: (mode: 'pickup' | 'delivery') => void
  onPointSet: (mode: 'pickup' | 'delivery', point: MapPoint) => void
  presetLocations?: Location[]
  className?: string
}

export function JobLocationPicker({
  pickup,
  delivery,
  activeMode,
  onModeChange,
  onPointSet,
  presetLocations = [],
  className = 'h-[42vh] min-h-[220px]',
}: JobLocationPickerProps) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setGeoError(null)
    try {
      const pos = await getCurrentPositionReliable()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const label =
        activeMode === 'pickup'
          ? `My location — pickup (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          : `My location — delivery (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      onPointSet(activeMode, { label, coordinates: { lat, lng } })
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setGeoError(getGeoErrorMessage(err))
      } else {
        setGeoError(err instanceof Error ? err.message : 'Could not get your location')
      }
    } finally {
      setLocating(false)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    const label =
      activeMode === 'pickup'
        ? `Pickup (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        : `Delivery (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    onPointSet(activeMode, { label, coordinates: { lat, lng } })
  }

  const handlePresetClick = (loc: Location) => {
    onPointSet(activeMode, {
      label: loc.name,
      coordinates: loc.coordinates,
      locationId: loc.id,
    })
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-korecha-border shadow-xl shadow-blue-900/5 ${className}`}>
      <div className="absolute inset-x-0 top-0 z-[1000] flex gap-2 p-3">
        <button
          type="button"
          onClick={() => onModeChange('pickup')}
          className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold shadow-md backdrop-blur-md transition ${
            activeMode === 'pickup'
              ? 'bg-korecha-primary text-white ring-2 ring-blue-300'
              : 'bg-white/90 text-slate-700 hover:bg-white'
          }`}
        >
          {pickup ? '✓ Pickup' : 'Set pickup'}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('delivery')}
          className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold shadow-md backdrop-blur-md transition ${
            activeMode === 'delivery'
              ? 'bg-amber-500 text-white ring-2 ring-amber-300'
              : 'bg-white/90 text-slate-700 hover:bg-white'
          }`}
        >
          {delivery ? '✓ Delivery' : 'Set delivery'}
        </button>
      </div>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="absolute bottom-14 right-3 z-[1000] flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-70"
      >
        <svg className="h-4 w-4 text-korecha-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {locating ? 'Locating...' : 'Use current location'}
      </button>

      {geoError && (
        <p className="absolute inset-x-3 bottom-12 z-[1000] rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700 ring-1 ring-red-200">
          {geoError}
        </p>
      )}

      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-8 text-center text-xs font-medium text-white">
        Tap the map, use current location, or tap a hub for {activeMode === 'pickup' ? 'pickup' : 'delivery'}
      </p>

      <MapContainer
        center={CORRIDOR_CENTER}
        zoom={7}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={handleMapClick} />
        <FitRouteBounds pickup={pickup} delivery={delivery} />

        {presetLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.coordinates.lat, loc.coordinates.lng]}
            icon={presetIcon}
            eventHandlers={{ click: () => handlePresetClick(loc) }}
          >
            <Popup>
              <button
                type="button"
                className="text-left text-sm font-semibold text-korecha-primary hover:underline"
                onClick={() => handlePresetClick(loc)}
              >
                Use {loc.name}
              </button>
              <br />
              <span className="text-xs text-slate-500">{loc.region}</span>
            </Popup>
          </Marker>
        ))}

        {pickup && (
          <Marker position={[pickup.coordinates.lat, pickup.coordinates.lng]} icon={pickupIcon}>
            <Popup>
              <span className="font-semibold text-korecha-primary">Pickup</span>
              <br />
              <span className="text-xs">{pickup.label}</span>
            </Popup>
          </Marker>
        )}

        {delivery && (
          <Marker position={[delivery.coordinates.lat, delivery.coordinates.lng]} icon={deliveryIcon}>
            <Popup>
              <span className="font-semibold text-amber-700">Delivery</span>
              <br />
              <span className="text-xs">{delivery.label}</span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
