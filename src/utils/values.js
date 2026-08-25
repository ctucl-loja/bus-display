// Conversiones seguras compartidas por utilidades y servicios.
//
// El detalle que justifica este archivo: `Number('')`, `Number(null)` y
// `Number([])` valen 0 en JavaScript. Usar `Number()` a secas convierte "no hay
// dato" en "cero", y en esta pantalla cero significa cosas concretas —
// "llegó exacto", "detenido", "primer punto del recorrido"—. Por eso solo se
// aceptan números y cadenas numéricas; todo lo demás es null.

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Número finito, o null. Rechaza null, '', booleanos, arrays, objetos, NaN e Infinity. */
export function finiteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const number = Number(trimmed)
    return Number.isFinite(number) ? number : null
  }
  return null
}

/** Texto no vacío, ya recortado, o null. */
export function nonEmptyString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
