import { useDragScroll } from '../hooks/useDragScroll.js'
import Card from '../components/Card.jsx'
import VehicleInfoCard from '../components/VehicleInfoCard.jsx'

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

// Marco individual de cada logotipo.
//
// Fondo claro fijo en los dos temas: muchos logotipos vienen con transparencia y
// texto oscuro, que desaparecería sobre el tema oscuro. El borde lo separa del
// fondo de la página cuando el tema es claro.
//
// Altura acotada (antes `max-h-120`, que en la pantalla de 7" se comía media
// vista) y `object-contain`, así que la imagen nunca se recorta ni se deforma.
const LOGO_FRAME_CLASS =
  'flex h-28 w-full items-center justify-center rounded-lg border border-slate-200 ' +
  'bg-white p-3 sm:h-32 sm:max-w-xs lg:h-40 lg:p-4 xl:h-48 xl:p-5 dark:border-slate-700'

function Logo({ basename, organization }) {
  const source = findLogo(basename)

  if (!source) {
    // Marcador discreto mientras el archivo no se ha entregado. No se inventa
    // ni se reconstruye el logotipo.
    return (
      <div
        className={`${LOGO_FRAME_CLASS} border-dashed bg-slate-50 text-center dark:bg-slate-800/40`}
      >
        <span className="text-base font-medium text-slate-500 dark:text-slate-400 lg:text-lg xl:text-xl">
          {organization}
        </span>
      </div>
    )
  }

  return (
    <div className={LOGO_FRAME_CLASS}>
      <img
        src={source}
        alt={`Logotipo de ${organization}`}
        // ── Por qué estos tres atributos ──────────────────────────────────
        // Chromium trata una imagen como arrastrable por defecto. Al iniciar el
        // gesto de scroll ENCIMA de un logo, el navegador empezaba un
        // drag-and-drop nativo de la imagen: se llevaba el puntero, el
        // `pointermove` dejaba de llegar y la página se quedaba sin desplazarse
        // hasta soltar. Envolverla en un div no lo arregla — el arrastre nace de
        // la propia <img>.
        //
        //   draggable={false} lo desactiva;
        //   onDragStart lo cancela también por si algo lo dispara igual
        //     (Chromium lo hace en algunos caminos pese al atributo);
        //   select-none evita además la selección de la imagen al arrastrar.
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        className="max-h-full w-auto max-w-full select-none object-contain"
      />
    </div>
  )
}

/**
 * Vista institucional (`/info`): la ficha del vehículo, quién hizo este sistema
 * y cómo contactarlo.
 *
 * El contenido es inerte: no hay enlaces, `mailto:`, `tel:` ni botones de
 * copiar; los datos de contacto y los logotipos son texto e imágenes, para que
 * nada pueda sacar a Chromium del modo kiosco.
 *
 * Aquí NO hay acciones sobre el equipo. La conectividad, el formulario de Wi-Fi,
 * el apagado y el reinicio viven en `/settings` (Configuración): esta vista se
 * mira, aquella hace cosas, y un botón destructivo no debe estar donde el
 * conductor entra a leer un teléfono.
 *
 * Un ÚNICO contenedor vertical de scroll para toda la página: sin paneles
 * anidados ni alturas fijas, para que se pueda llegar al final de la última
 * tarjeta arrastrando desde cualquier punto, logotipos incluidos.
 */
function Info() {
  const { ref, handlers } = useDragScroll()

  return (
    <div
      ref={ref}
      {...handlers}
      className="h-full touch-none select-none overflow-y-auto overflow-x-hidden p-4 lg:p-6 xl:p-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:gap-6 xl:max-w-6xl xl:gap-7">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 lg:text-4xl xl:text-5xl">
          Acerca de este sistema
        </h1>

        {/* Cerca del inicio a propósito: es el dato que alguien viene a buscar
            aquí, y antes estaba repartido entre Home y el panel del mapa. */}
        <VehicleInfoCard />

        <Card>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl">
            Esta pantalla informativa fue desarrollada por el Departamento de Desarrollo del
            Consorcio Ciudad de Loja, bajo la responsabilidad del Ing. Joan David Encarnación Díaz.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl">
            Este prototipo forma parte de una iniciativa orientada a modernizar la tecnología
            utilizada en el transporte urbano de la ciudad de Loja, mejorar el acceso a la
            información operativa y evaluar nuevas herramientas para conductores, personal técnico
            y usuarios.
          </p>
        </Card>

        {/* Contenedor común que organiza los dos logotipos; cada uno lleva
            además su propio marco (ver `Logo`). Apilados por debajo de `sm`,
            lado a lado a partir de ahí, con anchos equilibrados. */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {LOGOS.map((logo) => (
            <Logo key={logo.basename} {...logo} />
          ))}
        </div>

        <Card title="Contacto">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl">
            Para obtener más información, soporte o conocer otros proyectos, puede comunicarse
            mediante los siguientes canales:
          </p>
          <dl className="mt-4 space-y-2 text-lg lg:text-xl xl:space-y-3 xl:text-2xl">
            {CONTACT.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap gap-x-3">
                <dt className="w-32 shrink-0 text-slate-500 dark:text-slate-400 xl:w-40">{label}</dt>
                <dd className="break-all font-semibold text-slate-800 dark:text-slate-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Red y energía del dispositivo">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl">
            La información de red, la conexión a una red Wi-Fi y el apagado o reinicio del equipo
            están en <span className="font-semibold">Configuración</span>, el botón con el
            engranaje de la barra superior.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Info
