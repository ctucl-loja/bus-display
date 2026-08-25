import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  clampStepIndex,
  findCurrentStepIndex,
  findCurrentStep,
  findCurrentAndNextCheckpoint,
  sortStepsBySchedule,
} from '../src/utils/itinerary.js'
import { describeLine } from '../src/utils/line.js'

const step = (number, start, end, checkpoints = []) => ({
  step: number,
  start_schedule: start,
  end_schedule: end,
  checkpoints,
})

const checkpoint = (id, name, timeCalculated) => ({
  id,
  order: id,
  time_calculated: timeCalculated,
  point: { id, name, latitude: -4, longitude: -79 },
})

const JORNADA = [
  step(1, '06:00:00', '07:00:00'),
  step(2, '08:00:00', '09:00:00'),
  step(3, '10:00:00', '11:00:00'),
]

describe('sortStepsBySchedule', () => {
  it('ordena cronológicamente sin mutar el original', () => {
    const original = [JORNADA[2], JORNADA[0], JORNADA[1]]
    const copia = [...original]
    const ordenado = sortStepsBySchedule(original)

    assert.deepEqual(ordenado.map((s) => s.step), [1, 2, 3])
    assert.deepEqual(original, copia, 'no debe mutar la respuesta de la API')
    assert.notEqual(ordenado, original)
  })

  it('tolera entradas que no son arrays', () => {
    for (const value of [null, undefined, {}, 'steps', 42]) {
      assert.deepEqual(sortStepsBySchedule(value), [])
    }
  })

  it('descarta elementos que no son objetos', () => {
    assert.equal(sortStepsBySchedule([JORNADA[0], null, 'x', 5, undefined]).length, 1)
  })

  it('manda los horarios ilegibles al final sin perderlos', () => {
    const conBasura = [step(9, null, null), JORNADA[1], step(8, 'xx', 'yy'), JORNADA[0]]
    const ordenado = sortStepsBySchedule(conBasura)

    assert.deepEqual(ordenado.map((s) => s.step), [1, 2, 9, 8])
    assert.equal(ordenado.length, 4, 'el conductor debe seguir viendo todos los tramos')
  })
})

describe('findCurrentStepIndex', () => {
  it('elige el tramo activo, con bordes inclusivos', () => {
    for (const hora of ['08:00:00', '08:30:00', '09:00:00']) {
      assert.equal(findCurrentStepIndex(JORNADA, hora), 1, hora)
    }
  })

  it('sin tramo activo elige el próximo', () => {
    assert.equal(findCurrentStepIndex(JORNADA, '05:00:00'), 0)
    assert.equal(findCurrentStepIndex(JORNADA, '07:30:00'), 1)
  })

  it('terminado el día elige el último', () => {
    assert.equal(findCurrentStepIndex(JORNADA, '23:00:00'), 2)
  })

  it('lista vacía o inválida devuelve -1', () => {
    for (const value of [[], null, undefined, {}, 'x']) {
      assert.equal(findCurrentStepIndex(value, '08:30:00'), -1)
    }
  })

  it('hora actual inválida devuelve -1 en vez de un tramo inventado', () => {
    for (const hora of [null, '', 'abc', '25:00:00', 42]) {
      assert.equal(findCurrentStepIndex(JORNADA, hora), -1, String(hora))
    }
  })

  it('no depende del orden del arreglo', () => {
    const revuelto = [JORNADA[2], JORNADA[0], JORNADA[1]]
    const elegido = revuelto[findCurrentStepIndex(revuelto, '08:30:00')]
    assert.equal(elegido.step, 2)
  })

  it('ignora tramos con horario inválido al elegir', () => {
    const steps = [step(9, 'no-es-hora', 'tampoco'), ...JORNADA]
    const elegido = steps[findCurrentStepIndex(steps, '08:30:00')]
    assert.equal(elegido.step, 2)
  })

  it('si ningún tramo tiene horario legible muestra el primero', () => {
    const steps = [step(1, null, null), step(2, 'x', 'y')]
    assert.equal(findCurrentStepIndex(steps, '08:30:00'), 0)
  })

  it('tolera nulls dentro de la lista', () => {
    const steps = [null, JORNADA[1], undefined]
    assert.equal(steps[findCurrentStepIndex(steps, '08:30:00')].step, 2)
  })
})

