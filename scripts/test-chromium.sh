#!/bin/sh
#
# Prueba manual de Chromium contra bus-display: sin kiosko, sin autostart y sin
# tocar el perfil habitual del navegador.
#
# Existe para responder UNA pregunta: ¿la pantalla se ve en una ventana normal?
#   - Si se ve, el problema estaba en el arranque o en los flags de kiosko.
#   - Si tambien sale gris, el problema esta por debajo (compositor o GPU) y no
#     lo arregla cambiar de navegador.
#
# Ejecutar desde un terminal DEL ESCRITORIO de la Raspberry. Por SSH funciona
# igual (la ventana aparece en la pantalla del bus, no en la laptop): el script
# se encarga de exportar las variables de sesion grafica si faltan.
#
#   ./scripts/test-chromium.sh
#   ./scripts/test-chromium.sh --ozone-platform=wayland
#   ./scripts/test-chromium.sh --disable-gpu
#   URL=http://192.168.1.14:5173 ./scripts/test-chromium.sh
#
# Cualquier argumento se pasa tal cual a Chromium, para escalar flags de a uno.

set -u

URL="${URL:-http://localhost:5173}"
PROFILE=/tmp/chromium-test
LOG=/tmp/chromium-test.log

# En Pi OS reciente el binario a veces se llama solo `chromium`.
CHROME_BIN=$(command -v chromium-browser || command -v chromium) || {
    echo "No se encontro chromium-browser ni chromium en el PATH." >&2
    exit 1
}

# Sin sesion grafica no hay nada que probar: lanzado por SSH sin estas dos
# variables, Chromium falla con un error que no delata la causa real.
if [ -z "${WAYLAND_DISPLAY:-}" ] && [ -z "${DISPLAY:-}" ]; then
    XDG_RUNTIME_DIR="/run/user/$(id -u)"
    WAYLAND_DISPLAY=wayland-0
    export XDG_RUNTIME_DIR WAYLAND_DISPLAY
    echo "Sin sesion grafica en el entorno; asumiendo WAYLAND_DISPLAY=$WAYLAND_DISPLAY"
fi

echo "Binario : $CHROME_BIN"
echo "URL     : $URL"
echo "Perfil  : $PROFILE  (desechable)"
echo "Log     : $LOG"
echo "Flags   : --password-store=basic $*"
echo
echo "Cierra la ventana o pulsa Ctrl+C para terminar."
echo

# --password-store=basic  : evita el dialogo del llavero (con autologin,
#                           gnome-keyring queda bloqueado y Chromium pide
#                           desbloquearlo en cada arranque).
# --user-data-dir         : perfil desechable, aisla la prueba de cualquier
#                           estado dejado por los intentos anteriores.
"$CHROME_BIN" \
    --password-store=basic \
    --user-data-dir="$PROFILE" \
    "$@" \
    "$URL" 2>&1 | tee "$LOG"

echo
echo "Salida guardada en $LOG"
echo "Para borrar el perfil de prueba:  rm -rf $PROFILE"
