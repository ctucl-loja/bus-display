import { useEffect, useRef, useState } from 'react'
import { connectWifi } from '../services/wifiApi.js'
import { validateWifiForm, WIFI_RESULT_TONE, WIFI_NETWORK_ERROR, PSK_MIN_LENGTH } from '../utils/wifi.js'

const TONE_CLASSES = {
  ok: 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300',
  warn: 'border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
  error: 'border-red-500/50 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

/**
 * Conexión / reconexión Wi-Fi del equipo.
 *
 * TERMINOLOGÍA: el primer campo es el NOMBRE DE LA RED (SSID) — lo que en la
 * conversación del proyecto se llamó «usuario». No es el usuario del backend
 * remoto SIMTRA ni una identidad 802.1X: no hay soporte WPA-Enterprise.
 *
 * Tratamiento de la clave, en un solo lugar para que sea auditable:
 *
 *   · El campo es `type="password"` y NO cambia nunca de tipo. No hay icono de
 *     ojo, botón de revelar ni ninguna presentación en claro. La máscara la
 *     dibuja el navegador (punto o asterisco, según el equipo).
 *   · El campo es NO CONTROLADO (un ref), al contrario que el SSID. Con un
 *     input controlado React escribe el valor también como ATRIBUTO `value` del
 *     nodo, y entonces la clave en claro forma parte del marcado: sale en el
 *     inspector, en cualquier `innerHTML` y en una extensión que lea el DOM.
 *     Sin estado de React, el valor solo existe en la propiedad del input, que
 *     es lo mínimo inevitable en un campo de texto.
 *   · `autoComplete="new-password"` impide que el gestor del navegador ofrezca
 *     guardarla o rellenarla en el kiosco.
 *   · No se escribe en localStorage, sessionStorage, la URL, ningún log ni
 *     ninguna tabla de la aplicación.
 *   · Se BORRA al terminar la operación —salga bien o mal— y al desmontar la
 *     vista, para que no sobreviva a un cambio de pantalla.
 *   · El SSID actual sí se puede precargar; la clave NUNCA se precarga, ni
 *     siquiera la que el equipo ya tenga guardada.
 */
function WifiForm({ currentSsid = null, onConnected }) {
  const [ssid, setSsid] = useState(currentSsid ?? '')
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState(null)
  const [result, setResult] = useState(null)

  // Bloqueo de doble envío en un ref: dos toques seguidos en la pantalla táctil
  // ocurren dentro del mismo ciclo de render y el segundo aún leería
  // `sending === false`.
  const sendingRef = useRef(false)
  const mountedRef = useRef(true)
  const passwordRef = useRef(null)

  // Punto único de borrado de la clave. El input no está controlado, así que
  // vaciarlo es esto y no un setState.
  function clearPassword() {
    if (passwordRef.current) passwordRef.current.value = ''
  }

  // Al abandonar la vista la clave se borra del campo. React desmonta el nodo y
  // lo liberaría igual, pero dejarlo explícito es lo que hace verificable la
  // regla, y protege si algún día el componente deja de desmontarse al navegar.
  useEffect(() => {
    const input = passwordRef.current
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (input) input.value = ''
    }
  }, [])

  // El SSID sí se precarga con la red actual cuando el equipo la reporta, pero
  // solo mientras el conductor no haya escrito nada: sobrescribir lo que está
  // tecleando cada vez que refresca la información de red sería insufrible.
  const touchedRef = useRef(false)
  useEffect(() => {
    if (!touchedRef.current && currentSsid) setSsid(currentSsid)
  }, [currentSsid])

  async function submit(event) {
    event.preventDefault()

    if (sendingRef.current) return

    // Se lee del DOM en el momento del envío y no se guarda en ningún estado.
    const password = passwordRef.current?.value ?? ''

    const invalid = validateWifiForm({ ssid, password })
    if (invalid) {
      setProblem(invalid)
      setResult(null)
      return
    }

    sendingRef.current = true
    setSending(true)
    setProblem(null)
    setResult(null)

    try {
      const response = await connectWifi({ ssid: ssid.trim(), password })
      if (mountedRef.current) {
        setResult({ tone: WIFI_RESULT_TONE[response.status] ?? 'error', text: response.detail })
      }
      if (response.status === 'connected') onConnected?.(response.network)
    } catch {
      // Un fallo de transporte NO es prueba de que la conexión fallara: si esta
      // pantalla se está viendo desde otro dispositivo de la red anterior, el
      // propio cambio de red corta la respuesta. Se dice exactamente eso.
      if (mountedRef.current) {
        setResult({ tone: WIFI_NETWORK_ERROR.tone, text: WIFI_NETWORK_ERROR.text })
      }
      onConnected?.(null)
    } finally {
      sendingRef.current = false
      // La clave se borra pase lo que pase, incluido el reintento tras una
      // clave incorrecta: hay que volver a escribirla. Va fuera del guard de
      // montaje a propósito — borrarla no puede depender de seguir montado.
      clearPassword()
      if (mountedRef.current) setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="wifi-ssid"
          className="block text-lg font-medium text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl"
        >
          Nombre de red (SSID)
        </label>
        <input
          id="wifi-ssid"
          name="wifi-ssid"
          type="text"
          value={ssid}
          onChange={(event) => {
            touchedRef.current = true
            setSsid(event.target.value)
          }}
          disabled={sending}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
          placeholder="Nombre de la red Wi-Fi"
          className="mt-2 min-h-14 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-xl xl:min-h-16 xl:text-2xl text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div>
        <label
          htmlFor="wifi-password"
          className="block text-lg font-medium text-slate-700 dark:text-slate-200 lg:text-xl xl:text-2xl"
        >
          Clave de la red
        </label>
        {/* type="password" fijo: sin botón de revelar y sin cambio a texto. La
            máscara la dibuja el navegador. */}
        <input
          id="wifi-password"
          name="wifi-password"
          type="password"
          ref={passwordRef}
          defaultValue=""
          disabled={sending}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Déjela vacía si la red es abierta"
          className="mt-2 min-h-14 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-xl xl:min-h-16 xl:text-2xl text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400 lg:text-lg xl:text-xl">
          Mínimo {PSK_MIN_LENGTH} caracteres. La clave no se muestra ni se guarda en la pantalla:
          la conserva el equipo.
        </p>
      </div>

      {problem && (
        <p role="alert" className="text-lg font-medium text-red-600 dark:text-red-400 lg:text-xl xl:text-2xl">
          {problem}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-cyan-600 px-6 py-3 text-xl font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-60 sm:w-auto xl:min-h-16 xl:text-2xl"
      >
        {sending ? 'Conectando…' : 'Conectar'}
      </button>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border-2 p-4 text-lg font-semibold lg:text-xl xl:text-2xl ${TONE_CLASSES[result.tone] ?? TONE_CLASSES.error}`}
        >
          {result.text}
        </div>
      )}
    </form>
  )
}

export default WifiForm
