import { useNetworkInfo } from '../hooks/useNetworkInfo.js'
import { useDragScroll } from '../hooks/useDragScroll.js'

// Los logotipos se descubren en tiempo de compilación en vez de importarse:
// un import estático rompería el build mientras los archivos no existan, y la
// aplicación debe seguir compilando sin ellos. Basta con dejar el archivo en
// src/assets/logos/ (ver el README de esa carpeta) y volver a compilar.
const LOGO_FILES = import.meta.glob('../assets/logos/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function findLogo(basename) {
  const match = Object.entries(LOGO_FILES).find(
    ([path]) => path.split('/').pop().replace(/\.[^.]+$/, '') === basename,
  )
  return match ? match[1] : null
}

const LOGOS = [
  { basename: 'consorcio-ciudad-loja', organization: 'Consorcio Ciudad de Loja' },
  { basename: 'mecdevs', organization: 'MEC Devs' },
]

const CONTACT = [
  { label: 'Correo', value: 'ventas@mecdevs.com' },
  { label: 'Teléfono', value: '+593 99 855 9471' },
  { label: 'Sitio web', value: 'www.mecdevs.com' },
]

const CONNECTION_LABELS = {
  wifi: 'Wi-Fi',
  ethernet: 'Conexión por cable',
  other: 'Otra conexión',
}

function WifiIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2 8.8a15 15 0 0 1 20 0" />
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M8.5 16.1a6 6 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  )
}

function EthernetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M7 9V5h10v4" />
      <path d="M8 20v-3M12 20v-3M16 20v-3" />
    </svg>
  )
}

function NetworkIcon({ type, className }) {
  if (type === 'wifi') return <WifiIcon className={className} />
  if (type === 'ethernet') return <EthernetIcon className={className} />
  return null
}

// Tarjeta común: mismo lenguaje visual que InfoCard del sidebar, con tamaños
// pensados para la pantalla de 7".
function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:p-6">
      {title && (
        <h2 className="mb-3 text-base font-semibold uppercase tracking-wide text-cyan-600/90 dark:text-cyan-400/90 lg:text-lg">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function Logo({ basename, organization }) {
  const source = findLogo(basename)

  if (!source) {
    // Marcador discreto mientras el archivo no se ha entregado. No se inventa
    // ni se reconstruye el logotipo.
    return (
      <div className="flex h-24 w-full max-w-xs items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center dark:border-slate-700 dark:bg-slate-800/40">
        <span className="text-base font-medium text-slate-500 dark:text-slate-400 lg:text-lg">
          {organization}
        </span>
      </div>
    )
  }

  return (
    // Fondo claro fijo: muchos logotipos vienen con transparencia y texto
    // oscuro, que desaparecería sobre el tema oscuro.
    <div className="flex h-24 w-full max-w-xs items-center justify-center rounded-lg border border-slate-200 bg-white px-4 dark:border-slate-700">
      <img
        src={source}
        alt={`Logotipo de ${organization}`}
        className="max-h-20 w-auto max-w-full object-contain"
      />
    </div>
  )
}

function ConnectionRow({ connection }) {
  const label = CONNECTION_LABELS[connection.type] ?? CONNECTION_LABELS.other

  return (
    <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      <NetworkIcon type={connection.type} className="mt-1 h-8 w-8 shrink-0 text-cyan-600 dark:text-cyan-400" />
      <dl className="min-w-0 flex-1 space-y-1 text-lg lg:text-xl">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">Tipo:</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-100">{label}</dd>
        </div>
        {connection.type === 'wifi' && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-slate-500 dark:text-slate-400">Red:</dt>
            <dd className="break-all font-semibold text-slate-800 dark:text-slate-100">
              {connection.name ?? 'Nombre no disponible'}
            </dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">Interfaz:</dt>
          <dd className="font-mono text-slate-800 dark:text-slate-100">
            {connection.interface ?? '—'}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-500 dark:text-slate-400">
            {connection.ipv4.length > 1 ? 'Direcciones IP:' : 'Dirección IP:'}
          </dt>
          <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-100">
            {connection.ipv4.length > 0 ? connection.ipv4.join(' · ') : 'Sin dirección asignada'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function Connectivity() {
  const { info, status } = useNetworkInfo()
  const connections = info?.connections ?? []

  if (status === 'loading') {
    return <p className="text-lg text-slate-500 dark:text-slate-400 lg:text-xl">Consultando información de red…</p>
  }

  // Con un fallo transitorio se conserva la última información válida y el
  // aviso va aparte, en tono discreto.
  if (connections.length === 0) {
    const message =
      info?.status === 'disconnected'
        ? 'Sin conexión de red detectada'
        : 'Información de red no disponible'
    return (
      <>
        <p className="text-lg text-slate-500 dark:text-slate-400 lg:text-xl">{message}</p>
        {status === 'error' && <StaleNotice />}
      </>
    )
  }

  return (
    <div className="space-y-3">
      {connections.map((connection) => (
        <ConnectionRow key={connection.key} connection={connection} />
      ))}
      {status === 'error' && <StaleNotice />}
    </div>
  )
}

function StaleNotice() {
  return (
    <p className="text-base text-amber-600 dark:text-amber-400">
      No se pudo actualizar la información de red
    </p>
  )
}

/**
 * Vista informativa. Todo su contenido es de solo lectura: no hay enlaces,
 * `mailto:`, `tel:`, botones de copiar ni manejadores de clic. Los datos de
 * contacto y los logotipos son texto e imágenes inertes, para que nada pueda
 * sacar a Chromium del modo kiosco.
 */
function Info() {
  const { ref, handlers } = useDragScroll()

  return (
    <div
      ref={ref}
      {...handlers}
      className="h-full touch-none select-none overflow-y-auto overflow-x-hidden p-4 lg:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:gap-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 lg:text-4xl">
          Acerca de este sistema
        </h1>

        <Card>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl">
            Esta pantalla informativa fue desarrollada por el Departamento de Desarrollo del
            Consorcio Ciudad de Loja, bajo la responsabilidad del Ing. Joan David Encarnación Díaz.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl">
            Este prototipo forma parte de una iniciativa orientada a modernizar la tecnología
            utilizada en el transporte urbano de la ciudad de Loja, mejorar el acceso a la
            información operativa y evaluar nuevas herramientas para conductores, personal técnico
            y usuarios.
          </p>
        </Card>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {LOGOS.map((logo) => (
            <Logo key={logo.basename} {...logo} />
          ))}
        </div>

        <Card title="Contacto">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl">
            Para obtener más información, soporte o conocer otros proyectos, puede comunicarse
            mediante los siguientes canales:
          </p>
          <dl className="mt-4 space-y-2 text-lg lg:text-xl">
            {CONTACT.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap gap-x-3">
                <dt className="w-32 shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="break-all font-semibold text-slate-800 dark:text-slate-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Conectividad del dispositivo">
          <p className="mb-4 text-base text-slate-500 dark:text-slate-400 lg:text-lg">
            Red a la que está conectado este equipo (la Raspberry Pi), no el dispositivo desde el
            que se abre esta pantalla.
          </p>
          <Connectivity />
        </Card>
      </div>
    </div>
  )
}

export default Info
