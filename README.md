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
| Vehículo | `GET /api/vehicle` | cacheado por `bus_monitor.py`; lo consulta **solo** `/info` |
| Posición del bus | `GET /api/gps/last_position` | escrita por el receptor GPS, consultada cada 3 s |
| Llegadas a puntos de control | `GET /api/events?event_type=checkpoint_arrival&after_id=N` | emitidas por `bus_monitor.py`, consultadas cada 1,5 s |
| Conectividad del equipo | `GET /api/system/network` | leída del sistema por la RPi, consultada cada 30 s |

Y tres acciones que **escriben** sobre el equipo, todas desde la vista de
Configuración salvo la última:

| Acción | Endpoint local | Efecto |
|---|---|---|
| Conectar a una red Wi-Fi | `POST /api/system/wifi/connect` | La RPi cambia de red (`nmcli`) |
| Apagar el dispositivo | `POST /api/system/shutdown` | La RPi se apaga en unos segundos |
| Reiniciar el dispositivo | `POST /api/system/reboot` | La RPi se reinicia en unos segundos |
| Volver a cargar itinerario | `POST /api/dispatch/refresh` | La API local rebaja el despacho del backend remoto y lo guarda |

`POST /api/dispatch/refresh` es la **única** acción de la pantalla que provoca
una salida a internet, y sigue sin hacerla la pantalla: la hace
`simtra-bus-manager` con las credenciales de su `.env`. **Ninguna credencial del
backend remoto llega al navegador.**

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

Funciones puras (parsing de horarios, selección de tramo, **estado temporal de
la Home**, normalización de las respuestas de la API, formato de diferencias,
validación del formulario de Wi-Fi y textos de apagado/reinicio) con el runner
de Node, sin dependencias nuevas:

```bash
pnpm test
pnpm lint
pnpm build
```

La lógica que merece una prueba vive en `src/utils/` y `src/services/normalize.js`
precisamente por esto: son módulos sin React, sin `fetch` y sin
`import.meta.env`, así que `node --test` puede importarlos. Los componentes
importan `src/config/env.js`, que usa `window`, y no son ejecutables fuera del
navegador.

`tests/homeSchedule.test.js` cubre la selección temporal de la Home: tramos
desordenados, dos vueltas seguidas de la misma línea, vuelta activa / intermedia
/ última, antes del inicio, entre vueltas, fin de la jornada, lista vacía,
horarios inválidos, el límite horario compartido entre dos vueltas y que el
arreglo original no se mute.

**Limitación consciente:** no hay tests de componentes. El enmascarado del campo
de clave, los diálogos de confirmación, el desplazamiento táctil, el arrastre
empezando encima de un logotipo y la distribución a 800x480 se verifican **a
mano en el navegador**; la suite no los cubre. Lo que sí está cubierto son las
decisiones con reglas dentro: qué vuelta está en curso y cuál viene después, qué
estado puede vaciar el itinerario, qué acción se anuncia ante un conflicto de
energía y qué entradas rechaza el formulario.

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
| `/` | Home: línea actual, punto actual/siguiente y siguiente vuelta, a plena anchura y en tipografía grande. Sin mapa y, por tanto, sin polling de GPS |
| `/map` | Mapa con la posición en vivo del bus y los puntos de control del tramo + panel lateral con esos mismos datos, en versión compacta |
| `/info` | Ficha del vehículo, origen del sistema, logotipos y contacto |
| `/itinerary` | Tabla del tramo: hora calculada vs hora reportada, navegable entre tramos |
| `/settings` | Configuración: red del equipo, conexión Wi-Fi, apagado y reinicio |

`/settings` aparece en el navbar como un **engranaje sin etiqueta**: a 800 px no
cabe una quinta palabra junto al reloj y los otros cuatro enlaces, y provocaba
desborde horizontal. Conserva el nombre accesible «Configuración» vía
`aria-label`, `title` y un `<span class="sr-only">`. Todas las rutas siguen
dentro de `MainLayout`, así que los avisos de llegada aparecen igual en
cualquiera de ellas.

