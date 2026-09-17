import { env } from '../config/env.js'
import { normalizeWifiResult } from './normalize.js'

// POST /api/system/wifi/connect -> conecta LA RASPBERRY a una red Wi-Fi.
//
// Es la única llamada de la pantalla que ESCRIBE sobre la red del equipo;
// `fetchNetworkInfo` sigue siendo de solo lectura.
//
// La clave viaja en el CUERPO del POST, nunca en la URL ni en query string: una
// query string queda en el historial del navegador y en los logs de acceso.
// Tampoco se guarda aquí ni se devuelve: el backend no la incluye en ninguna
// respuesta, y quien la conserva es NetworkManager en su perfil protegido.
//
// Devuelve { status, detail, ssid, network } con forma garantizada.
//
// Un fallo de transporte LANZA, y el llamador debe tratarlo como "no se pudo
// confirmar", no como fracaso: cambiar de red corta la conexión de quien esté
// mirando la pantalla desde otro dispositivo de la red anterior.
export async function connectWifi({ ssid, password }) {
  const response = await fetch(`${env.localApiUrl}/api/system/wifi/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password: password || null }),
  })

  if (!response.ok) {
    // El cuerpo de un error de validación puede traer el eco de lo enviado: no
    // se lee ni se propaga, para que la clave no termine dentro de un mensaje
    // de error visible en pantalla o en la consola del navegador.
    throw new Error(`No se pudo conectar a la red (HTTP ${response.status})`)
  }

  try {
    return normalizeWifiResult(await response.json())
  } catch {
    throw new Error('Respuesta no válida al conectar a la red')
  }
}
