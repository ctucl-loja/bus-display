import { env } from '../config/env.js'
import { fetchJson } from './http.js'
import { normalizeNetworkInfo } from './normalize.js'

// GET /api/system/network -> conectividad de LA RASPBERRY, no del navegador.
//
// El navegador no puede consultar el SSID ni las interfaces del sistema, así
// que la información viene del propio equipo a través de la API local. Cuando
// la pantalla se abre desde una laptop, sigue describiendo la Raspberry: es la
// máquina donde corre `simtra-bus-manager`.
//
// Siempre devuelve { status, connections } con forma garantizada.
export async function fetchNetworkInfo() {
  const data = await fetchJson(`${env.localApiUrl}/api/system/network`, 'la información de red')
  return normalizeNetworkInfo(data)
}
