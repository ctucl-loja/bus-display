// Validación de forma de las respuestas de la API local.
//
// Vive aparte de los módulos de servicio a propósito: son funciones puras, sin
// `fetch` ni variables de entorno, así que se pueden probar directamente y los
// componentes reciben siempre la MISMA forma, vengan como vengan los datos.
//
// Dos reglas que se respetan en todo el archivo:
//
//   · Nunca se inventa un valor. Un campo ausente o ilegible es `null`, no 0 ni
//     "" — 0 es una velocidad válida y `order: 0` es un checkpoint real.
//   · Nunca se muta la respuesta: cada normalización devuelve objetos nuevos.

import { finiteNumber, isObject, nonEmptyString } from '../utils/values.js'

function normalizeLine(raw) {
  if (!isObject(raw)) return null
  return {
    ...raw,
    number: raw.number ?? null,
    name: nonEmptyString(raw.name),
    start_route: nonEmptyString(raw.start_route),
    end_route: nonEmptyString(raw.end_route),
  }
}

function normalizePoint(raw) {
  if (!isObject(raw)) return null
  return {
    ...raw,
    id: raw.id ?? null,
    name: nonEmptyString(raw.name),
    // Coordenadas no finitas se anulan: MapView no debe intentar dibujarlas.
    latitude: finiteNumber(raw.latitude),
    longitude: finiteNumber(raw.longitude),
  }
}

function normalizeCheckpoint(raw, index) {
  if (!isObject(raw)) return null
  return {
    ...raw,
    id: raw.id ?? null,
    // Clave de React estable aunque el backend no mande id.
    key: raw.id ?? `checkpoint-${index}`,
    order: finiteNumber(raw.order),
    time_calculated: nonEmptyString(raw.time_calculated),
    time_reported: nonEmptyString(raw.time_reported),
    point: normalizePoint(raw.point),
  }
}

function normalizeStep(raw, index) {
  if (!isObject(raw)) return null
  const checkpoints = Array.isArray(raw.checkpoints)
    ? raw.checkpoints.map(normalizeCheckpoint).filter(Boolean)
    : []

  return {
    ...raw,
    step: raw.step ?? null,
    key: raw.step ?? `step-${index}`,
    // Código del despacho: Home lo muestra enmarcado para verificar que el bus
    // corre el itinerario correcto. Un código vacío se normaliza a null para
    // que la pantalla enseñe "Sin código" en vez de un recuadro en blanco.
    code: nonEmptyString(raw.code),
    start_schedule: nonEmptyString(raw.start_schedule),
    end_schedule: nonEmptyString(raw.end_schedule),
    line: normalizeLine(raw.line),
    // Siempre un array: los componentes pueden hacer .map sin comprobar.
    checkpoints,
  }
}

/** Lista de tramos con forma garantizada. Cualquier otra cosa → []. */
export function normalizeSteps(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeStep).filter(Boolean)
}

/**
 * Ficha del vehículo aplanada (la API guarda la respuesta remota en `data` y
 * duplica register/plate en columnas propias), o null.
 */
export function normalizeVehicle(raw) {
  if (!isObject(raw)) return null
  const data = isObject(raw.data) ? raw.data : {}
  return {
    ...data,
    register: raw.register ?? data.register ?? null,
    plate: nonEmptyString(raw.plate) ?? nonEmptyString(data.plate),
    user: isObject(data.user) ? data.user : null,
    company: isObject(data.company) ? data.company : null,
  }
}

/**
 * Última posición del bus, o null si no hay coordenadas utilizables: es
 * preferible no pintar el bus a pintarlo en un lugar inventado.
 */
export function normalizeGpsPosition(raw) {
  if (!isObject(raw)) return null

  const latitude = finiteNumber(raw.latitude)
  const longitude = finiteNumber(raw.longitude)
  if (latitude === null || longitude === null) return null

  return {
    latitude,
    longitude,
    speed: finiteNumber(raw.speed),   // null = el receptor no la reportó
    timestamp: nonEmptyString(raw.timestamp),
  }
}

// ── Conectividad del dispositivo ────────────────────────────────────────────

const NETWORK_STATUSES = ['connected', 'disconnected', 'unavailable']
const CONNECTION_TYPES = ['wifi', 'ethernet', 'other']

/** IPv4 con cuatro octetos en rango. No acepta IPv6 ni texto suelto. */
function isValidIpv4(value) {
  if (typeof value !== 'string') return false
  const parts = value.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function normalizeConnection(raw, index) {
  if (!isObject(raw)) return null

  const interfaceName = nonEmptyString(raw.interface)
  return {
    // Clave de React estable aunque la interfaz venga sin nombre.
    key: interfaceName ?? `conexion-${index}`,
    // Un tipo desconocido se degrada a 'other' en vez de renderizarse crudo.
    type: CONNECTION_TYPES.includes(raw.type) ? raw.type : 'other',
    interface: interfaceName,
    name: nonEmptyString(raw.name),   // SSID; null en cable
    ipv4: Array.isArray(raw.ipv4) ? raw.ipv4.filter(isValidIpv4).map((ip) => ip.trim()) : [],
  }
}

/**
 * Conectividad de la Raspberry con forma garantizada: `{ status, connections }`,
 * `connections` siempre array. Cualquier respuesta inesperada se reporta como
 * 'unavailable' — nunca como "conectado" por omisión.
 */
export function normalizeNetworkInfo(raw) {
  if (!isObject(raw)) return { status: 'unavailable', connections: [] }

  const connections = Array.isArray(raw.connections)
    ? raw.connections.map(normalizeConnection).filter(Boolean)
    : []

  const status = NETWORK_STATUSES.includes(raw.status)
    ? raw.status
    : connections.length > 0
      ? 'connected'
      : 'unavailable'

  return { status, connections }
}

/**
 * Eventos utilizables, en el orden recibido. Se exige un id numérico porque es
 * la clave del polling incremental: sin él no se puede avanzar `after_id`.
 */
export function normalizeEvents(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isObject)
    .filter((event) => finiteNumber(event.id) !== null)
    .map((event) => ({
      ...event,
      id: finiteNumber(event.id),
      payload: isObject(event.payload) ? event.payload : null,
    }))
}

