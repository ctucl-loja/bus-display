import { env } from '../config/env.js'

// POST /api/system/shutdown -> apaga LA RASPBERRY de forma ordenada.
//
// No lleva cuerpo: el comando de apagado vive en el equipo y nunca se arma con
// datos de la pantalla. La confirmación del conductor se resuelve antes, en la
// interfaz; llegar aquí ya significa que aceptó el diálogo.
//
// Devuelve { status, detail } con `status` en
// 'scheduled' | 'already_scheduled' | 'unavailable'. Un fallo de red lanza.
export async function requestShutdown() {
  const response = await fetch(`${env.localApiUrl}/api/system/shutdown`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(`No se pudo apagar el dispositivo (HTTP ${response.status})`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Respuesta no válida al solicitar el apagado')
  }
}
