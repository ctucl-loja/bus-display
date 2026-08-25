import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { timeToSeconds, toISODate, toEcuadorTime } from '../src/utils/ecuadorTime.js'

describe('timeToSeconds', () => {
  it('convierte horarios válidos', () => {
    assert.equal(timeToSeconds('00:00:00'), 0)
    assert.equal(timeToSeconds('06:25:00'), 6 * 3600 + 25 * 60)
    assert.equal(timeToSeconds('23:59:59'), 86399)
    assert.equal(timeToSeconds('07:30'), 7 * 3600 + 30 * 60)
    assert.equal(timeToSeconds('  08:00:00  '), 8 * 3600)
  })

  it('devuelve null (no NaN) para entradas inválidas', () => {
    const invalidos = [
      null, undefined, '', '   ', 'abc', '12', '12:', ':30', '12:00:00:00',
      'aa:bb:cc', 42, {}, [], true, NaN,
    ]
    for (const value of invalidos) {
      assert.equal(timeToSeconds(value), null, `esperaba null para ${JSON.stringify(value)}`)
    }
  })

  it('rechaza horarios fuera de rango', () => {
    for (const value of ['24:00:00', '25:00:00', '12:60:00', '12:00:60']) {
      assert.equal(timeToSeconds(value), null, value)
    }
  })

  it('distingue null de 0', () => {
    assert.equal(timeToSeconds('00:00:00'), 0)
    assert.equal(timeToSeconds('invalido'), null)
    assert.notEqual(timeToSeconds('invalido'), 0)
  })
})

describe('toISODate / toEcuadorTime', () => {
  it('formatea en zona de Ecuador', () => {
    // 2026-08-25T02:30:00Z = 2026-08-24 21:30 en Guayaquil (UTC-5)
    const date = new Date('2026-08-25T02:30:00Z')
    assert.equal(toISODate(date), '2026-08-24')
    assert.equal(toEcuadorTime(date), '21:30:00')
  })

  it('medianoche de Ecuador es 00, no 24', () => {
    assert.equal(toEcuadorTime(new Date('2026-08-25T05:00:30Z')), '00:00:30')
  })
})