---

## Home (`/`)

Tres filas operativas bajo el navbar, más el botón de recarga:

```text
┌──────────────────────────────────────────────────┐
│ LÍNEA ACTUAL                                     │
│ Código · nombre de línea      Inicio: …  Fin: …  │
├────────────────────────┬─────────────────────────┤
│ PUNTO ACTUAL           │ SIGUIENTE PUNTO         │
│ Nombre y hora          │ Nombre y hora           │
├────────────────────────┴─────────────────────────┤
│ SIGUIENTE VUELTA                                 │
│ Código · nombre de línea      Inicio: …  Fin: …  │
└──────────────────────────────────────────────────┘
│           Volver a cargar itinerario             │
```

**«Siguiente punto» y «siguiente vuelta» son cosas distintas.** El primero es el
próximo punto de control DENTRO de la vuelta en curso; el segundo es el próximo
step del itinerario, y **puede ser de la misma línea**: un bus repite la misma
ruta varias veces al día. Por eso la siguiente vuelta no se busca «una línea con
otro nombre», sino la siguiente por horario.

Las dos tarjetas de línea muestran lo mismo (`src/components/LapCard.jsx`):
código del despacho enmarcado en violeta —es lo que permite comprobar de un
vistazo que el bus corre el itinerario correcto—, nombre de la línea vía
`describeLine` y las horas de inicio y fin con etiqueta. Un horario ausente o
ilegible se muestra como «Horario no disponible», nunca en blanco.

### Estado temporal

`src/utils/homeSchedule.js` responde una pregunta que `findCurrentStep` **no**
responde. Comparar los dos importa:

| Función | Pregunta | Devuelve |
|---|---|---|
| `findCurrentStep` (Mapa, Itinerario) | «¿qué tramo hay que pintar?» | el activo; si no hay, el próximo; si ya pasaron todos, el último. **Nunca null habiendo tramos** |
| `resolveHomeSchedule` (Home) | «¿en qué momento del día está el bus?» | una fase explícita, y `currentStep` **solo** si el reloj cae dentro de una ventana |

Home necesita la diferencia: presentar como activa una vuelta que no ha empezado
haría que el conductor viera puntos de control como si los estuviera
recorriendo. Los contratos de `itinerary.js` no se tocaron.

| Fase | Tarjeta superior | Fila de puntos | Tarjeta inferior |
|---|---|---|---|
| `active` | la vuelta en curso | punto actual y siguiente | la sucesora, o «No hay más líneas programadas después de la actual» |
| `before_first` | «El recorrido del día aún no inicia» | «El recorrido aún no inicia» | la primera vuelta programada, con horarios |
| `between` | la anterior, **atenuada y con la etiqueta «VUELTA FINALIZADA»**, más «No hay una vuelta en curso» | «Sin vuelta en curso» | la próxima que debe iniciar |
| `after_last` | la última, etiquetada como finalizada, más «El itinerario del día finalizó» | «Jornada finalizada» | «El itinerario del día finalizó: no hay más vueltas programadas» |
| `no_schedule` | «No hay un itinerario cargado para hoy. Usa «Volver a cargar itinerario»…» | «Sin itinerario» | «Sin itinerario cargado» |
| `unscheduled` | las vueltas de hoy no tienen horario utilizable | «Horario no disponible» | «Horario no disponible» |
| `unknown_time` | no se pudo leer la hora del equipo | «Hora no disponible» | no se puede determinar |

«Itinerario no cargado» y «jornada terminada» son mensajes **distintos** a
propósito: confundirlos haría creer al conductor que ya terminó cuando en
realidad nunca se descargó nada.

Mientras `status === 'loading'` se muestra «Cargando itinerario…» en las tres
filas: no se anticipa ningún estado vacío. Con `status === 'error'` y datos
conservados, el itinerario sigue visible y el aviso va aparte («No se pudo
actualizar el itinerario…»).

### El límite entre dos vueltas

