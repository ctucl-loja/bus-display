import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeSteps,
  normalizeVehicle,
  normalizeGpsPosition,
  normalizeEvents,
  normalizeNetworkInfo,
} from '../src/services/normalize.js'
import { finiteNumber, nonEmptyString, isObject } from '../src/utils/values.js'

describe('finiteNumber', () => {
  it('acepta números y cadenas numéricas', () => {
    assert.equal(finiteNumber(0), 0)
    assert.equal(finiteNumber(-4.01), -4.01)
    assert.equal(finiteNumber('32.5'), 32.5)
    assert.equal(finiteNumber('  7 '), 7)
  })

  it('nunca convierte "sin dato" en 0', () => {
    // Number('') === 0 y Number([]) === 0: justo lo que hay que evitar.
    for (const value of [null, undefined, '', '   ', [], {}, true, false, 'abc', NaN, Infinity]) {
      assert.equal(finiteNumber(value), null, `esperaba null para ${JSON.stringify(value)}`)
    }
  })
})

describe('nonEmptyString / isObject', () => {
  it('nonEmptyString', () => {
    assert.equal(nonEmptyString('  hola '), 'hola')
    for (const value of [null, undefined, '', '   ', 42, {}, []]) {
      assert.equal(nonEmptyString(value), null)
    }
  })

  it('isObject descarta arrays y null', () => {
    assert.ok(isObject({}))
    for (const value of [null, undefined, [], 'x', 42]) {
      assert.equal(isObject(value), false)
    }
  })
})

describe('normalizeSteps', () => {
  const crudo = [{
    step: 1,
    start_schedule: '06:00:00',
    end_schedule: '07:00:00',
    line: { id: 17, name: 'A2', number: 8, start_route: 'X', end_route: 'Y' },
    checkpoints: [{
      id: 3701, order: 0, time_calculated: '06:10:00', time_reported: '00:00:00',
      point: { id: 684, name: 'Y DE CARIGÁN', latitude: -4.01, longitude: -79.22, radius: 50 },
    }],
  }]

  it('conserva los datos válidos', () => {
    const [step] = normalizeSteps(crudo)
    assert.equal(step.step, 1)
    assert.equal(step.line.name, 'A2')
    assert.equal(step.checkpoints[0].point.latitude, -4.01)
    assert.equal(step.checkpoints[0].order, 0, 'order 0 es un valor real, no ausencia')
  })

  it('no muta la respuesta original', () => {
    const copia = JSON.parse(JSON.stringify(crudo))
    normalizeSteps(crudo)
    assert.deepEqual(crudo, copia)
  })

  it('devuelve [] para cualquier forma inesperada', () => {
    for (const value of [null, undefined, {}, 'steps', 42, true]) {
      assert.deepEqual(normalizeSteps(value), [])
    }
  })

  it('descarta tramos que no son objetos', () => {
    assert.equal(normalizeSteps([null, crudo[0], 'x', 7]).length, 1)
  })

  it('checkpoints null o no-array se vuelven []', () => {
    for (const value of [null, undefined, 'x', 42, {}]) {
      const [step] = normalizeSteps([{ ...crudo[0], checkpoints: value }])
      assert.deepEqual(step.checkpoints, [])
    }
  })

  it('line ausente o con forma inesperada se vuelve null', () => {
    for (const value of [null, undefined, 'A2', 42, []]) {
      const [step] = normalizeSteps([{ ...crudo[0], line: value }])
      assert.equal(step.line, null)
    }
  })

  it('point ausente se vuelve null y no rompe', () => {
    const [step] = normalizeSteps([{
      ...crudo[0],
      checkpoints: [{ id: 1, order: 0 }, { id: 2, order: 1, point: 'X' }],
    }])
    assert.equal(step.checkpoints[0].point, null)
    assert.equal(step.checkpoints[1].point, null)
  })

  it('coordenadas no finitas se anulan', () => {
    const [step] = normalizeSteps([{
      ...crudo[0],
      checkpoints: [{ id: 1, order: 0, point: { id: 9, latitude: 'abc', longitude: null } }],
    }])
    assert.equal(step.checkpoints[0].point.latitude, null)
    assert.equal(step.checkpoints[0].point.longitude, null)
  })

  it('horarios y nombres vacíos se vuelven null', () => {
    const [step] = normalizeSteps([{
      step: 2, start_schedule: '', end_schedule: '   ',
      checkpoints: [{ id: 1, order: 0, time_calculated: '', time_reported: null,
                      point: { id: 9, name: '  ', latitude: 1, longitude: 1 } }],
    }])
    assert.equal(step.start_schedule, null)
    assert.equal(step.end_schedule, null)
    assert.equal(step.checkpoints[0].time_calculated, null)
    assert.equal(step.checkpoints[0].point.name, null)
  })

  it('da clave de React estable aunque falte el id', () => {
    const [step] = normalizeSteps([{ ...crudo[0], checkpoints: [{ order: 0 }, { order: 1 }] }])
    const claves = step.checkpoints.map((c) => c.key)
    assert.equal(new Set(claves).size, 2)
    assert.ok(claves.every(Boolean))
  })
})

