// Validación del formulario de conexión Wi-Fi.
//
// Terminología (decisión explícita del proyecto):
//
//   «usuario» en esta pantalla significa NOMBRE DE LA RED WI-FI (SSID). No es
//   el usuario del backend remoto SIMTRA, ni un usuario del sistema, ni una
//   identidad 802.1X/WPA-Enterprise: no hay soporte para redes empresariales
//   con usuario y contraseña contra un RADIUS. El equipo se conecta a redes
//   WPA/WPA2-PSK o abiertas, que es lo que hay en un patio de buses.
//
// Estas funciones son puras a propósito (sin React, sin fetch, sin
// import.meta.env): se pueden probar directamente con `node --test`.
//
// NINGUNA de ellas devuelve la clave ni parte de ella dentro de un mensaje: un
// mensaje de error que cita el valor recibido es la forma más fácil de dejar un
// secreto en pantalla, en un log del navegador o en una captura.

export const SSID_MAX_BYTES = 32   // 802.11: el SSID son 32 octetos
export const PSK_MIN_LENGTH = 8    // WPA/WPA2-PSK
export const PSK_MAX_LENGTH = 63   // 64 sería el PSK hexadecimal, no admitido aquí

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/

// Longitud en OCTETOS, no en caracteres: 'ñ' ocupa dos y el límite de 802.11
// está en bytes. Sin esto, un SSID con tildes pasaría la validación del
// navegador y sería rechazado por el equipo.
function byteLength(value) {
  return new TextEncoder().encode(value).length
}

/** null si el SSID es utilizable; si no, el motivo en español. */
export function validateSsid(ssid) {
  if (typeof ssid !== 'string') return 'Escriba el nombre de la red'

  const value = ssid.trim()
  if (value === '') return 'Escriba el nombre de la red'
  if (CONTROL_CHARS.test(value)) return 'El nombre de la red tiene caracteres no permitidos'
  if (byteLength(value) > SSID_MAX_BYTES) {
    return `El nombre de la red no puede superar ${SSID_MAX_BYTES} caracteres`
  }
  if (value.startsWith('-')) return "El nombre de la red no puede empezar con '-'"

  return null
}

/**
 * null si la clave es utilizable; si no, el motivo.
 *
 * Una clave vacía es válida: significa red abierta, o reconectar con el perfil
 * que el equipo ya tiene guardado. La clave NO se recorta con trim() — un
 * espacio al inicio o al final puede ser parte legítima de un PSK.
 */
export function validatePassword(password) {
  if (password === '' || password === null || password === undefined) return null
  if (typeof password !== 'string') return 'La clave no es válida'
  if (CONTROL_CHARS.test(password)) return 'La clave tiene caracteres no permitidos'
  if (password.length < PSK_MIN_LENGTH || password.length > PSK_MAX_LENGTH) {
    return `La clave debe tener entre ${PSK_MIN_LENGTH} y ${PSK_MAX_LENGTH} caracteres`
  }
  return null
}

/** Primer problema del formulario, o null si se puede enviar. */
export function validateWifiForm({ ssid, password }) {
  return validateSsid(ssid) ?? validatePassword(password)
}

// Tono con el que se presenta cada resultado. Solo 'connected' es un éxito;
// el resto se dicen tal cual, sin adornar y sin prometer una conexión.
export const WIFI_RESULT_TONE = {
  connected: 'ok',
  invalid_password: 'error',
  not_found: 'error',
  timeout: 'warn',
  unavailable: 'error',
  no_adapter: 'error',
  not_authorized: 'error',
  busy: 'warn',
  failed: 'error',
}

// Mensaje de respaldo cuando la petición ni siquiera llegó a completarse.
//
// Importante: cambiar de red CORTA la conexión de quien esté mirando la
// pantalla desde otro dispositivo de la red anterior. Ese corte no prueba que
// la conexión fallara, así que el texto no afirma ninguna de las dos cosas.
export const WIFI_NETWORK_ERROR = {
  tone: 'warn',
  text:
    'No se recibió respuesta del equipo. Si está viendo esta pantalla desde otro ' +
    'dispositivo, es normal: el cambio de red corta esa conexión. Revise la información ' +
    'de red del equipo para confirmar el resultado.',
}
