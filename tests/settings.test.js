// Configuración del dispositivo: validación del formulario de Wi-Fi y textos de
// apagado / reinicio.
//
// Son las partes con una decisión real dentro, y viven en módulos puros
// (`src/utils/`) precisamente para poder probarlas con `node --test`: los
// componentes importan `src/config/env.js`, que usa `import.meta.env` y
// `window`, y no son ejecutables fuera del navegador.
//
// LIMITACIÓN CONSCIENTE: esto NO monta React. El enmascarado del campo, el
// diálogo de confirmación, el scroll y la distribución en 800x480 se
// verificaron a mano en el navegador; no hay aquí un test que los cubra.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  validateSsid,
  validatePassword,
  validateWifiForm,
  WIFI_RESULT_TONE,
  WIFI_NETWORK_ERROR,
  SSID_MAX_BYTES,
  PSK_MIN_LENGTH,
  PSK_MAX_LENGTH,
} from '../src/utils/wifi.js'
import {
  POWER_ACTION_TEXTS,
  POWER_NETWORK_ERROR,
  resultMessage,
} from '../src/utils/powerMessages.js'
import { normalizeWifiResult, normalizePowerResult } from '../src/services/normalize.js'

// Deliberadamente no se parece a ninguna palabra del español: así una
// coincidencia con el texto de un mensaje señala una fuga real y no el
// prefijo 'clav' apareciendo dentro de la palabra «clave».
const SECRETO = 'Xk7qW92-Pl0km'

describe('validateSsid', () => {
  it('acepta un nombre de red normal', () => {
    assert.equal(validateSsid('SIMTRA-PATIO'), null)
    assert.equal(validateSsid('  MI RED  '), null)
  })

  it('exige un nombre', () => {
    for (const value of ['', '   ', null, undefined, 42]) {
      assert.ok(validateSsid(value), `esperaba error para ${JSON.stringify(value)}`)
    }
  })

  it('mide en octetos, no en caracteres', () => {
    // 'ñ' ocupa dos octetos: 17 de ellas ya pasan el límite de 802.11.
    assert.equal(validateSsid('a'.repeat(SSID_MAX_BYTES)), null)
    assert.ok(validateSsid('a'.repeat(SSID_MAX_BYTES + 1)))
    assert.ok(validateSsid('ñ'.repeat(17)))
  })

  it('rechaza caracteres de control', () => {
    assert.ok(validateSsid('mi\u0001red'))
    assert.ok(validateSsid('mired\u0000'))
  })

  it("rechaza un nombre que empieza con '-'", () => {
    // Seria interpretado como una opcion por nmcli.
    assert.ok(validateSsid('-red'))
  })
})

describe('validatePassword', () => {
  it('una clave vacía es válida: red abierta o perfil ya guardado', () => {
    assert.equal(validatePassword(''), null)
    assert.equal(validatePassword(null), null)
    assert.equal(validatePassword(undefined), null)
  })

  it('exige el rango de WPA/WPA2-PSK', () => {
    assert.equal(validatePassword('a'.repeat(PSK_MIN_LENGTH)), null)
    assert.equal(validatePassword('a'.repeat(PSK_MAX_LENGTH)), null)
    assert.ok(validatePassword('a'.repeat(PSK_MIN_LENGTH - 1)))
    assert.ok(validatePassword('a'.repeat(PSK_MAX_LENGTH + 1)))
  })

  it('no recorta la clave: un espacio puede ser parte del PSK', () => {
    assert.equal(validatePassword('clave123 '), null)
    // Si hiciera trim(), esto tendría 7 caracteres y sería rechazada.
    assert.equal(validatePassword(' clave1 '), null)
  })

  it('rechaza caracteres de control', () => {
    assert.ok(validatePassword('clave\u000112345'))
  })

  it('NINGÚN mensaje de error cita la clave', () => {
    // Un mensaje que devuelve el valor recibido es la forma más fácil de dejar
    // un secreto en pantalla o en una captura.
    for (const value of [SECRETO.slice(0, 4), SECRETO + 'x'.repeat(60), SECRETO + '\u0001']) {
      const message = validatePassword(value)
      assert.ok(message, 'este caso debe fallar')
      assert.ok(!message.includes(SECRETO), `el mensaje cita la clave: ${message}`)
      assert.ok(!message.includes(value))
    }
  })
})

describe('validateWifiForm', () => {
  it('devuelve el primer problema, o null', () => {
    assert.equal(validateWifiForm({ ssid: 'RED', password: 'clave-buena' }), null)
    assert.equal(validateWifiForm({ ssid: 'RED', password: '' }), null)
    assert.ok(validateWifiForm({ ssid: '', password: 'clave-buena' }))
    assert.ok(validateWifiForm({ ssid: 'RED', password: 'abc' }))
  })

  it('el SSID se comprueba antes que la clave', () => {
    const message = validateWifiForm({ ssid: '', password: 'abc' })
    assert.match(message, /nombre de la red/i)
  })
})