Las ventanas son **cerradas por los dos extremos** (`start <= ahora <= end`),
igual que en `findCurrentStepIndex`. Si una vuelta termina a las 07:00:00 y la
siguiente empieza a las 07:00:00, **ese segundo pertenece a la que termina**: se
elige la de `start_schedule` más temprano. Dos motivos:

1. Coincide con `findCurrentStep`, así que Home, Mapa e Itinerario no se
   contradicen durante ese segundo. El último punto de control de la vuelta que
   cierra suele estar justo a esa hora, y es el que el conductor tiene delante.
2. La siguiente vuelta se busca **por posición** en la lista ya ordenada, nunca
   por horario, así que el mismo step no puede salir arriba y abajo aunque
   compartan el instante. Hay un test para exactamente eso.

Las vueltas con horario ilegible no pueden estar en curso **ni** ser elegidas
como próxima: `sortStepsBySchedule` las manda al final, y tomar «la siguiente de
la lista» las escogería por accidente.

### Altura y desbordes

El contenedor es `h-full min-h-0 flex-col overflow-y-auto`; no se añade otro
`h-screen` bajo el navbar, que desbordaría por sus 120 px. Las tres filas son
`flex-1 basis-0 min-h-min`, así que:

- en pantallas altas **reparten el espacio sobrante** en vez de amontonarse
  arriba (medido a 1280x800: 181 px por fila);
- a 800x480 con datos habituales las tres filas **y** el botón caben completos,
  sin desborde (medido: 82 + 104 + 82 + 56 px);
- con nombres muy largos, zoom o el panel de resultado de la recarga, el
  contenido **crece y se desplaza** en vez de recortarse o superponerse. Ningún
  estado queda inalcanzable.

La fila de puntos es `grid-cols-1 sm:grid-cols-2`: dos columnas a 800 px,
apiladas por debajo, sin desborde horizontal en ningún ancho.

`ReloadDispatchButton` conserva toda su funcionalidad y vive al final, compacto
(`min-h-14`, 56 px): las tres filas operativas son lo que el conductor mira en
marcha. Su altura y la de su panel de resultado cuentan en el layout.

---

## Vista `/itinerary`

Al abrir `/itinerary` se selecciona solo el tramo que corresponde a la hora de
Ecuador (el que contiene la hora actual; si ninguno, el próximo que aún no
empieza; si ya terminaron todos, el último). A partir de ahí manda el conductor:
usar «Anterior»/«Siguiente» fija la selección y los refrescos del despacho ya no
la mueven.

---

## Vista `/settings` (Configuración)

Reúne todo lo que **actúa** sobre el equipo. Antes vivía repartido en `/info`;
se separó a propósito: `/info` es una vista que se mira, Configuración es una
vista que hace cosas, y un botón destructivo no debe estar donde el conductor
entra a leer un teléfono. **Nada de esto está en la barra de navegación**, donde
se tocaría por accidente.

Cuatro secciones, en este orden:

1. **Conectividad del dispositivo** — el componente
   (`src/components/Connectivity.jsx`) se extrajo de la página; no hay dos
   implementaciones.
2. **Conectarse a una red Wi-Fi** — formulario con nombre de red y clave.
3. **Reiniciar dispositivo.**
4. **Apagar dispositivo.**

La vista comparte **una sola instancia** de `useNetworkInfo` entre la lista de
conexiones y el formulario, así que conectarse a una red actualiza la
información de arriba de inmediato en vez de esperar al refresco de 30 s.

El desplazamiento usa `useDragScroll`, que **ignora el gesto cuando empieza
sobre un `input`, un `select`, un `textarea` o un `button`**: arrastrar para
desplazar no roba el foco a los campos del formulario.

---

## Conexión Wi-Fi

### «Usuario» significa nombre de red (SSID)

En la conversación del proyecto se habló de «usuario y clave». En esta pantalla
**«usuario» es el NOMBRE DE LA RED WI-FI (SSID)**, y así está etiquetado el
campo: «Nombre de red (SSID)».

