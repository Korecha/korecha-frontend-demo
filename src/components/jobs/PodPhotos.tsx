import { Card } from '../ui/Card'
import { fileUrl } from '../../utils/fileUrl'
import { refName } from '../../utils/format'
import type { ShipmentLeg } from '../../types'

function locName(value: ShipmentLeg['fromLocationId']): string {
  return refName(value as string | { name?: string } | null | undefined)
}

export function PodPhotos({ legs = [] }: { legs?: ShipmentLeg[] | null }) {
  const photos = (legs || []).filter((leg) => leg.podPhotoUrl)
  if (photos.length === 0) return null

  return (
    <Card>
      <h3 className="font-bold text-slate-900">Delivery photos</h3>
      <p className="mt-1 text-sm text-slate-500">Tap a photo to open it</p>
      <div className="mt-4 space-y-3">
        {photos.map((leg) => {
          const src = fileUrl(leg.podPhotoUrl)
          return (
            <a
              key={leg.id}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl border border-korecha-border bg-slate-50"
            >
              <img
                src={src}
                alt={`Delivery photo for stop ${leg.sequenceNo}`}
                className="h-56 w-full object-cover sm:h-72"
              />
              <p className="px-4 py-3 text-base font-semibold text-slate-800">
                Stop {leg.sequenceNo}
                {leg.fromLocationId || leg.toLocationId
                  ? `: ${locName(leg.fromLocationId)} → ${locName(leg.toLocationId)}`
                  : ''}
              </p>
            </a>
          )
        })}
      </div>
    </Card>
  )
}
