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

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_LOCAL_API_URL` | URL de la API local de `simtra-bus-manager` (ej. `http://localhost:8000`) |

No hay credenciales ni número de bus: la RPi ya está configurada con su propio
`FAST_API_BUS_REGISTER` y es la que autentica contra el backend remoto.

Del lado de `simtra-bus-manager`, `FAST_API_CORS_ORIGINS` controla qué orígenes
puede usar el navegador (por defecto `*`, suficiente en un equipo aislado).

## Ejecución

```bash
pnpm install
pnpm dev
```

Producción (kiosco en la RPi):

```bash
pnpm build
pnpm preview --host --port 4173
```

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
