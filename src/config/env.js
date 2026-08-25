// Punto único de acceso a la configuración de la pantalla.
//
// La API local de simtra-bus-manager corre en la MISMA Raspberry Pi que sirve
// esta pantalla, así que su host es siempre el host desde el que se abrió la
// página:
//
//   kiosco en la RPi -> http://localhost:4173      => API http://localhost:8000
//   laptop en la LAN -> http://192.168.1.14:4173   => API http://192.168.1.14:8000
//
// Por eso el host se deriva de window.location en vez de compilarse: una URL
// fija como http://localhost:8000 apuntaría al localhost de la laptop cuando la
// pantalla se abre remotamente, y ahí no hay ninguna API.
//
// La pantalla NUNCA habla con el backend remoto SIMTRA: solo con la API local.
const DEFAULT_LOCAL_API_PORT = '8000'

function resolveLocalApiUrl() {
  // Escape para el caso raro en que la API no viva en el mismo host que sirve
  // la pantalla. Si está definida, gana sobre la derivación automática.
  const explicitUrl = import.meta.env.VITE_LOCAL_API_URL
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '')

  const port = import.meta.env.VITE_LOCAL_API_PORT || DEFAULT_LOCAL_API_PORT
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:${port}`
}

export const env = {
  localApiUrl: resolveLocalApiUrl(),
}
