// Textos y traducción de resultados del apagado y el reinicio del dispositivo.
//
// Vive aparte del componente a propósito: son datos y una función pura, sin
// React ni `fetch`, así que `resultMessage` —la parte con una decisión real
// dentro— se prueba directamente con `node --test`.
//
// Ninguna de las dos acciones se anuncia como terminada: la respuesta llega
// ANTES de que el sistema ejecute el comando, así que los textos hablan de algo
// en curso ("se está apagando"), nunca de algo cumplido.

export const POWER_ACTION_TEXTS = {
  shutdown: {
    button: 'Apagar dispositivo',
    title: '¿Apagar el dispositivo?',
    description:
      'Esto provocará que el dispositivo se apague. La pantalla y el registro de puntos de ' +
      'control dejarán de funcionar hasta que alguien vuelva a encender el equipo.',
    confirm: 'Apagar',
    sending: 'Apagando…',
    scheduled:
      'El dispositivo se está apagando. Puede desconectar la alimentación cuando la pantalla se apague.',
    pending: 'El apagado ya estaba en curso.',
    unavailable: 'Este equipo no permite apagarse desde la pantalla.',
  },
  reboot: {
    button: 'Reiniciar dispositivo',
    title: '¿Reiniciar el dispositivo?',
    description:
      'El equipo se reiniciará de inmediato. La pantalla se apagará y volverá sola en uno o ' +
      'dos minutos; mientras tanto no se registran puntos de control. No corte la alimentación ' +
      'durante el reinicio.',
    confirm: 'Reiniciar',
    sending: 'Reiniciando…',
    scheduled:
      'El dispositivo se está reiniciando. La pantalla volverá en uno o dos minutos; no corte ' +
      'la alimentación.',
    pending: 'El reinicio ya estaba en curso.',
    unavailable: 'Este equipo no permite reiniciarse desde la pantalla.',
  },
}

export const POWER_NETWORK_ERROR = {
  tone: 'error',
  text: 'No se pudo contactar con el equipo. El dispositivo sigue encendido.',
}

/**
 * Traduce la respuesta del equipo al mensaje que ve el conductor.
 *
 * El detalle que importa: con `already_scheduled`, la acción realmente
 * pendiente puede ser la OTRA. Si el conductor toca «Reiniciar» cuando ya había
 * un apagado en curso, lo que va a pasar es un apagado, y eso es lo que hay que
 * decir — anunciar un reinicio dejaría al conductor esperando una pantalla que
 * no va a volver.
 *
 * Cualquier respuesta que no sea 'scheduled' ni 'already_scheduled' se trata
 * como 'unavailable': nunca se promete una acción por una respuesta que no se
 * entiende.
 */
export function resultMessage(response, action) {
  const requested = POWER_ACTION_TEXTS[action] ? action : 'shutdown'
  const pending = POWER_ACTION_TEXTS[response?.pendingAction] ? response.pendingAction : requested
  const texts = POWER_ACTION_TEXTS[pending]

  if (response?.status === 'scheduled') return { tone: 'ok', text: texts.scheduled }
  if (response?.status === 'already_scheduled') return { tone: 'ok', text: texts.pending }
  return { tone: 'error', text: POWER_ACTION_TEXTS[requested].unavailable }
}