No es el usuario del backend remoto SIMTRA, ni un usuario del sistema, ni una
identidad 802.1X. **No hay soporte WPA-Enterprise**: el equipo se conecta a redes
WPA/WPA2-PSK o abiertas.

### Tratamiento de la clave

Está concentrado en `src/components/WifiForm.jsx` para que sea auditable de un
vistazo:

- El campo es `type="password"` y **no cambia nunca de tipo**. No hay icono de
  ojo, botón de revelar ni ninguna presentación en claro. La máscara la dibuja el
  navegador (punto o asterisco, según el equipo).
- El campo **no está controlado** por React, al contrario que el SSID. Con un
  input controlado React escribe el valor también como **atributo `value`** del
  nodo, y entonces la clave en claro forma parte del marcado: sale en el
  inspector, en cualquier `innerHTML` y para una extensión que lea el DOM. Sin
  estado de React, el valor solo existe en la propiedad del input.
- **No se guarda** en `localStorage`, `sessionStorage`, la URL, ningún log ni
  ninguna tabla de la aplicación. Viaja en el **cuerpo** del POST, nunca en query
  string.
- Se **borra** al terminar la operación —salga bien o mal, incluido el reintento
  tras una clave incorrecta— y **al abandonar la vista**.
- El **SSID actual sí se precarga** cuando el equipo lo reporta (y solo mientras
  el conductor no haya escrito nada). La **clave nunca se precarga**, ni siquiera
  la que el equipo ya tenga guardada.
- Ningún mensaje de error cita el valor recibido.

### Validación y estados

Se valida antes de enviar: SSID no vacío, máximo 32 **octetos** (no caracteres:
`ñ` ocupa dos), sin caracteres de control y sin empezar por `-`. Clave vacía
(red abierta o reconectar con el perfil guardado) o entre 8 y 63 caracteres.

El botón se deshabilita mientras hay un envío en curso, con un `ref` y no con el
estado de React: dos toques seguidos en la pantalla táctil ocurren dentro del
mismo ciclo de render.

| Respuesta | Tono |
|---|---|
| `connected` | éxito |
| `invalid_password`, `not_found`, `unavailable`, `no_adapter`, `not_authorized`, `failed` | error |
| `timeout`, `busy` | aviso |

### Si se pierde la respuesta

Cambiar de red **corta la conexión de quien esté viendo la pantalla desde otro
dispositivo** de la red anterior. La pantalla no interpreta eso como un fracaso:
muestra un aviso que dice exactamente qué pasó y pide comprobar la información de
red del equipo. El equipo, mientras tanto, **sí verifica** la conexión antes de
responder `connected`.

---

## Apagado y reinicio del dispositivo

Los dos botones están al final de `/settings`, bajo «Energía del dispositivo», y
comparten implementación (`src/components/PowerActionButton.jsx`): solo cambian
los textos, el icono y la ruta.

Siempre son **dos pasos**, para ambas acciones. El botón abre un diálogo que dice
qué va a pasar, con la acción y **Cancelar**; un solo toque nunca apaga ni
reinicia el bus. Al confirmar se llama a `POST /api/system/shutdown` o
`POST /api/system/reboot` (sin cuerpo: **el comando vive en la Raspberry y el
frontend no puede proponerlo** — solo elige la ruta).

| Respuesta | Mensaje |
|---|---|
| `scheduled` | El dispositivo se está apagando / reiniciando |
| `already_scheduled` | La acción **pendiente** ya estaba en curso |
| `unavailable` | Este equipo no permite apagarse / reiniciarse desde la pantalla |
| fallo de red | No se pudo contactar con el equipo; sigue encendido, con botón «Volver» para reintentar |

**El conflicto se anuncia por la acción real, no por la pedida.** Si el conductor
toca «Reiniciar» cuando ya había un apagado en curso, la respuesta trae
`pending_action: "shutdown"` y la pantalla dice que se está **apagando** —
anunciar un reinicio lo dejaría esperando una pantalla que no va a volver.

