import { formatEtb } from '../../utils/format'
import type { JobPricingQuote } from '../../types'

interface JobPricingCardProps {
  quote: JobPricingQuote
  compact?: boolean
}

export function JobPricingCard({ quote, compact = false }: JobPricingCardProps) {
  const perUnit = quote.breakdown.perUnitTotal ?? quote.totalEtb

  if (compact) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-korecha-primary">Estimated haul cost</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatEtb(quote.totalEtb)}</p>
        <p className="mt-1 text-xs text-slate-500">
          {quote.distanceKm} km · {quote.quantity} unit{quote.quantity !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-korecha-primary">Estimated haul cost</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatEtb(quote.totalEtb)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Based on your organization&apos;s pricing settings
          </p>
        </div>
        <div className="rounded-2xl bg-korecha-primary px-3 py-2 text-center text-white">
          <p className="text-lg font-bold">{quote.distanceKm}</p>
          <p className="text-[10px] font-semibold uppercase opacity-90">km</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-4 ring-1 ring-blue-100">
        {quote.basePricePerKm != null && (
          <Row label="Base rate" value={`${formatEtb(quote.basePricePerKm)}/km`} />
        )}
        {quote.effectivePricePerKm != null && quote.effectivePricePerKm !== quote.basePricePerKm && (
          <Row label="Item type rate" value={`${formatEtb(quote.effectivePricePerKm)}/km`} />
        )}
        <Row label="Distance" value={`${quote.distanceKm} km`} />
        <Row label="Per unit" value={formatEtb(perUnit)} />
        <Row label="Quantity" value={String(quote.quantity)} />
        {(quote.breakdown.itemFlatFeeEtb ?? 0) > 0 && (
          <Row label="Item flat fees" value={formatEtb(quote.breakdown.itemFlatFeeEtb!)} />
        )}
        {(quote.breakdown.gateFeesEtb ?? 0) > 0 && (
          <Row label="Gate entrance fees" value={formatEtb(quote.breakdown.gateFeesEtb!)} />
        )}
        {(quote.breakdown.weekendPremium ?? 0) > 0 && (
          <Row label="Weekend premium" value={formatEtb(quote.breakdown.weekendPremium!)} />
        )}
        {quote.breakdown.minTripPriceEtb != null && (
          <Row label="Minimum trip" value={formatEtb(quote.breakdown.minTripPriceEtb)} muted />
        )}
        <div className="border-t border-blue-100 pt-2">
          <Row label="Total estimate" value={formatEtb(quote.totalEtb)} bold />
        </div>
      </div>

      {quote.isWeekend && (
        <p className="mt-3 text-xs font-medium text-amber-700">Weekend surcharge applied per org pricing</p>
      )}
      <p className="mt-2 text-[11px] text-slate-400">
        Final price confirmed when a driver accepts. Shown before truck assignment.
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'font-bold text-korecha-primary' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  )
}
