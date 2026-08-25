import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatDifference, formatClock, ARRIVAL_LABELS, ARRIVAL_STATUS } from '../src/utils/arrival.js'

describe('formatDifference', () => {
  it('formatea segundos y minutos en valor absoluto', () => {
    assert.equal(formatDifference(18), '18 s')
    assert.equal(formatDifference(-18), '18 s')
    assert.equal(formatDifference(135), '2 min 15 s')
    assert.equal(formatDifference(-75), '1 min 15 s')
    assert.equal(formatDifference(65), '1 min 05 s')
    assert.equal(formatDifference(0), '0 s')
  })

  it('devuelve null cuando la diferencia no se conoce', () => {
    // Clave: "no se sabe" NO puede mostrarse como "0 s", que significa
    // "llegó exacto".
    for (const value of [null, undefined, '', 'abc', NaN, Infinity, -Infinity, {}, []]) {
      assert.equal(formatDifference(value), null, `esperaba null para ${JSON.stringify(value)}`)
    }
  })

  it('acepta números en texto', () => {
    assert.equal(formatDifference('90'), '1 min 30 s')
  })
})

describe('formatClock', () => {
  it('recorta a HH:MM', () => {
    assert.equal(formatClock('06:41:02'), '06:41')
    assert.equal(formatClock('06:41'), '06:41')
  })

  it('usa marcador para valores ausentes o inválidos', () => {
    for (const value of [null, undefined, '', 'abc', 42, {}]) {
      assert.equal(formatClock(value), '--:--')
    }
  })
})

describe('etiquetas', () => {
  it('un estado desconocido no tiene traducción', () => {
    assert.equal(ARRIVAL_LABELS[ARRIVAL_STATUS.ON_TIME], 'A TIEMPO')
    assert.equal(ARRIVAL_LABELS['LO_QUE_SEA'], undefined)
    assert.equal(ARRIVAL_LABELS[undefined], undefined)
  })
})