describe('tonos del resultado Wi-Fi', () => {
  it("solo 'connected' es un éxito", () => {
    assert.equal(WIFI_RESULT_TONE.connected, 'ok')
    for (const [status, tone] of Object.entries(WIFI_RESULT_TONE)) {
      if (status !== 'connected') assert.notEqual(tone, 'ok', `${status} no puede ser un éxito`)
    }
  })

  it('un fallo de red no se presenta como fracaso de la conexión', () => {
    // Cambiar de red CORTA la conexión de quien mira desde otro dispositivo:
    // ese corte no prueba nada sobre el resultado.
    assert.equal(WIFI_NETWORK_ERROR.tone, 'warn')
    assert.match(WIFI_NETWORK_ERROR.text, /otro dispositivo/i)
  })
})

describe('normalizeWifiResult', () => {
  it('conserva un resultado válido', () => {
    const result = normalizeWifiResult({
      status: 'connected',
      detail: 'Conectado a la red',
      ssid: 'SIMTRA-PATIO',
      network: { status: 'connected', connections: [{ type: 'wifi', interface: 'wlan0', name: 'SIMTRA-PATIO', ipv4: ['192.168.1.30'] }] },
    })
    assert.equal(result.status, 'connected')
    assert.equal(result.ssid, 'SIMTRA-PATIO')
    assert.deepEqual(result.network.connections[0].ipv4, ['192.168.1.30'])
  })

  it("un estado desconocido NUNCA se degrada a 'connected'", () => {
    for (const raw of [null, undefined, 'texto', {}, { status: 'lo-que-sea' }, { status: 'CONNECTED' }]) {
      assert.equal(normalizeWifiResult(raw).status, 'failed', JSON.stringify(raw))
    }
  })

  it('sin red devuelta, `network` es null', () => {
    assert.equal(normalizeWifiResult({ status: 'invalid_password', detail: 'x' }).network, null)
  })
})

describe('resultMessage (apagado / reinicio)', () => {
  it('anuncia lo que se pidió', () => {
    const apagado = resultMessage({ status: 'scheduled', action: 'shutdown', pendingAction: 'shutdown' }, 'shutdown')
    assert.equal(apagado.tone, 'ok')
    assert.equal(apagado.text, POWER_ACTION_TEXTS.shutdown.scheduled)

    const reinicio = resultMessage({ status: 'scheduled', action: 'reboot', pendingAction: 'reboot' }, 'reboot')
    assert.equal(reinicio.text, POWER_ACTION_TEXTS.reboot.scheduled)
  })

  it('con un conflicto anuncia la acción REALMENTE pendiente, no la pedida', () => {
    // El conductor tocó «Reiniciar», pero ya había un apagado en curso: si la
    // pantalla anunciara un reinicio, se quedaría esperando una pantalla que no
    // va a volver.
    const result = resultMessage(
      { status: 'already_scheduled', action: 'reboot', pendingAction: 'shutdown' },
      'reboot',
    )
    assert.equal(result.text, POWER_ACTION_TEXTS.shutdown.pending)
    assert.match(result.text, /apagado/i)
    assert.ok(!/reinicio/i.test(result.text))
  })

  it('y al revés: apagado pedido con un reinicio en curso', () => {
    const result = resultMessage(
      { status: 'already_scheduled', action: 'shutdown', pendingAction: 'reboot' },
      'shutdown',
    )
    assert.match(result.text, /reinicio/i)
  })

  it('una respuesta que no se entiende no promete nada', () => {
    for (const raw of [null, undefined, {}, { status: 'raro' }, 'texto']) {
      const result = resultMessage(raw, 'reboot')
      assert.equal(result.tone, 'error')
      assert.equal(result.text, POWER_ACTION_TEXTS.reboot.unavailable)
    }
  })

  it('ningún texto afirma que la acción ya terminó', () => {
    // La respuesta llega ANTES de que el sistema ejecute el comando.
    assert.match(POWER_ACTION_TEXTS.shutdown.scheduled, /apagando/i)
    assert.match(POWER_ACTION_TEXTS.reboot.scheduled, /reiniciando/i)
    assert.ok(!/se reinició|se apagó|ya reinició/i.test(POWER_ACTION_TEXTS.reboot.scheduled))
  })

  it('un fallo de red deja claro que el equipo sigue encendido', () => {
    assert.equal(POWER_NETWORK_ERROR.tone, 'error')
    assert.match(POWER_NETWORK_ERROR.text, /sigue encendido/i)
  })
})

describe('normalizePowerResult', () => {
  it('traduce la respuesta del equipo', () => {
    const result = normalizePowerResult(
      { status: 'already_scheduled', detail: 'El apagado ya estaba en curso', action: 'reboot', pending_action: 'shutdown' },
      'reboot',
    )
    assert.equal(result.action, 'reboot')
    assert.equal(result.pendingAction, 'shutdown')
  })

  it("un estado desconocido se degrada a 'unavailable', nunca a 'scheduled'", () => {
    for (const raw of [null, {}, { status: 'raro' }, 'texto']) {
      assert.equal(normalizePowerResult(raw, 'shutdown').status, 'unavailable')
    }
  })

  it('una acción pendiente desconocida se ignora', () => {
    const result = normalizePowerResult({ status: 'scheduled', pending_action: 'formatear' }, 'reboot')
    assert.equal(result.pendingAction, null)
  })
})
