import { useDragScroll } from '../hooks/useDragScroll.js'
import Card from '../components/Card.jsx'

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
    <img
      src={source}
      alt={`Logotipo de ${organization}`}
      className="max-h-120 w-auto max-w-full object-contain"
    />
  )
}

/**
 * Vista institucional (`/info`): quién hizo este sistema y cómo contactarlo.
 *
 * El contenido es inerte: no hay enlaces, `mailto:`, `tel:` ni botones de
 * copiar; los datos de contacto y los logotipos son texto e imágenes, para que
 * nada pueda sacar a Chromium del modo kiosco.
 *
 * Aquí NO hay ninguna acción. La conectividad, el formulario de Wi-Fi, el
 * apagado y el reinicio viven ahora en `/settings` (Configuración): esta vista
 * se mira, aquella hace cosas, y un botón destructivo no debe estar donde el
 * conductor entra a leer un teléfono.
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

        <Card title="Red y energía del dispositivo">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl">
            La información de red, la conexión a una red Wi-Fi y el apagado o reinicio del equipo
            están ahora en <span className="font-semibold">Configuración</span>, el botón con el
            engranaje de la barra superior.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Info
