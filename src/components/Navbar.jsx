import { NavLink } from 'react-router-dom'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useTheme } from '../context/ThemeContext.jsx'

// Los cuatro destinos de la pantalla. Todos comparten estilo y estado
// activo; `icon` sigue soportado abajo aunque hoy ninguno lo use.
const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/map', label: 'Mapa' },
  { to: '/itinerary', label: 'Itinerario' },
  { to: '/info', label: 'Info' },
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

      {/* La fecha se oculta por debajo de `lg`: en la pantalla de 7" (800 px)
          no cabe junto al reloj y los tres enlaces, y provocaba desborde
          horizontal. El reloj, que es lo que el conductor mira, siempre queda. */}
      <div className="hidden flex-row justify-between gap-2 lg:flex">
        <span className="font-mono text-4xl text-slate-800 dark:text-slate-100">{date}</span>
      </div>

      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 items-center gap-2 rounded-md px-4 py-4 text-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              {Icon && <Icon className="h-7 w-7 shrink-0" />}
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
