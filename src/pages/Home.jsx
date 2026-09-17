import InfoCard from '../components/InfoCard.jsx'
import LapCard from '../components/LapCard.jsx'
import ReloadDispatchButton from '../components/ReloadDispatchButton.jsx'
import { useEcuadorClock } from '../hooks/useEcuadorClock.js'
import { useDispatch } from '../hooks/useDispatch.js'
import { findCurrentAndNextCheckpoint } from '../utils/itinerary.js'
import {
  resolveHomeSchedule,
  currentLapMessage,
  nextLapMessage,
  pointsMessage,
  isFinishedContext,
} from '../utils/homeSchedule.js'

// Home (`/`): la información operativa del recorrido, a plena anchura y con
// tipografía legible desde el asiento del conductor. El mapa NO se monta aquí
// —vive en `/map`—, así que Home tampoco hace polling de GPS.
//
// Tres filas bajo el navbar:
//
//   ┌──────────────────────────────────────────────┐
//   │ LÍNEA ACTUAL      código · línea   Inicio/Fin │
//   ├──────────────────────┬───────────────────────┤
//   │ PUNTO ACTUAL         │ SIGUIENTE PUNTO       │
//   ├──────────────────────┴───────────────────────┤
//   │ SIGUIENTE VUELTA  código · línea   Inicio/Fin │
//   └──────────────────────────────────────────────┘
//
// «Siguiente punto» es el próximo punto de control DENTRO de la vuelta en curso.
// «Siguiente vuelta» es el próximo step del itinerario, y puede ser de la misma
// línea: un bus repite la misma ruta varias veces al día. Son dos cosas
// distintas y por eso ocupan filas distintas.
//
// La ficha del vehículo ya NO está aquí: se movió a `/info`, donde se consulta
// de vez en cuando, en vez de ocupar sitio en la pantalla que el conductor mira
// mientras conduce. Home, en consecuencia, tampoco hace polling del vehículo.
//
// Presupuesto vertical en la pantalla de 7" (800x480): el navbar ocupa 120 px,
// así que quedan unos 360 px para las tres filas más el botón de recarga. El
// contenedor reparte el espacio sobrante entre las filas en pantallas más altas
// y desplaza cuando no alcanza, para que ningún estado quede inalcanzable.

// Datos principales frente a etiquetas y secundarios.
const POINT_NAME_CLASS =
  'text-[26px] leading-tight font-bold break-words text-slate-800 dark:text-slate-50 lg:text-[36px]'
const POINT_TIME_CLASS =
  'mt-0.5 font-mono text-[26px] leading-none font-bold tabular-nums text-amber-600 dark:text-amber-400 lg:text-[36px]'

function PointCard({ title, checkpoint, fallbackName, message }) {
  // Sin vuelta en curso no se muestran puntos: el conductor los leería como el
  // recorrido que tiene delante.
  if (message) {
    return (
      <InfoCard title={title} size="compact" className="flex flex-col justify-center">
        <p className="text-lg leading-snug font-semibold text-slate-500 lg:text-xl dark:text-slate-400">
          {message}
        </p>
      </InfoCard>
    )
  }

  return (
    <InfoCard title={title} size="compact" className="flex flex-col justify-center">
      <p className={POINT_NAME_CLASS}>{checkpoint?.point?.name ?? fallbackName}</p>
      <p className={POINT_TIME_CLASS}>{checkpoint?.time_calculated ?? 'Sin horario'}</p>
    </InfoCard>
  )
}

// Aviso discreto cuando el itinerario mostrado no se pudo actualizar. No vacía
// nada: `useDispatch` conserva los últimos datos buenos ante un fallo puntual.
function StaleNotice() {
  return (
    <p
      role="status"
      className="shrink-0 text-base font-medium text-amber-600 dark:text-amber-400"
    >
      No se pudo actualizar el itinerario. Se muestran los últimos datos recibidos.
    </p>
  )
}

