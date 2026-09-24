type TabItem<K extends string> = { key: K; label: string }

export function PillTabs<K extends string>({
  items,
  active,
  onChange,
}: {
  items: TabItem<K>[]
  active: K
  onChange: (key: K) => void
}) {
  return (
    <div className="mt-6 flex gap-1 rounded-xl bg-blue-50/80 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
            active === item.key
              ? 'bg-white text-korecha-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function ChipTabs<K extends string>({
  items,
  active,
  onChange,
}: {
  items: TabItem<K>[]
  active: K
  onChange: (key: K) => void
}) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
            active === item.key
              ? 'bg-korecha-primary text-white shadow-sm'
              : 'bg-white text-slate-600 ring-1 ring-korecha-border hover:bg-slate-50'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