Ningún texto afirma que la acción terminó: la respuesta llega **antes** de que el
sistema ejecute el comando. La ejecución real ocurre unos segundos después, para
que el aviso alcance a mostrarse. La configuración de `sudo` en la Raspberry está
en el README de `simtra-bus-manager`.

---

## Volver a cargar itinerario

Botón al final de la Home. **No recarga la página ni repite `GET /api/dispatch`**
—eso solo relee lo que ya está cacheado en la RPi—: llama a
`POST /api/dispatch/refresh`, que dispara el viaje completo.

```
Home -> POST local -> backend remoto SIMTRA -> validación
     -> persistencia en simtra-bus-manager -> respuesta -> Home actualizada
```

Va **al final**, después de las tres filas operativas: lo que el conductor mira
en marcha es la línea actual y los puntos. Se llega desplazando cuando el
contenido no cabe.

Mientras trabaja muestra «Actualizando itinerario…» con `aria-busy`, y el botón
queda deshabilitado. El bloqueo de doble envío es un `ref` dentro de
`useDispatch`, no el estado de React.

| Resultado | Qué pasa en pantalla |
|---|---|
| `updated` | El itinerario nuevo se aplica **de inmediato**, sin esperar al polling de 60 s |
| `empty` | El bus no trabaja hoy: la pantalla queda vacía, que es lo correcto |
| `auth_error`, `remote_error`, `invalid`, `save_error` | Mensaje en rojo y **se conserva el itinerario anterior** |

Si la recarga conservó marcaciones locales que el servidor aún no conocía, se
dice: «Se conservaron N llegada(s) registradas en este equipo y aún no enviadas
al servidor». Sin ese texto, el conductor podría creer que la recarga le borró
llegadas ya hechas.

### Estado separado y respuestas que llegan tarde

`useDispatch()` expone `refresh`, `refreshing` y `refreshResult` **aparte** de
`status`: mientras se recarga, la Home sigue mostrando el itinerario actual con
normalidad, no vuelve a «Cargando itinerario…».

Cada escritura de `steps` lleva un número de secuencia y una respuesta con un
número menor que el último aplicado se descarta. Sin eso, el polling de 60 s que
salió **antes** de la recarga puede terminar **después** y devolver el itinerario
viejo encima del recién descargado: el botón diría «actualizado» y los datos
serían los de siempre.

### Coherencia con Mapa e Itinerario

`/map` e `/itinerary` montan su propia instancia de `useDispatch` y leen de la
API local, que ya tiene el itinerario nuevo: al navegar muestran lo mismo que
Home, sin ningún estado compartido entre vistas.

### El monitor tarda un poco más

La pantalla se actualiza al instante, pero `simtra-bus-monitor` es **otro
proceso**: adopta el itinerario nuevo —y sus geocercas— en hasta 10 s, por el
canal de eventos locales. Si ese servicio está detenido, **no adopta nada**: la
pantalla mostrará el itinerario nuevo y el geofencing seguirá parado. El detalle
está en el README de `simtra-bus-manager`.

---

## Vista `/info`

Ficha del vehículo y contenido institucional: título, **Información del
vehículo**, descripción, los dos logotipos y datos de contacto.

> La conectividad del equipo, el formulario de Wi-Fi y el apagado se **mudaron a
> `/settings`** (Configuración, el engranaje del navbar). `/info` conserva una
> nota que lo dice, para que quien los busque donde estaban los encuentre.

### Información del vehículo

Es la **única** ficha del vehículo de la aplicación
(`src/components/VehicleInfoCard.jsx`), y va cerca del inicio de la vista porque
es el dato que alguien viene a buscar aquí.

Antes estaba **duplicada** entre Home y el panel lateral de `/map`, con campos
distintos en cada una —Home no mostraba el propietario— y con dos hooks
consultando `GET /api/vehicle` en paralelo. Ahora reúne los campos de las dos
versiones:

| Campo | Origen |
|---|---|
| Registro | `vehicle.register` |
| Placa | `vehicle.plate` |
| Cooperativa | `vehicle.company.name` |
| Propietario | `vehicle.user.name` + `vehicle.user.lastname` |

