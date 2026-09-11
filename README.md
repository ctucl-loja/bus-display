# bus-display

Pantalla a bordo del bus (React + Vite + Tailwind + Leaflet). Corre en la misma
Raspberry Pi que [`simtra-bus-manager`](../../PYTHON/simtra-bus-manager) y muestra
al conductor el itinerario del día, el punto de control actual y el siguiente.

## Arquitectura

```
backend remoto SIMTRA
        ▲
        │  (única salida a internet: JWT, despachos, vehículo, pasajeros)
        │
  simtra-bus-manager  ──  FastAPI local en :8000  ──►  bus-display (navegador)
   (Raspberry Pi)            app.db (SQLite)
```

`bus-display` **no habla con el backend remoto**. Todo lo que muestra lo lee de la
API local de `simtra-bus-manager`, que ya cachea el despacho y el vehículo del día
y actualiza el `time_reported` de cada checkpoint conforme el bus cruza las
geocercas. Así la pantalla sigue funcionando sin señal.

| Dato | Endpoint local | Origen |
|---|---|---|
| Itinerario del día | `GET /api/dispatch` | cacheado por `bus_monitor.py` |
| Vehículo | `GET /api/vehicle` | cacheado por `bus_monitor.py` |
| Posición del bus | `GET /api/gps/last_position` | escrita por el receptor GPS, consultada cada 3 s |
| Llegadas a puntos de control | `GET /api/events?event_type=checkpoint_arrival&after_id=N` | emitidas por `bus_monitor.py`, consultadas cada 1,5 s |
| Conectividad del equipo | `GET /api/system/network` | leída del sistema por la RPi, consultada cada 30 s |

## Configuración

**No hace falta configurar nada para el uso normal.** La pantalla deriva la URL
de la API local del host desde el que se abrió la página, así que una sola
compilación sirve tanto para el kiosco de la RPi como para una laptop de la LAN:

```text
http://localhost:5173      →  API en http://localhost:8000
http://192.168.1.14:5173   →  API en http://192.168.1.14:8000
```

Compilar `http://localhost:8000` como URL fija sería lo incorrecto: al abrir la
pantalla desde la laptop, ese `localhost` sería el de la laptop, donde no hay
ninguna API.

Si aun así hace falta ajustar algo:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_LOCAL_API_PORT` | Puerto de la API local. Por defecto `8000`; debe coincidir con el `--port` de uvicorn |
| `VITE_LOCAL_API_URL` | Escape: URL absoluta y fija. Solo si la API no vive en el mismo host que sirve la pantalla. Ignora la derivación automática |

Vite incrusta las `VITE_*` al compilar, así que cambiar `.env` obliga a repetir
`pnpm run build`.

No hay credenciales ni número de bus: la RPi ya está configurada con su propio
`FAST_API_BUS_REGISTER` y es la que autentica contra el backend remoto.

Del lado de `simtra-bus-manager`, `FAST_API_CORS_ORIGINS` controla qué orígenes
puede usar el navegador (por defecto `*`, suficiente en un equipo aislado). Al
abrir la pantalla desde otro equipo de la LAN el origen cambia
(`http://<IP_RPI>:5173`), así que si esa variable se restringió a una lista hay
que incluir ese origen.

## Ejecución

```bash
pnpm install
pnpm dev
```

Para que el servidor de desarrollo también acepte conexiones de la LAN (probar
desde la laptop contra la RPi, o al revés):

```bash
pnpm dev:lan
```

Equivale a `pnpm dev --host 0.0.0.0`. Vite imprime la URL de red al arrancar.

