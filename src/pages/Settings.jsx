import { useDragScroll } from '../hooks/useDragScroll.js'
import { useNetworkInfo } from '../hooks/useNetworkInfo.js'
import Card from '../components/Card.jsx'
import Connectivity from '../components/Connectivity.jsx'
import WifiForm from '../components/WifiForm.jsx'
import PowerActionButton from '../components/PowerActionButton.jsx'

/**
 * Configuración del dispositivo (`/settings`).
 *
 * Reúne todo lo que ACTÚA sobre el equipo, que antes estaba repartido en `/info`:
 *
 *   1. Información de la red actual de la Raspberry (tipo, SSID, interfaz, IPv4).
 *   2. Formulario para conectarse o reconectarse a una red Wi-Fi.
 *   3. Apagado del equipo (el de siempre, con su confirmación).
 *   4. Reinicio del equipo (nuevo, también con confirmación).
 *
 * `/info` se queda con lo institucional: descripción, logotipos y contacto. La
 * separación es deliberada — Info es una vista que se mira, Configuración es
 * una vista que hace cosas, y las dos acciones destructivas van al final de
 * esta última, nunca en la barra de navegación, donde se tocan por accidente.
 *
 * UNA sola instancia de `useNetworkInfo` para toda la vista: la lista de
 * conexiones y el formulario comparten estado, así que conectarse a una red
 * actualiza lo que se ve arriba de inmediato en vez de esperar 30 s.
 */
function Settings() {
  const { ref, handlers } = useDragScroll()
  const { info, status, refresh, apply } = useNetworkInfo()

  // SSID de la primera conexión Wi-Fi activa, para precargar el formulario.
  // Solo el nombre: una clave guardada NUNCA se precarga (ni se consulta).
  const currentSsid = info?.connections?.find((c) => c.type === 'wifi')?.name ?? null

  // Tras conectar: si el equipo devolvió la red nueva se publica tal cual; si
  // no (p. ej. la respuesta se perdió al cambiar de red), se vuelve a consultar.
  function handleConnected(network) {
    if (network) apply(network)
    else refresh()
  }

  return (
    <div
      ref={ref}
      {...handlers}
      // touch-none deja el desplazamiento en manos de useDragScroll, que es lo
      // único que funciona en el kiosco. El hook ignora el gesto cuando empieza
      // sobre un input, un select o un botón, así que arrastrar no roba el foco
      // a los campos del formulario de Wi-Fi.
      className="h-full touch-none select-none overflow-y-auto overflow-x-hidden p-4 lg:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:gap-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 lg:text-4xl">
          Configuración
        </h1>

        <Card title="Conectividad del dispositivo">
          <p className="mb-4 text-base text-slate-500 dark:text-slate-400 lg:text-lg">
            Red a la que está conectado este equipo (la Raspberry Pi), no el dispositivo desde el
            que se abre esta pantalla.
          </p>
          <Connectivity info={info} status={status} />
        </Card>

        <Card title="Conectarse a una red Wi-Fi">
          <p className="mb-4 text-base text-slate-500 dark:text-slate-400 lg:text-lg">
            Escriba el nombre de la red (SSID) y su clave. El cambio afecta al equipo del bus. Si
            está viendo esta pantalla desde otro dispositivo, perderá el acceso al cambiar de red.
          </p>
          <WifiForm currentSsid={currentSsid} onConnected={handleConnected} />
        </Card>

        <Card title="Energía del dispositivo">
          <p className="mb-4 text-base text-slate-500 dark:text-slate-400 lg:text-lg">
            Apagado y reinicio ordenados del equipo (la Raspberry Pi). Úselos antes de cortar la
            alimentación del bus: desconectarlo en caliente puede dañar la tarjeta de memoria.
          </p>
          <div className="flex flex-col gap-4">
            <PowerActionButton action="reboot" />
            <PowerActionButton action="shutdown" />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Settings
