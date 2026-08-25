import { useRef } from 'react'

// Scroll arrastrando (dedo o mouse) sobre un contenedor con overflow.
//
// La pantalla táctil de la RPi se reporta como mouse, así que el gesto nativo
// de touch no siempre llega: sin esto, en el kiosco no se puede desplazar el
// contenido. Arrastra en los dos ejes; el contenedor decide cuáles desbordan.
//
// Devuelve la ref para el contenedor y los handlers para repartir en el JSX.
export function useDragScroll() {
  const ref = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  function onPointerDown(event) {
    const el = ref.current
    // Nunca se secuestra el gesto sobre un control: el arrastre no debe
    // impedir pulsar un botón del navbar o de la tabla.
    if (!el || event.target.closest('button, a, input, select, textarea')) return
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }
    el.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    const el = ref.current
    if (!el || !dragRef.current.dragging) return
    el.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX)
    el.scrollTop = dragRef.current.scrollTop - (event.clientY - dragRef.current.startY)
  }

  function onPointerUp(event) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (ref.current?.hasPointerCapture(event.pointerId)) {
      ref.current.releasePointerCapture(event.pointerId)
    }
  }

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
