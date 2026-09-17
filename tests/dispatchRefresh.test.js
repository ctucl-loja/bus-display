// Recarga manual del itinerario: normalización de la respuesta del equipo.
//
// El punto crítico es `steps`, que es tri-estado y no bi-estado:
//
//     [...]  → hay itinerario nuevo, se muestra
//     []     → el bus NO trabaja hoy; vaciar la pantalla es correcto
//     null   → la operación no tocó nada; NO se toca lo que ya se muestra
//
// Confundir [] con null borraría el itinerario del conductor cada vez que
// fallara la red.
//
// LIMITACIÓN CONSCIENTE: esto no monta React, así que `useDispatch` —el bloqueo
// de doble envío y el descarte de respuestas que llegan tarde— no se ejercita
// aquí; se verificó a mano contra la API local real.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { normalizeDispatchRefresh } from '../src/services/normalize.js'

function dispatch(data) {
  return { id: 1, date: '2026-09-17', register: 1624, revision: 3, data, created_at: '' }
}

const STEP = {
  step: 1,
  code: 'G801',
  start_schedule: '06:00:00',
  end_schedule: '07:00:00',
  line: { id: 17, name: 'A2', number: 8, start_route: 'CARIGAN', end_route: 'CIUDAD VICTORIA' },
  checkpoints: [
    { id: 3701, order: 0, time_calculated: '06:10:00', time_reported: '00:00:00',
      point: { id: 684, name: 'Y DE CARIGÁN', latitude: -4.01, longitude: -79.22 } },
  ],
}

describe('normalizeDispatchRefresh', () => {
  it('itinerario actualizado: devuelve los tramos ya normalizados', () => {
    const result = normalizeDispatchRefresh({
      status: 'updated',
      detail: 'Itinerario actualizado: 1 recorrido(s)',
      date: '2026-09-17',
      dispatch: dispatch([STEP]),
      preserved_reports: 2,
      revision: 3,
    })

    assert.equal(result.status, 'updated')
    assert.equal(result.steps.length, 1)
    // Normalización completa: clave de React, línea y puntos con forma garantizada.
    assert.equal(result.steps[0].key, 1)
    assert.equal(result.steps[0].code, 'G801')
    assert.equal(result.steps[0].checkpoints[0].point.name, 'Y DE CARIGÁN')
    assert.equal(result.preservedReports, 2)
  })

  it('día sin despachos: [] — la pantalla SÍ debe vaciarse', () => {
    const result = normalizeDispatchRefresh({
      status: 'empty', detail: 'El servidor no tiene despachos para este bus hoy',
      date: '2026-09-17', dispatch: dispatch([]),
    })

    assert.equal(result.status, 'empty')
    assert.deepEqual(result.steps, [])
    assert.notEqual(result.steps, null)
  })

  it('cualquier error: null — la pantalla NO debe tocarse', () => {
    for (const status of ['auth_error', 'remote_error', 'invalid', 'save_error']) {
      const result = normalizeDispatchRefresh({
        status, detail: 'algo falló', date: '2026-09-17', dispatch: dispatch([STEP]),
      })
      assert.equal(result.status, status)
      assert.equal(result.steps, null, `${status} no puede reemplazar el itinerario`)
    }
  })

  it('una respuesta que no se entiende NUNCA borra el itinerario', () => {
    for (const raw of [null, undefined, 'texto', [], {}, { status: 'lo-que-sea' }]) {
      const result = normalizeDispatchRefresh(raw)
      assert.equal(result.status, 'remote_error', JSON.stringify(raw))
      assert.equal(result.steps, null)
    }
  })

  it("'updated' sin despacho utilizable no revienta", () => {
    const result = normalizeDispatchRefresh({ status: 'updated', detail: 'x', dispatch: null })
    assert.deepEqual(result.steps, [])
  })

  it('descarta tramos con forma inesperada en vez de mostrarlos crudos', () => {
    const result = normalizeDispatchRefresh({
      status: 'updated', detail: 'x', dispatch: dispatch([STEP, null, 'texto', 42]),
    })
    assert.equal(result.steps.length, 1)
  })

  it('preserved_reports se normaliza a un número', () => {
    for (const [raw, expected] of [[undefined, 0], [null, 0], ['2', 2], ['x', 0], [3, 3]]) {
      const result = normalizeDispatchRefresh({
        status: 'updated', detail: 'x', dispatch: dispatch([]), preserved_reports: raw,
      })
      assert.equal(result.preservedReports, expected)
    }
  })

  it('un detalle vacío no se convierte en "undefined" en pantalla', () => {
    const result = normalizeDispatchRefresh({ status: 'updated', dispatch: dispatch([]) })
    assert.equal(result.detail, '')
  })
})
