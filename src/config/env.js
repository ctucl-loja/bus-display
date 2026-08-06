// Punto único de acceso a las variables de entorno (deben empezar con VITE_).
function readEnv(key) {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${key}. Revisa tu archivo .env`)
  }
  return value
}

export const env = {
  backendUrl: readEnv('VITE_BACKEND_URL'),
  busRegister: readEnv('VITE_BUS_REGISTER'),
  simtraApiKey: readEnv('VITE_SIMTRA_API_KEY'),
}
