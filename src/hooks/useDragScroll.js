import { useRef } from 'react'

// Scroll arrastrando (dedo o mouse) sobre un contenedor con overflow.
//
// La pantalla táctil de la RPi se reporta como mouse, así que el gesto nativo
// de touch no siempre llega: sin esto, en el kiosco no se puede desplazar el
// contenido. Arrastra en los dos ejes; el contenedor decide cuáles desbordan.
//
// El scroll con rueda y las barras de desplazamiento siguen funcionando: esto
// solo AÑADE el arrastre, no sustituye nada. El contenedor conserva su
// `overflow-y-auto`.
//
// Devuelve la ref para el contenedor y los handlers para repartir en el JSX.
export function useDragScroll() {
  const ref = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  function stopDragging() {
    dragRef.current.dragging = false
  }

  function onPointerDown(event) {
    const el = ref.current
    // Nunca se secuestra el gesto sobre un control: el arrastre no debe
    // impedir pulsar un botón del navbar, escribir en el formulario de Wi-Fi ni
    // marcar una casilla. `closest` cubre también los hijos del control (el
    // icono dentro de un botón, por ejemplo).
    if (!el || event.target.closest('button, a, input, select, textarea, [contenteditable]')) return

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }

    // Capturar puede lanzar si el puntero ya no está activo (se levantó entre
    // el evento y este manejador). No es motivo para dejar el gesto a medias:
    // sin captura el arrastre igual funciona mientras el puntero siga dentro.
    try {
      el.setPointerCapture(event.pointerId)
    } catch {
      /* el puntero ya no existe: se sigue sin captura */
    }
  }

  function onPointerMove(event) {
    const el = ref.current
    if (!el || !dragRef.current.dragging) return
    el.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX)
    el.scrollTop = dragRef.current.scrollTop - (event.clientY - dragRef.current.startY)
  }

  function onPointerUp(event) {
    if (!dragRef.current.dragging) return
    stopDragging()
    if (ref.current?.hasPointerCapture(event.pointerId)) {
      ref.current.releasePointerCapture(event.pointerId)
    }
  }

  // Perder la captura sin un pointerup —el navegador la quita en varios casos:
  // un gesto cancelado, el puntero saliendo de la ventana, un drag nativo que
  // arranca pese a todo— dejaba `dragging` en true para siempre. A partir de
  // ahí, el siguiente movimiento del puntero SIN botón pulsado seguía moviendo
  // el scroll, y el arrastre normal parecía roto. Este handler cierra el gesto.
  function onLostPointerCapture() {
    stopDragging()
  }

  // Chromium arrastra por defecto las imágenes (y los enlaces). Al empezar el
  // gesto encima de un logotipo, iniciaba un drag-and-drop nativo: se llevaba el
  // puntero, `pointermove` dejaba de llegar y la página se quedaba sin
  // desplazar hasta soltar.
  //
  // Cada <img> ya lleva `draggable={false}`, pero esto lo cubre a nivel de
  // contenedor para CUALQUIER descendiente —imágenes que se agreguen después
  // incluidas— porque Chromium dispara `dragstart` igual en algunos caminos.
  // No afecta a los controles: prevenir el arrastre no impide enfocar, escribir
  // ni pulsar.
  function onDragStart(event) {
    event.preventDefault()
  }

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onLostPointerCapture,
      onDragStart,
    },
  }
}