describe('normalizeVehicle', () => {
  it('aplana data y prioriza las columnas propias', () => {
    const vehicle = normalizeVehicle({
      register: 1624, plate: 'LBA-1234',
      data: { plate: 'VIEJA', user: { name: 'Ana', lastname: 'Ruiz' }, company: { name: 'COOP' } },
    })
    assert.equal(vehicle.register, 1624)
    assert.equal(vehicle.plate, 'LBA-1234')
    assert.equal(vehicle.company.name, 'COOP')
  })

  it('sin data ni plate no rompe', () => {
    const vehicle = normalizeVehicle({ register: 1624 })
    assert.equal(vehicle.plate, null)
    assert.equal(vehicle.user, null)
    assert.equal(vehicle.company, null)
  })

  it('data con forma inesperada se ignora', () => {
    for (const value of ['x', 42, [], null]) {
      const vehicle = normalizeVehicle({ register: 1, data: value })
      assert.equal(vehicle.register, 1)
      assert.equal(vehicle.user, null)
    }
  })

  it('devuelve null para respuestas vacías', () => {
    for (const value of [null, undefined, 'x', 42, []]) {
      assert.equal(normalizeVehicle(value), null)
    }
  })
})

describe('normalizeGpsPosition', () => {
  it('lectura completa', () => {
    const position = normalizeGpsPosition({
      latitude: '-4.01', longitude: -79.22, speed: 32, timestamp: '2026-08-25T10:25:00',
    })
    assert.equal(position.latitude, -4.01)
    assert.equal(position.speed, 32)
  })

  it('speed ausente o inválida no anula la posición ni se vuelve 0', () => {
    for (const speed of [null, undefined, '', 'rapido', NaN]) {
      const position = normalizeGpsPosition({ latitude: 1, longitude: 1, speed })
      assert.notEqual(position, null)
      assert.equal(position.speed, null)
    }
    assert.equal(normalizeGpsPosition({ latitude: 1, longitude: 1, speed: 0 }).speed, 0)
  })

  it('sin coordenadas utilizables devuelve null', () => {
    const casos = [
      {}, { latitude: 1 }, { longitude: 1 },
      { latitude: null, longitude: 1 }, { latitude: 'abc', longitude: 1 },
      { latitude: Infinity, longitude: 1 }, { latitude: NaN, longitude: 1 },
      null, undefined, 'x', [],
    ]
    for (const value of casos) {
      assert.equal(normalizeGpsPosition(value), null, JSON.stringify(value))
    }
  })
})

describe('normalizeEvents', () => {
  it('conserva eventos con id numérico', () => {
    const events = normalizeEvents([
      { id: 1, event_type: 'checkpoint_arrival', payload: { point_name: 'A' } },
      { id: '2', event_type: 'checkpoint_arrival', payload: null },
    ])
    assert.equal(events.length, 2)
    assert.equal(events[1].id, 2, 'el id se normaliza a número')
  })

  it('descarta lo que no sirve para el polling incremental', () => {
    const events = normalizeEvents([
      { event_type: 'x' },            // sin id
      { id: null }, { id: 'abc' },
      null, 'x', 42,
      { id: 5 },
    ])
    assert.deepEqual(events.map((e) => e.id), [5])
  })

  it('payload con forma inesperada se vuelve null', () => {
    for (const payload of ['x', 42, [], undefined]) {
      const [event] = normalizeEvents([{ id: 1, payload }])
      assert.equal(event.payload, null)
    }
  })

  it('respuestas que no son arrays', () => {
    for (const value of [null, undefined, {}, 'x', 42]) {
      assert.deepEqual(normalizeEvents(value), [])
    }
  })
})

