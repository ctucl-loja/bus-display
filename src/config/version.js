// Solo estos dos campos: con import con nombre, Vite no mete el package.json
// entero (dependencias incluidas) en el bundle.
import { version, releaseLabel } from '../../package.json'
import { formatVersion } from '../utils/version.js'

// Versión de la pantalla, fijada en el build desde package.json (única fuente
// de verdad de este repositorio). Para una entrega nueva se cambia SOLO allí.
export const APP_VERSION = formatVersion(version, releaseLabel)
