import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/admin/applications', label: 'Importers', end: true },
  { to: '/admin/applications/corporate', label: 'Corporate customers', end: true },
]

export function ApplicationQueueTabs() {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              isActive
                ? 'bg-korecha-primary text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-korecha-border hover:bg-slate-50'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
