import { NavLink } from 'react-router-dom'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useTheme } from '../context/ThemeContext.jsx'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/itinerary', label: 'Itinerario' },
]

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}

function Navbar() {
  const { date, time } = useEcuadorClock()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-[120px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm dark:border-cyan-500/20 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
   
         <span className="font-mono text-4xl font-bold tabular-nums tracking-wider text-cyan-600 dark:text-cyan-400">
          {time}
        </span>
      </div>

      <div className="hidden flex-row justify-between gap-2 md:flex">
      
        <span className="text-4xl font-mono  text-slate-800 dark:text-slate-100 ">{date}</span>
         
      </div>

      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-md px-4 py-4 text-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className="ml-2 flex h-16 w-16 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {theme === 'dark' ? <SunIcon className="h-12 w-12" /> : <MoonIcon className="h-12 w-12" />}
        </button>
      </div>
    </header>
  )
}

export default Navbar
