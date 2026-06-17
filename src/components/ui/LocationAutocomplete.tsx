import { useEffect, useMemo, useState } from 'react'
import { Field, Input } from './Input'
import type { Location } from '../../types'

interface LocationAutocompleteProps {
  label: string
  value: string
  locations: Location[]
  onChange: (locationId: string) => void
  required?: boolean
  placeholder?: string
}

export function LocationAutocomplete({
  label,
  value,
  locations,
  onChange,
  required,
  placeholder = 'Search locations...',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = locations.find((loc) => loc.id === value)

  useEffect(() => {
    if (selected) setQuery(selected.name)
    else if (!value) setQuery('')
  }, [selected, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return locations
    return locations.filter((loc) => loc.name.toLowerCase().includes(q))
  }, [locations, query])

  return (
    <Field label={label}>
      <Input
        list={`locations-${label.replace(/\s+/g, '-').toLowerCase()}`}
        value={selected ? selected.name : query}
        onChange={(e) => {
          const next = e.target.value
          setQuery(next)
          const match = locations.find((loc) => loc.name.toLowerCase() === next.toLowerCase())
          if (match) onChange(match.id)
        }}
        onFocus={() => {
          if (selected) setQuery(selected.name)
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      <datalist id={`locations-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        {filtered.map((loc) => (
          <option key={loc.id} value={loc.name} />
        ))}
      </datalist>
      {selected && (
        <p className="mt-1 text-xs text-slate-500">{selected.type.replace(/_/g, ' ').toLowerCase()}</p>
      )}
    </Field>
  )
}
