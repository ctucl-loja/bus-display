// Lectura JSON común a todos los servicios.
//
// Una respuesta 200 con cuerpo vacío o no-JSON se trata como ERROR, no como
// dato válido: así los hooks conservan la última información buena en vez de
// vaciar la pantalla con un `undefined`.
export async function fetchJson(url, description) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo obtener ${description} (HTTP ${response.status})`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`Respuesta no válida al obtener ${description}`)
  }
}