Un campo ausente se muestra como «No disponible»; nunca llega un `undefined` o
un `null` a la pantalla. `useVehicle` conserva la última ficha válida ante un
fallo puntual de la API local, así que con `status: 'error'` se sigue mostrando
lo último bueno y el aviso va aparte.

**Consecuencia para Home y Mapa:** ya no montan `useVehicle` ni importan
`VEHICLE_MESSAGES`, así que **dejaron de hacer polling del vehículo**. Verificado
en el navegador: ni `/` ni `/map` emiten una sola petición a `/api/vehicle`.

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

### Conectividad del dispositivo (ahora en `/settings`)

Documentada aquí porque es donde se busca. **La sección vive en `/settings`**;
el componente es `src/components/Connectivity.jsx`.

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

Esta sección solo informa de interfaces y direcciones locales; **no comprueba si
hay acceso a internet**, que es una cosa distinta de estar conectado a una red.

Desde que existe el formulario de Wi-Fi, esta lista ya no es solo pasiva: tras
una conexión exitosa se actualiza de inmediato con la red devuelta por el equipo,
sin esperar al refresco de 30 s.

### Logotipos

```text
src/assets/logos/consorcio-ciudad-loja.png
src/assets/logos/mecdevs.png
```

Se aceptan `.png`, `.jpg`, `.jpeg`, `.svg` y `.webp`; solo importa el nombre
base. Se descubren con `import.meta.glob`, así que **la aplicación compila
igual mientras falten**: en su lugar aparece un recuadro discreto con el nombre
de la organización. Basta con dejar los archivos y recompilar.

Cada logotipo va en **su propio marco**, dentro de un contenedor común que los
organiza (apilados por debajo de `sm`, lado a lado a partir de ahí). El marco
tiene fondo claro fijo en los dos temas: muchos logotipos vienen con
transparencia y texto oscuro, que desaparecería sobre el tema oscuro. La altura
está acotada (`h-28` / `sm:h-32` / `lg:h-40`) para que en la pantalla de 7" no se
coman media vista, y la imagen usa `object-contain`: **nunca se recorta ni se
deforma**.

### El arrastre que empezaba sobre un logotipo

**Síntoma:** al iniciar el gesto de desplazamiento encima de una imagen,
Chromium arrancaba un *drag-and-drop* nativo del logotipo. Se llevaba el puntero,
`pointermove` dejaba de llegar y la página no se desplazaba hasta soltar.

Envolver la imagen en un `<div>` **no lo arregla**: el arrastre nace de la propia
`<img>`. La corrección es en tres capas:

1. `draggable={false}` en cada `<img>`.
2. `onDragStart={(e) => e.preventDefault()}` en la imagen, porque Chromium
   dispara `dragstart` igual en algunos caminos pese al atributo.
3. Un `onDragStart` que cancela **a nivel del contenedor** en `useDragScroll`,
   que cubre a cualquier descendiente —incluidas imágenes que se agreguen
   después— sin tener que acordarse en cada una.

Además, `useDragScroll` ganó un `onLostPointerCapture`. Perder la captura sin un
`pointerup` —el navegador la quita en un gesto cancelado, al salir el puntero de
la ventana o si un drag nativo arranca pese a todo— dejaba `dragging` en `true`
para siempre: a partir de ahí el puntero movía el scroll **sin botón pulsado** y
el arrastre parecía roto. `setPointerCapture` va además en `try/catch`, porque
lanza si el puntero ya no está activo.

Nada de esto afecta a los controles: `onPointerDown` sigue ignorando el gesto
que empieza sobre `button`, `a`, `input`, `select`, `textarea` o
`[contenteditable]`, así que el formulario de Wi-Fi de `/settings` conserva foco
y escritura. Verificado en el navegador.

Toda la vista usa **un único contenedor vertical de scroll**: sin paneles
anidados ni alturas fijas, así que se llega al final de la última tarjeta
arrastrando desde cualquier punto, logotipos incluidos.