describe('findCurrentStep', () => {
  it('devuelve null sin tramos', () => {
    assert.equal(findCurrentStep([], '08:30:00'), null)
    assert.equal(findCurrentStep(null, '08:30:00'), null)
  })

  it('devuelve el objeto del tramo activo', () => {
    assert.equal(findCurrentStep(JORNADA, '08:30:00').step, 2)
  })
})

describe('findCurrentAndNextCheckpoint', () => {
  const conPuntos = step(1, '06:00:00', '07:00:00', [
    checkpoint(0, 'A', '06:10:00'),
    checkpoint(1, 'B', '06:30:00'),
    checkpoint(2, 'C', '06:50:00'),
  ])

  it('elige el último ya pasado y el siguiente', () => {
    const { current, next } = findCurrentAndNextCheckpoint(conPuntos, '06:35:00')
    assert.equal(current.point.name, 'B')
    assert.equal(next.point.name, 'C')
  })

  it('en el último punto no hay siguiente', () => {
    const { current, next } = findCurrentAndNextCheckpoint(conPuntos, '06:55:00')
    assert.equal(current.point.name, 'C')
    assert.equal(next, null)
  })

  it('step nulo o sin checkpoints', () => {
    for (const value of [null, undefined, {}, 'x', step(1, '06:00:00', '07:00:00', [])]) {
      assert.deepEqual(findCurrentAndNextCheckpoint(value, '06:35:00'), { current: null, next: null })
    }
  })

  it('checkpoints null o que no son array', () => {
    for (const value of [null, 'x', 42, {}]) {
      const roto = { ...conPuntos, checkpoints: value }
      assert.deepEqual(findCurrentAndNextCheckpoint(roto, '06:35:00'), { current: null, next: null })
    }
  })

  it('salta checkpoints sin hora sin cortar el recorrido', () => {
    const conHuecos = step(1, '06:00:00', '07:00:00', [
      checkpoint(0, 'A', '06:10:00'),
      checkpoint(1, 'B', null),
      checkpoint(2, 'C', '06:30:00'),
      checkpoint(3, 'D', '06:50:00'),
    ])
    const { current, next } = findCurrentAndNextCheckpoint(conHuecos, '06:35:00')
    assert.equal(current.point.name, 'C')
    assert.equal(next.point.name, 'D')
  })

  it('descarta elementos que no son objetos', () => {
    const sucio = { ...conPuntos, checkpoints: [null, checkpoint(0, 'A', '06:10:00'), 'x'] }
    const { current } = findCurrentAndNextCheckpoint(sucio, '06:35:00')
    assert.equal(current.point.name, 'A')
  })

  it('hora inválida devuelve el primer punto sin romper', () => {
    const { current } = findCurrentAndNextCheckpoint(conPuntos, 'abc')
    assert.equal(current.point.name, 'A')
  })
})

describe('describeLine', () => {
  it('arma la etiqueta completa', () => {
    assert.equal(
      describeLine({ number: 8, name: 'A2', start_route: 'CARIGAN', end_route: 'CIUDAD VICTORIA' }),
      '(L8) [A2] : CARIGAN - CIUDAD VICTORIA',
    )
  })

  it('tolera línea nula o incompleta', () => {
    assert.equal(describeLine(null), 'Línea no disponible')
    assert.equal(describeLine(undefined), 'Línea no disponible')
    assert.equal(describeLine({}), 'Línea no disponible')
    assert.equal(describeLine({ number: 8 }), '(L8)')
    assert.equal(describeLine({ start_route: 'A', end_route: 'B' }), 'A - B')
    assert.equal(describeLine({ number: 0, name: 'X' }), '(L0) [X]')
  })
})

describe('clampStepIndex', () => {
  it('mantiene el índice dentro del rango', () => {
    assert.equal(clampStepIndex(0, 3), 0)
    assert.equal(clampStepIndex(2, 3), 2)
    assert.equal(clampStepIndex(5, 3), 2, 'el despacho encogió: se acota al último')
    assert.equal(clampStepIndex(-1, 3), 0)
  })

  it('sin tramos siempre 0', () => {
    for (const length of [0, -1, null, undefined, NaN, 'x']) {
      assert.equal(clampStepIndex(2, length), 0)
    }
  })

  it('índices no utilizables caen en 0', () => {
    for (const index of [null, undefined, NaN, Infinity, 'x']) {
      assert.equal(clampStepIndex(index, 3), 0)
    }
  })
})