Producción (kiosco en la RPi): ver [Despliegue en producción](#despliegue-en-producción-pm2--modo-kiosko) más abajo.

## Tests

Funciones puras (parsing de horarios, selección de tramo, normalización de las
respuestas de la API, formato de diferencias) con el runner de Node, sin
dependencias nuevas:

```bash
pnpm test
```

## Acceso desde una laptop de la misma LAN

Útil para revisar el itinerario o depurar sin agacharse al tablero del bus. Todo
ocurre dentro de la red privada del router Teltonika RUT956: **no requiere
publicar nada en internet ni configurar port forwarding.**

### 1. IP LAN de la Raspberry

En la RPi:

```bash
hostname -I
```

O, para ver también la interfaz y la máscara:

```bash
ip -4 addr show scope global
```

### 2. Abrir la pantalla desde la laptop

```text
http://<IP_LAN_DE_LA_RASPBERRY>:5173
```

El servicio de producción ya escucha en todas las interfaces —`pm2 serve` toma
`0.0.0.0` por defecto— y el kiosco local sigue usando `http://localhost:5173`
sin cambios. La API se resuelve sola: al abrir con la IP
de la RPi, la pantalla consulta `http://<IP_LAN_DE_LA_RASPBERRY>:8000`.

### 3. Confirmar que ambos equipos están en la misma red

Las dos IP deben caer en la misma subred (mismo prefijo y misma máscara) y no
estar separadas por VLAN ni por aislamiento de clientes wifi:

```bash
ping <IP_LAN_DE_LA_RASPBERRY>
```

```bash
curl http://<IP_LAN_DE_LA_RASPBERRY>:8000/api/gps/last_position
```

Si el `ping` responde pero el `curl` no, el problema está en la API
(`simtra-bus-manager` debe correr con `--host 0.0.0.0`, como en su unidad
systemd) o en `FAST_API_CORS_ORIGINS`. Si el `ping` tampoco responde, los
equipos no se ven entre sí: revisar que ambos estén asociados a la misma red del
RUT956 y que el aislamiento de clientes esté desactivado.

## Despliegue en producción (PM2 + modo kiosko)

Esta sección cubre únicamente `bus-display` como programa: preparar la
Raspberry, compilarlo, dejarlo corriendo siempre bajo PM2 y mostrarlo en
pantalla completa al arrancar. Asume que `simtra-bus-manager` (API local,
monitor, loader) ya está levantado por su cuenta, y no entra en configuración de
red ni de CORS — eso se resuelve aparte, del lado de la infraestructura.

Se hace una sola vez por equipo. Para actualizar la pantalla después, basta el
paso 7.

### 1. Actualizar el sistema

```bash
sudo apt update
```

```bash
sudo apt upgrade -y
```

### 2. Node.js 22

Desde el repositorio de NodeSource, que es el que trae una versión al día para
ARM (la de `apt` suele ir muy por detrás):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

```bash
sudo apt install -y nodejs
```

Comprueba:

```bash
node -v && npm -v
```

Deberías ver algo como `v22.x.x` y `10.x.x`. Node 22 es el mínimo para esta
pantalla: Vite 8 exige Node 20.19+.

### 3. pnpm

Con Node 22 viene Corepack, así que no hace falta instalar pnpm a mano:

```bash
sudo corepack enable
```

```bash
corepack prepare pnpm@latest --activate
```

Comprueba:

```bash
pnpm -v
```

### 4. PM2

```bash
sudo npm install -g pm2
```

Comprueba:

```bash
pm2 -v
```

### 5. Compilar

```bash
cd /home/admin/bus-display
```

```bash
pnpm install
```

```bash
pnpm run build
```

Esto genera `dist/` con los estáticos listos para servir. Vite incrusta las
variables `VITE_*` en el JS al compilar, así que hay que repetir el build tanto
si cambia el código como si cambia `.env`.

### 6. Servir con PM2 y dejarlo persistente

PM2 sirve `dist/` como sitio estático, sin necesidad de nginx ni de un servidor
aparte:

```bash
pm2 serve dist 5173 --name bus-display --spa
```

Tres detalles de ese comando:

- **`--spa` no es opcional.** Sin él, recargar en `/map`, `/itinerary` o `/info` devuelve
  404: son rutas de React Router que no existen como archivos en `dist/`. Con
  `--spa`, cualquier ruta desconocida entrega `index.html` y el router resuelve
  desde ahí.
- **`--name bus-display`** es lo que te deja luego escribir `pm2 restart
  bus-display` en vez de buscar el id del proceso.
- **Escucha en `0.0.0.0`**, que es el valor por defecto de `pm2 serve`. Por eso
  la pantalla se abre igual desde el kiosco local que desde una laptop de la LAN,
  sin configurar nada más.

Ya deberías poder abrirla:

```text
http://localhost:5173                      (en la propia RPi)
http://<IP_LAN_DE_LA_RASPBERRY>:5173       (desde la LAN)
```

> **Ojo con el puerto en desarrollo.** 5173 es también el puerto por defecto de
> `pnpm dev`. Si alguna vez levantas el servidor de Vite en la misma Raspberry
> mientras PM2 está sirviendo, el segundo en arrancar fallará o se irá a otro
> puerto. En la RPi de producción no debería correr `pnpm dev` nunca.

Para que reviva tras un reinicio hacen falta **dos** cosas distintas, y el orden
importa:

```bash
pm2 startup
```

Ese comando no configura nada por sí solo: imprime un `sudo env PATH=...` que
tienes que copiar y ejecutar. Se parecerá a esto, con tu usuario y tu ruta:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u admin --hp /home/admin
```

Eso instala el servicio systemd que arranca PM2 en cada boot. Después, con la
aplicación ya corriendo, se congela la lista de procesos:

```bash
pm2 save
```

`pm2 save` escribe el estado actual; si lo ejecutas antes de `pm2 serve`,
guardas una lista vacía y tras el reinicio no arrancará nada. Cada vez que
cambies qué procesos deben correr, vuelve a ejecutarlo.

### 7. Actualizar tras un cambio de código

```bash
cd /home/admin/bus-display && git pull && pnpm install && pnpm run build && pm2 restart bus-display
```

No hace falta repetir `pm2 save`: la lista de procesos no cambia, solo el
contenido de `dist/`.

### 8. Modo kiosko (Chromium a pantalla completa)

Autologin a escritorio, para que arranque sin pedir usuario/contraseña:

```bash
sudo raspi-config nonint do_boot_behaviour B4
```

Sin apagado de pantalla por inactividad:

```bash
sudo raspi-config nonint do_blanking 1
```

Chromium, si no está instalado:

```bash
sudo apt install -y chromium-browser
```

Autostart de labwc: agrega el bloque de kiosko (espera a que PM2 esté sirviendo,
y recién ahí abre Chromium en `--kiosk` contra el propio servidor local):

```bash
mkdir -p ~/.config/labwc
cp /etc/xdg/labwc/autostart ~/.config/labwc/autostart 2>/dev/null || touch ~/.config/labwc/autostart
```

```bash
cat >> ~/.config/labwc/autostart <<'EOF'

# Bus Display - modo kiosko
(
  for i in $(seq 1 30); do
    curl -sf http://localhost:5173 >/dev/null && break
    sleep 1
  done
  CHROME_BIN=$(command -v chromium-browser || command -v chromium)
  "$CHROME_BIN" --kiosk --noerrdialogs --disable-infobars \
    --disable-session-crashed-bubble --disable-translate \
    --check-for-update-interval=31536000 --incognito \
    http://localhost:5173
) &
EOF
```

El bucle de espera existe porque el escritorio arranca antes que PM2: sin él,
Chromium abriría una pantalla de error y se quedaría ahí. Reintenta durante 30
segundos y sale en cuanto el servidor responde.

Qué hace cada opción de Chromium:

| Opción | Para qué |
|---|---|
| `--kiosk` | Pantalla completa sin barra de direcciones, pestañas ni bordes |
| `--noerrdialogs` `--disable-session-crashed-bubble` | Nada de diálogos ni del «Chromium no se cerró correctamente» tras un corte de luz |
| `--disable-infobars` `--disable-translate` | Sin barras superiores que roben alto de pantalla ni ofertas de traducción |
| `--check-for-update-interval=31536000` | Sin avisos de actualización en medio del turno |
| `--incognito` | Arranca siempre en el mismo estado; no acumula historial ni caché en la SD |

> Si `~/.config/labwc/autostart` ya existía de antes con este mismo bloque, no
> lo agregues dos veces — labwc ejecuta tanto el autostart de sistema como el
> de usuario, y una barra de tareas o un Chromium duplicados suelen venir de
> ahí.

Reinicia para aplicar todo:

```bash
sudo reboot
```

Al arrancar debería ir directo al escritorio y abrir Chromium en pantalla
completa sobre `bus-display`.

### Operación diaria

```bash
pm2 list
```

```bash
pm2 logs bus-display
```

| Comando | Para qué |
|---|---|
| `pm2 list` | Estado, reinicios acumulados y uso de memoria |
| `pm2 logs bus-display` | Logs en vivo (`--lines 100` para ver el histórico) |
| `pm2 restart bus-display` | Recargar tras un `pnpm run build` |
| `pm2 stop bus-display` | Detener sin borrarlo de la lista |
| `pm2 delete bus-display` | Quitarlo de PM2 (requiere `pm2 save` después) |

Si tras un reinicio la pantalla no levanta, el orden de diagnóstico es: `pm2
list` (¿está el proceso?) → `systemctl status pm2-admin` (¿arrancó PM2?) →
`curl -sf http://localhost:5173` (¿responde el servidor?). Un proceso ausente en
`pm2 list` tras el boot casi siempre significa que faltó el `pm2 save`.

## Avisos de llegada

Cuando el bus llega a un punto de control, la pantalla muestra un aviso emergente
con la puntualidad de esa llegada. Desaparece solo a los 5 segundos y no requiere
que el conductor toque nada.

```text
BELLO HORIZONTE          PARQUE CENTRAL           TERMINAL TERRESTRE
✓ A TIEMPO               + ATRASADO  2 min 15 s   − ADELANTADO  1 min 15 s
Programado 06:41         Programado 09:44         Programado 10:49
Llegada    06:41         Llegada    09:46         Llegada    10:47
```

### Quién decide que hubo una llegada

**`bus_monitor.py`, nunca la pantalla.** Los avisos se disparan exclusivamente a
partir de marcaciones ya confirmadas y persistidas por el monitor:

```text
BUS MONITOR  →  autoridad del marcaje  →  evento  →  BUS DISPLAY  →  presentación
```

`bus-display` no reimplementa horarios, steps, transiciones, geofencing ni
tolerancia de checkpoints omitidos. Una geocerca que el monitor descarta no
produce evento y por lo tanto no produce aviso. La diferencia de tiempo tampoco
se recalcula contra el reloj del navegador: se usa `difference_seconds` tal como
llega en el evento, para que ambos sistemas hablen de la misma marcación.

### Piezas

| Archivo | Responsabilidad |
|---|---|
| `services/eventsApi.js` | `getEvents({ eventType, afterId, limit })` sobre `/api/events` |
| `hooks/useCheckpointEvents.js` | polling incremental + cola de eventos |
| `components/ArrivalNotification.jsx` | presentación y autocierre |
| `utils/arrival.js` | etiquetas, signos y formato de la diferencia |

El hook se monta en `layouts/MainLayout.jsx`, no en una página: el layout no se
desmonta al navegar, así que los avisos aparecen igual en `/`, `/map`,
`/itinerary` e `/info`, y el estado del polling sobrevive al cambio de ruta.

### Polling y cola

```text
montaje → GET último checkpoint_arrival → lastEventId (NO se muestra)
        → cada 1500 ms: GET ...&after_id={lastEventId}
        → los nuevos entran a la cola en orden ascendente
        → se muestran de uno en uno, 5 s cada uno
```

- **Al iniciar no se muestra el histórico.** El último evento existente se toma
  como línea base, así que reiniciar la pantalla no dispara las llegadas de las
  últimas horas; solo aparecen las posteriores a abrirla.
- **Nada se pierde ni se duplica.** La clave es `event.id`; si llegan tres
  eventos juntos se muestran en secuencia, nunca superpuestos.
- **Si la API local se cae**, el hook conserva su estado, no vacía la pantalla ni
  muestra un error invasivo, y reanuda en el siguiente intervalo desde el mismo
  `after_id`.

Constantes: `POLL_INTERVAL_MS` (1500 ms) en el hook y
`ARRIVAL_NOTIFICATION_DURATION` (5000 ms) en el componente.

---

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Home: línea con el código del despacho, punto actual/siguiente y vehículo a plena anchura y en tipografía grande. Sin mapa y, por tanto, sin polling de GPS |
| `/map` | Mapa con la posición en vivo del bus y los puntos de control del tramo + panel lateral con esos mismos datos, en versión compacta |
| `/info` | Vista informativa: origen del sistema, logotipos, contacto, conectividad del equipo y apagado del dispositivo |
| `/itinerary` | Tabla del tramo: hora calculada vs hora reportada, navegable entre tramos |

`/` y `/map` comparten la lógica (`useDispatch`, `useVehicle`,
`findCurrentStep`, `findCurrentAndNextCheckpoint`, `describeLine`) y solo
difieren en presentación: `InfoCard` acepta `size="lg"` para la versión de Home.
El punto actual se sigue eligiendo por horario calculado, no por la marcación
GPS. En Home los dos puntos ocupan la primera fila y quedan visibles al abrir a
800x480; línea y vehículo se alcanzan desplazando.

Dos diferencias deliberadas de Home respecto del panel de `/map`:

- **Código del despacho.** La tarjeta de Línea abre con `step.code` enmarcado y
  en violeta, separado del nombre de la línea: es lo que permite comprobar de un
  vistazo que el bus está corriendo el itinerario correcto. Un código ausente o
  vacío se muestra como «Sin código», nunca como un recuadro en blanco.
- **Sin propietario.** Home muestra registro, placa y cooperativa. El nombre del
  propietario es un dato personal que no interviene en la operación, así que no
  se repite en la pantalla principal; sigue en el panel lateral de `/map`.

---

## Apagado del dispositivo

El botón vive al final de `/info`, bajo «Energía del dispositivo», junto a la
conectividad del equipo. **No está en la barra de navegación**: es una acción
destructiva y ahí se tocaría por accidente.

Siempre son dos pasos. El botón abre un diálogo que dice qué va a pasar —«Esto
provocará que el dispositivo se apague»— con **Apagar** y **Cancelar**; un solo
toque nunca apaga el bus. Al confirmar se llama a
`POST /api/system/shutdown` de la API local (sin cuerpo: el comando vive en la
Raspberry) y la pantalla muestra el resultado:

| Respuesta | Mensaje |
|---|---|
| `scheduled` | El dispositivo se está apagando |
| `already_scheduled` | El apagado ya estaba en curso |
| `unavailable` | Este equipo no permite apagarse desde la pantalla |
| fallo de red | No se pudo contactar con el equipo; el dispositivo sigue encendido, con botón «Volver» para reintentar |

El corte real ocurre unos segundos después de la respuesta, para que el aviso
alcance a mostrarse. La configuración de `sudo` en la Raspberry está en el
README de `simtra-bus-manager`.

Al abrir `/itinerary` se selecciona solo el tramo que corresponde a la hora de
Ecuador (el que contiene la hora actual; si ninguno, el próximo que aún no
empieza; si ya terminaron todos, el último). A partir de ahí manda el conductor:
usar «Anterior»/«Siguiente» fija la selección y los refrescos del despacho ya no
la mueven.

---

## Vista `/info`

Pantalla informativa accesible desde el navbar. Muestra, en este orden: título,
descripción institucional, los dos logotipos, datos de contacto y la
conectividad del equipo.

### Modo kiosco

La vista es **enteramente inerte**. Nada de lo que hay en ella puede sacar a
Chromium del modo kiosco:

- no hay ningún `<a>` dentro de la vista;
- no hay `mailto:`, `tel:` ni URLs enlazadas;
- no hay `target="_blank"`, botones de copiar, códigos QR ni manejadores de clic;
- los logotipos son imágenes sin enlace;
- tocar el correo, el teléfono o el sitio web **no produce ninguna acción**.

Los únicos elementos que navegan son los enlaces del navbar, y lo hacen por
React Router dentro de la misma aplicación. `index.html` incluye además
`format-detection` para que el navegador no convierta el teléfono o el correo en
enlaces por su cuenta.

### Conectividad del dispositivo

La información describe **la Raspberry Pi**, no el equipo desde el que se abre
la pantalla: si abres la interfaz desde una laptop, sigues viendo la red de la
RPi. El navegador no puede consultar el SSID ni las interfaces del sistema, así
que el dato viene de `GET /api/system/network` (ver el README de
`simtra-bus-manager` para el contrato completo).

Se muestran todas las conexiones activas — si Wi-Fi y Ethernet lo están, ambas.
Estados posibles en pantalla:

| Situación | Texto |
|---|---|
| Consultando | «Consultando información de red…» |
| Con conexiones | una fila por conexión, con tipo, red (solo Wi-Fi), interfaz e IP |
| `disconnected` | «Sin conexión de red detectada» |
| `unavailable` | «Información de red no disponible» |
| Fallo transitorio | se conserva la última información válida + «No se pudo actualizar la información de red» |

Esta vista solo informa de interfaces y direcciones locales; **no comprueba si
hay acceso a internet**, que es una cosa distinta de estar conectado a una red.

### Logotipos

```text
src/assets/logos/consorcio-ciudad-loja.png
src/assets/logos/mecdevs.png
```

Se aceptan `.png`, `.jpg`, `.jpeg`, `.svg` y `.webp`; solo importa el nombre
base. Se descubren con `import.meta.glob`, así que **la aplicación compila
igual mientras falten**: en su lugar aparece un recuadro discreto con el nombre
de la organización. Basta con dejar los archivos y recompilar.
