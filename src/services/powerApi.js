import { env } from '../config/env.js'
import { normalizePowerResult } from './normalize.js'

// Energía de LA RASPBERRY: apagado y reinicio ordenados.
//
// Ninguna de las dos lleva cuerpo. El comando vive en el equipo (una constante
// o SYSTEM_SHUTDOWN_COMMAND / SYSTEM_REBOOT_COMMAND) y NUNCA se arma con datos
// de la pantalla: lo único que el frontend elige es la RUTA, no el comando.
//
// La confirmación del conductor se resuelve antes, en la interfaz; llegar aquí
// ya significa que aceptó el diálogo.
//
// Devuelven { status, detail, action, pendingAction } con forma garantizada:
//   status        'scheduled' | 'already_scheduled' | 'unavailable'
//   action        lo que se pidió en esta llamada
//   pendingAction lo que el equipo tiene realmente pendiente — puede ser la
//                 OTRA acción, y entonces es esa la que hay que anunciar.
//
// 'scheduled' significa que la orden se dará en unos segundos, no que el equipo
// ya se haya apagado o reiniciado. Un fallo de red lanza.

async function requestPowerAction(path, action, description) {
  const response = await fetch(`${env.localApiUrl}${path}`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(`No se pudo ${description} el dispositivo (HTTP ${response.status})`)
  }

  try {
    return normalizePowerResult(await response.json(), action)
  } catch {
    throw new Error(`Respuesta no válida al solicitar ${description === 'apagar' ? 'el apagado' : 'el reinicio'}`)
  }
}

/** POST /api/system/shutdown */
export async function requestShutdown() {
  return requestPowerAction('/api/system/shutdown', 'shutdown', 'apagar')
}

/** POST /api/system/reboot */
export async function requestReboot() {
  return requestPowerAction('/api/system/reboot', 'reboot', 'reiniciar')
}
