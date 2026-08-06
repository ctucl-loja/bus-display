import { NavLink } from 'react-router-dom'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/itinerary', label: 'Itinerario' },
]

function Navbar() {
  const { date, time } = useEcuadorClock()

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-cyan-500/20 bg-slate-900/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex p-2 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-bold text-cyan-400 ring-1 ring-cyan-400/40">
          SIMTRA
        </div>
        
      </div>

      <div className="hidden md:flex flex-row gap-4">
        <span className="font-mono text-xl font-bold tabular-nums tracking-wider text-cyan-400">
          {time}
        </span>
        <span className="text-xl font-bold font-mono text-slate-100">{date}</span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-400/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
