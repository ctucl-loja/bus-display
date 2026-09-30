// Lectura JSON común a todos los servicios.
//
// Una respuesta 200 con cuerpo vacío o no-JSON se trata como ERROR, no como
// dato válido: así los hooks conservan la última información buena en vez de
// vaciar la pantalla con un `undefined`.
//
// `timeoutMs` (opcional) aborta la petición: un hook que refresca a menudo no
// debe quedarse esperando para siempre a una respuesta que no llega.
export async function fetchJson(url, description, { timeoutMs } = {}) {
  const response = await fetch(url, timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined)

  if (!response.ok) {
    throw new Error(`No se pudo obtener ${description} (HTTP ${response.status})`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`Respuesta no válida al obtener ${description}`)
  }
}
