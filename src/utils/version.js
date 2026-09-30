// Etiqueta visible de la versión: «v1.5.2 LTS».
//
// Pura y sin importar package.json, para poder probarla con `node --test`
// (que no carga JSON como módulo). La fuente de verdad es package.json:
// `version` (semver) y `releaseLabel` (opcional, p. ej. "LTS"); ver
// src/config/version.js.
export function formatVersion(version, releaseLabel) {
  if (typeof version !== 'string' || !version.trim()) return null
  const label = typeof releaseLabel === 'string' ? releaseLabel.trim() : ''
  return `v${version.trim()}${label ? ` ${label}` : ''}`
}
