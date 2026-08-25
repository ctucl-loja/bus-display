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