function Home() {
  const { time } = useEcuadorClock()
  const { steps, status, refresh, refreshing, refreshResult, dismissRefreshResult } = useDispatch()

  // `resolveHomeSchedule` es lo que distingue «vuelta en curso» de «todavía no
  // empieza» o «ya terminó». `findCurrentStep` no sirve aquí: devuelve un tramo
  // siempre que haya alguno, así que su resultado no prueba que esté activo.
  const { phase, currentStep, previousStep, nextStep } = resolveHomeSchedule(steps, time)

  // La vuelta que se enseña arriba: la activa, o la anterior como contexto.
  const finished = isFinishedContext(phase)
  const topStep = currentStep ?? (finished ? previousStep : null)

  // Los puntos salen SOLO de la vuelta en curso.
  const { current, next } = findCurrentAndNextCheckpoint(currentStep, time)
  const pointsBlocked = currentStep ? null : pointsMessage(phase)

  // Mientras no ha llegado la primera respuesta no se anticipa ningún estado
  // vacío: «no hay itinerario» y «todavía no cargó» son cosas distintas.
  const loading = status === 'loading'
  const topMessage = loading ? 'Cargando itinerario…' : currentLapMessage(phase)
  const bottomMessage = loading ? 'Cargando itinerario…' : nextLapMessage(phase)
  const pointsBlockedMessage = loading ? 'Cargando itinerario…' : pointsBlocked

  // Un error de lectura no vacía la pantalla: si hay datos conservados se
  // siguen mostrando y el aviso va aparte.
  const stale = status === 'error' && steps.length > 0

  return (
    // La cadena de alturas: MainLayout da `flex-1` al <main>, esto toma `h-full`
    // y `min-h-0` para poder encogerse dentro de él. No se añade otro `h-screen`
    // debajo del navbar, que desbordaría por los 120 px de la barra.
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto px-2 py-1.5 lg:gap-4 lg:p-4">
      {/* `flex-1 basis-0` reparte el espacio sobrante entre las tres filas en
          pantallas altas; `min-h-min` impide que se compriman por debajo de su
          contenido cuando no alcanza — ahí manda el scroll del contenedor. */}
      <div className="flex min-h-min flex-1 basis-0 flex-col">
        <LapCard
          title="Línea actual"
          step={topStep}
          message={topMessage}
          badge={finished && topStep ? 'Vuelta finalizada' : null}
          muted={finished}
        />
        {/* Entre vueltas la tarjeta enseña la anterior como contexto, así que el
            estado real se dice aparte: sin esto, una vuelta terminada con su
            código y su horario se lee como la vuelta en curso. */}
        {finished && topStep && (
          <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
            {topMessage}
          </p>
        )}
      </div>

      {/* Dos columnas desde 640 px, así que en la pantalla de 800 px siempre van
          lado a lado. Por debajo se apilan, sin desbordar en horizontal. */}
      <div className="grid min-h-min flex-1 basis-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-4">
        <PointCard
          title="Punto actual"
          checkpoint={current}
          fallbackName="—"
          message={pointsBlockedMessage}
        />
        <PointCard
          title="Siguiente punto"
          checkpoint={next}
          fallbackName="Sin más puntos"
          message={pointsBlockedMessage}
        />
      </div>

      <div className="flex min-h-min flex-1 basis-0 flex-col">
        <LapCard title="Siguiente vuelta" step={nextStep} message={bottomMessage} />
      </div>

      {stale && <StaleNotice />}

      {/* La recarga conserva toda su funcionalidad y se queda al final, compacta:
          las tres filas operativas son lo que el conductor mira en marcha. Su
          altura —y la del panel de resultado— cuentan en el layout, por eso van
          dentro del mismo contenedor desplazable y con `shrink-0`. */}
      <div className="shrink-0">
        <ReloadDispatchButton
          onReload={refresh}
          refreshing={refreshing}
          result={refreshResult}
          onDismiss={dismissRefreshResult}
        />
      </div>
    </div>
  )
}

export default Home
