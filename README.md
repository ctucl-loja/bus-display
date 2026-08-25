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

## Configuración

**No hace falta configurar nada para el uso normal.** La pantalla deriva la URL
de la API local del host desde el que se abrió la página, así que una sola
compilación sirve tanto para el kiosco de la RPi como para una laptop de la LAN:

```text
http://localhost:4173      →  API en http://localhost:8000
http://192.168.1.14:4173   →  API en http://192.168.1.14:8000
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
(`http://<IP_RPI>:4173`), así que si esa variable se restringió a una lista hay
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

Producción (kiosco en la RPi): ver [Despliegue en producción](#despliegue-en-producción-servicio-systemd--modo-kiosko) más abajo.

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
http://<IP_LAN_DE_LA_RASPBERRY>:4173
```

El servicio de producción ya escucha en todas las interfaces
(`serve -s dist -l tcp://0.0.0.0:4173`), y el kiosco local sigue usando
`http://localhost:4173` sin cambios. La API se resuelve sola: al abrir con la IP
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

## Despliegue en producción (servicio systemd + modo kiosko)

Esta sección cubre únicamente `bus-display` como programa: compilarlo, dejarlo
corriendo siempre como servicio, y mostrarlo en pantalla completa en el
arranque. Asume que `simtra-bus-manager` (API local, monitor, loader) ya está
levantado por su cuenta, y no entra en configuración de red ni de CORS — eso se
resuelve aparte, del lado de la infraestructura.

### 1. Compilar

```bash
cd /home/admin/bus-display
pnpm install
pnpm run build
```

Esto genera `dist/` con los estáticos listos para servir. Repite este paso
cada vez que actualices el código (`git pull` + `pnpm install` + `pnpm run
build`) — Vite incrusta las variables `VITE_*` en el JS al compilar, así que
también hay que repetirlo si cambia `.env`.

### 2. Servicio systemd

Sirve `dist/` con [`serve`](https://www.npmjs.com/package/serve) en el puerto
4173, escuchando en todas las interfaces. Si Node se instaló con `nvm`, ubica
primero el binario (systemd no carga tu `.bashrc`, así que necesita la ruta
completa):

```bash
NODE_BIN_DIR=$(dirname "$(which node)")
echo "Usando: $NODE_BIN_DIR"
```

```bash
sudo tee /etc/systemd/system/bus-display.service > /dev/null <<EOF
[Unit]
Description=Bus Display - servidor estatico
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/bus-display
Environment=PATH=$NODE_BIN_DIR:/usr/bin:/bin
ExecStart=$NODE_BIN_DIR/npx --yes serve -s dist -l tcp://0.0.0.0:4173
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bus-display.service
sudo systemctl status bus-display.service
```

`enable` hace que arranque solo en cada boot; `Restart=on-failure` lo revive si
el proceso muere. Para actualizar tras un cambio de código:

```bash
cd /home/admin/bus-display && git pull && pnpm install && pnpm run build && sudo systemctl restart bus-display
```

### 3. Modo kiosko (Chromium a pantalla completa)

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
sudo apt update && sudo apt install -y chromium-browser
```

Autostart de labwc: agrega el bloque de kiosko (espera a que el servicio
responda, y recién ahí abre Chromium en `--kiosk` contra el propio servidor
local):

```bash
mkdir -p ~/.config/labwc
cp /etc/xdg/labwc/autostart ~/.config/labwc/autostart 2>/dev/null || touch ~/.config/labwc/autostart
```

```bash
cat >> ~/.config/labwc/autostart <<'EOF'

# Bus Display - modo kiosko
(
  for i in $(seq 1 30); do
    curl -sf http://localhost:4173 >/dev/null && break
    sleep 1
  done
  CHROME_BIN=$(command -v chromium-browser || command -v chromium)
  "$CHROME_BIN" --kiosk --noerrdialogs --disable-infobars \
    --disable-session-crashed-bubble --disable-translate \
    --check-for-update-interval=31536000 --incognito \
    http://localhost:4173
) &
EOF
```

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
desmonta al navegar, así que los avisos aparecen igual en `/` que en
`/itinerary` y el estado del polling sobrevive al cambio de ruta.

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
| `/` | Mapa con la posición en vivo del bus y los puntos de control del tramo + panel de línea, punto actual/siguiente y vehículo |
| `/itinerary` | Tabla del tramo: hora calculada vs hora reportada, navegable entre tramos |

Al abrir `/itinerary` se selecciona solo el tramo que corresponde a la hora de
Ecuador (el que contiene la hora actual; si ninguno, el próximo que aún no
empieza; si ya terminaron todos, el último). A partir de ahí manda el conductor:
usar «Anterior»/«Siguiente» fija la selección y los refrescos del despacho ya no
la mueven.

