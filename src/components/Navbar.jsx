import { NavLink } from 'react-router-dom'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useTheme } from '../context/ThemeContext.jsx'

function GearIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

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

// Los cinco destinos de la pantalla. Todos comparten estilo y estado activo.
//
// `iconOnly` es lo que reparte la segunda fila del navbar: los enlaces con texto
// van a la izquierda en su orden de siempre, y los de solo icono a la derecha,
// junto al cambio de tema. Configuración va sin etiqueta porque a 800 px una
// quinta palabra desborda la fila; `srOnly` conserva su nombre accesible además
// del `aria-label`.
const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/map', label: 'Mapa' },
  { to: '/itinerary', label: 'Itinerario' },
  { to: '/info', label: 'Info' },
  { to: '/settings', label: 'Configuración', icon: GearIcon, iconOnly: true, srOnly: true },
]

// Se reparten una sola vez, no en cada render. El orden de cada grupo es el del
// arreglo, así que conservarlo aquí conserva el orden en pantalla.
const TEXT_LINKS = NAV_LINKS.filter((link) => !link.iconOnly)
const ICON_LINKS = NAV_LINKS.filter((link) => link.iconOnly)

// Mismo alto de pulsación para enlaces y para el botón de tema (56 px; 64 px en
// el panel de 1280x800): la fila completa mide lo mismo la toque el conductor
// donde la toque.
const CONTROL_HEIGHT = 'min-h-14 xl:min-h-16'

function navLinkClass({ isActive }) {
  return `flex ${CONTROL_HEIGHT} items-center gap-2 rounded-md px-2 py-2 text-base font-medium transition-colors sm:px-3 sm:text-lg lg:px-4 lg:text-xl xl:px-5 xl:text-2xl ${
    isActive
      ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/30'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`
}

function NavItem({ to, label, icon: Icon, srOnly }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      aria-label={label}
      title={label}
      className={navLinkClass}
    >
      {Icon && <Icon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10" />}
      <span className={srOnly ? 'sr-only' : undefined}>{label}</span>
    </NavLink>
  )
}

/**
 * Barra superior, en DOS filas dentro del mismo presupuesto de 120 px:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ 10:35:42              Jueves, 17 de septiembre de 2026  │
 *   │ Home  Mapa  Itinerario  Info                      ⚙  ☀ │
 *   └────────────────────────────────────────────────────────┘
 *
 * Fila 1: hora a la izquierda, fecha a la derecha.
 * Fila 2: enlaces con texto a la izquierda, controles de solo icono a la derecha.
 *
 * La FECHA YA NO SE OCULTA en pantallas pequeñas. Antes iba en la misma fila que
 * el reloj y los enlaces, y a 800 px no cabían los tres: se escondía por debajo
 * de `lg`. Al separar las filas hay sitio de sobra, así que en vez de ocultar
 * información se ajustan tamaños y separaciones, que era lo que faltaba.
 *
 * El alto es 120 px en la pantalla de 7" y 132 px desde `xl` (≥1280 px), que es
 * lo justo para la fila de 48 px del reloj más la de 64 px de los controles.
 * `MainLayout` reparte el resto con `flex-1`: quedan ~360 px a 800x480 y 668 px
 * a 1280x800, que es sobre lo que están calculadas las vistas. Cambiar estos dos
 * valores obligaría a recalcularlas.
 */
function Navbar() {
  const { date, time } = useEcuadorClock()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-[120px] shrink-0 flex-col justify-center gap-1 border-b border-slate-200 bg-white/80 px-3 backdrop-blur-sm lg:gap-2 lg:px-6 xl:h-[132px] xl:gap-2.5 xl:px-8 dark:border-cyan-500/20 dark:bg-slate-900/80">
      {/* ── Fila 1: hora · fecha ──────────────────────────────────────────── */}
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="shrink-0 font-mono text-2xl font-bold tabular-nums tracking-wider text-cyan-600 sm:text-3xl lg:text-4xl xl:text-5xl dark:text-cyan-400">
          {time}
        </span>
        {/* `min-w-0` deja que la fecha ceda espacio antes que el reloj si el
            ancho se estrecha; el formato largo en español es el que manda el
            tamaño de esta fila. */}
        <span className="min-w-0 text-right text-base font-medium text-slate-700 sm:text-lg lg:text-2xl xl:text-3xl dark:text-slate-200">
          {date}
        </span>
      </div>

      {/* ── Fila 2: enlaces con texto · controles de solo icono ───────────── */}
      <div className="flex w-full items-center justify-between gap-3">
        <nav className="flex items-center gap-0.5 lg:gap-1">
          {TEXT_LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 lg:gap-1">
          {ICON_LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}

          {/* Sigue siendo un BOTÓN, no una ruta: cambia el tema, no navega. */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className={`flex ${CONTROL_HEIGHT} w-12 items-center justify-center rounded-md sm:w-14 xl:w-16 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100`}
          >
            {theme === 'dark' ? <SunIcon className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10" /> : <MoonIcon className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10" />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