describe('normalizeNetworkInfo', () => {
  it('conserva conexiones válidas', () => {
    const info = normalizeNetworkInfo({
      status: 'connected',
      connections: [
        { type: 'wifi', interface: 'wlan0', name: 'MiRed', ipv4: ['192.168.1.50'] },
        { type: 'ethernet', interface: 'eth0', name: null, ipv4: ['192.168.1.51'] },
      ],
    })
    assert.equal(info.status, 'connected')
    assert.equal(info.connections.length, 2)
    assert.equal(info.connections[0].name, 'MiRed')
    assert.equal(info.connections[1].name, null)
  })

  it('connections null o no-array no rompe', () => {
    for (const value of [null, undefined, 'x', 42, {}]) {
      const info = normalizeNetworkInfo({ status: 'connected', connections: value })
      assert.deepEqual(info.connections, [])
    }
  })

  it('respuesta con forma inesperada es unavailable, nunca connected', () => {
    for (const value of [null, undefined, 'x', 42, []]) {
      assert.deepEqual(normalizeNetworkInfo(value), { status: 'unavailable', connections: [] })
    }
  })

  it('status desconocido se deduce con prudencia', () => {
    assert.equal(normalizeNetworkInfo({ status: 'raro', connections: [] }).status, 'unavailable')
    assert.equal(
      normalizeNetworkInfo({ status: 'raro', connections: [{ type: 'wifi', ipv4: ['1.2.3.4'] }] }).status,
      'connected',
    )
  })

  it('tipo desconocido se degrada a other', () => {
    for (const type of ['bluetooth', null, 42, undefined, '']) {
      const [c] = normalizeNetworkInfo({ status: 'connected', connections: [{ type, ipv4: [] }] }).connections
      assert.equal(c.type, 'other')
    }
  })

  it('ipv4 no-array o con valores inválidos se filtra', () => {
    for (const ipv4 of [null, undefined, 'x', 42, {}]) {
      const [c] = normalizeNetworkInfo({ status: 'connected', connections: [{ type: 'wifi', ipv4 }] }).connections
      assert.deepEqual(c.ipv4, [])
    }
    const [c] = normalizeNetworkInfo({
      status: 'connected',
      connections: [{ type: 'wifi', ipv4: ['192.168.1.5', '999.1.1.1', null, '', 'fe80::1', 42, '10.0.0.1'] }],
    }).connections
    assert.deepEqual(c.ipv4, ['192.168.1.5', '10.0.0.1'])
  })

  it('interface y name vacíos se vuelven null, nunca "undefined"', () => {
    const [c] = normalizeNetworkInfo({
      status: 'connected',
      connections: [{ type: 'wifi', interface: '  ', name: '', ipv4: [] }],
    }).connections
    assert.equal(c.interface, null)
    assert.equal(c.name, null)
    assert.ok(!String(c.interface).includes('undefined'))
  })

  it('descarta conexiones que no son objetos y da claves estables', () => {
    const info = normalizeNetworkInfo({
      status: 'connected',
      connections: [null, 'x', 42, { type: 'wifi', ipv4: [] }, { type: 'ethernet', ipv4: [] }],
    })
    assert.equal(info.connections.length, 2)
    assert.equal(new Set(info.connections.map((c) => c.key)).size, 2)
  })

  it('no muta la respuesta original', () => {
    const raw = { status: 'connected', connections: [{ type: 'wifi', ipv4: ['1.2.3.4'] }] }
    const copia = JSON.parse(JSON.stringify(raw))
    normalizeNetworkInfo(raw)
    assert.deepEqual(raw, copia)
  })
})
