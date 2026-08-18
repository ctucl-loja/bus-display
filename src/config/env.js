// Punto único de acceso a las variables de entorno (deben empezar con VITE_).
function readEnv(key) {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${key}. Revisa tu archivo .env`)
  }
  return value
}

export const env = {
  // Única dependencia externa de la pantalla: la API local de simtra-bus-manager,
  // que corre en el mismo dispositivo (Raspberry Pi) y es la que sí habla con el
  // backend remoto. La pantalla no conoce credenciales ni el número de bus: la
  // RPi ya está configurada con su propio FAST_API_BUS_REGISTER.
  localApiUrl: readEnv('VITE_LOCAL_API_URL'),
}