// ── Conexión Wi-Fi ──────────────────────────────────────────────────────────

const WIFI_STATUSES = [
  'connected',
  'invalid_password',
  'not_found',
  'timeout',
  'unavailable',
  'no_adapter',
  'not_authorized',
  'busy',
  'failed',
]

/**
 * Resultado de `POST /api/system/wifi/connect` con forma garantizada.
 *
 * Un estado desconocido se degrada a 'failed', NUNCA a 'connected': la pantalla
 * no puede decirle al conductor que el equipo está conectado porque llegó una
 * respuesta que no entiende.
 *
 * `network` se normaliza igual que la consulta de red, así que la vista puede
 * mostrar la IP nueva sin esperar al siguiente refresco.
 *
 * La clave no forma parte de esta forma: el backend no la devuelve y aquí no se
 * lee ni se guarda ningún campo que pudiera contenerla.
 */
export function normalizeWifiResult(raw) {
  if (!isObject(raw)) {
    return { status: 'failed', detail: 'Respuesta no válida del equipo', ssid: null, network: null }
  }

  return {
    status: WIFI_STATUSES.includes(raw.status) ? raw.status : 'failed',
    detail: nonEmptyString(raw.detail) ?? 'No se pudo conectar a la red',
    ssid: nonEmptyString(raw.ssid),
    network: raw.network ? normalizeNetworkInfo(raw.network) : null,
  }
}

// ── Energía del dispositivo ─────────────────────────────────────────────────

const POWER_STATUSES = ['scheduled', 'already_scheduled', 'unavailable']
const POWER_ACTIONS = ['shutdown', 'reboot']

/**
 * Respuesta de apagado o reinicio con forma garantizada.
 *
 * Un estado desconocido se degrada a 'unavailable': ante una respuesta que no
 * se entiende, lo honesto es no prometer que el equipo se va a apagar.
 *
 * `pendingAction` puede diferir de `action`: es el caso de pedir un reinicio
 * cuando ya había un apagado en curso, y la pantalla debe decir lo que
 * realmente va a pasar.
 */
export function normalizePowerResult(raw, requestedAction) {
  const fallbackAction = POWER_ACTIONS.includes(requestedAction) ? requestedAction : 'shutdown'
  if (!isObject(raw)) {
    return { status: 'unavailable', detail: '', action: fallbackAction, pendingAction: null }
  }

  return {
    status: POWER_STATUSES.includes(raw.status) ? raw.status : 'unavailable',
    detail: nonEmptyString(raw.detail) ?? '',
    action: POWER_ACTIONS.includes(raw.action) ? raw.action : fallbackAction,
    pendingAction: POWER_ACTIONS.includes(raw.pending_action) ? raw.pending_action : null,
  }
}

// ── Recarga manual del itinerario ───────────────────────────────────────────

const REFRESH_STATUSES = [
  'updated',
  'empty',
  'auth_error',
  'remote_error',
  'invalid',
  'save_error',
]

/**
 * Respuesta de `POST /api/dispatch/refresh` con forma garantizada.
 *
 * `steps` solo se completa cuando la operación cambió el itinerario ('updated'
 * o 'empty'); en los estados de error es `null`, que significa "no toques lo
 * que ya tienes". Es la diferencia entre un día sin despachos —que sí debe
 * vaciar la pantalla— y un fallo de red, que no.
 *
 * Un status desconocido se degrada a 'remote_error' con `steps: null`: nunca
 * se borra el itinerario por una respuesta que no se entiende.
 */
export function normalizeDispatchRefresh(raw) {
  if (!isObject(raw)) {
    return { status: 'remote_error', detail: 'Respuesta no válida del equipo', steps: null, date: null }
  }

  const status = REFRESH_STATUSES.includes(raw.status) ? raw.status : 'remote_error'
  const changed = status === 'updated' || status === 'empty'
  const dispatch = isObject(raw.dispatch) ? raw.dispatch : null

  return {
    status,
    detail: nonEmptyString(raw.detail) ?? '',
    date: nonEmptyString(raw.date),
    // 'empty' produce [] a propósito: el día sin despachos es un dato, no un fallo.
    steps: changed ? normalizeSteps(dispatch?.data) : null,
    preservedReports: finiteNumber(raw.preserved_reports) ?? 0,
  }
}
