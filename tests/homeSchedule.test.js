// Selección temporal de la Home: qué vuelta está en curso y cuál viene después.
//
// Es la lógica que decide si el conductor ve «vuelta en curso» o «el recorrido
// aún no inicia», y qué vuelta se anuncia abajo. Equivocarla no rompe la
// pantalla: la deja diciendo algo falso, que es peor.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  resolveHomeSchedule,
  currentLapMessage,
  nextLapMessage,
  pointsMessage,
  isFinishedContext,
  hasUsableSchedule,
  ACTIVE,
  BEFORE_FIRST,
  BETWEEN,
  AFTER_LAST,
  NO_SCHEDULE,
  UNSCHEDULED,
  UNKNOWN_TIME,
} from '../src/utils/homeSchedule.js'

const line = (name, number) => ({
  id: number,
  name,
  number,
  start_route: 'CARIGAN',
  end_route: 'CIUDAD VICTORIA',
})

const lap = (number, start, end, lineName = 'A2', lineNumber = 8) => ({
  step: number,
  code: `G80${number}`,
  start_schedule: start,
  end_schedule: end,
  line: line(lineName, lineNumber),
  checkpoints: [],
})

// Jornada de tres vueltas, con huecos entre ellas.
const JORNADA = [
  lap(1, '06:00:00', '07:00:00'),
  lap(2, '08:00:00', '09:00:00'),
  lap(3, '10:00:00', '11:00:00'),
]

describe('resolveHomeSchedule — durante una vuelta', () => {
  it('identifica la vuelta activa y su sucesora', () => {
    const result = resolveHomeSchedule(JORNADA, '06:30:00')

    assert.equal(result.phase, ACTIVE)
    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep.step, 2)
    assert.equal(result.previousStep, null)
  })

  it('a mitad de la segunda vuelta anuncia la tercera', () => {
    const result = resolveHomeSchedule(JORNADA, '08:30:00')
    assert.equal(result.currentStep.step, 2)
    assert.equal(result.nextStep.step, 3)
  })

  it('durante la última vuelta no hay siguiente', () => {
    const result = resolveHomeSchedule(JORNADA, '10:30:00')

    assert.equal(result.phase, ACTIVE)
    assert.equal(result.currentStep.step, 3)
    assert.equal(result.nextStep, null)
    assert.match(nextLapMessage(ACTIVE), /no hay más líneas programadas/i)
  })
})

describe('resolveHomeSchedule — no depende del orden del arreglo', () => {
  it('con los tramos desordenados elige lo mismo', () => {
    const desordenado = [JORNADA[2], JORNADA[0], JORNADA[1]]
    const result = resolveHomeSchedule(desordenado, '06:30:00')

    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep.step, 2)
  })

  it('la siguiente vuelta NO es steps[index + 1] del arreglo crudo', () => {
    // En el arreglo crudo, después de la vuelta 1 viene la 3. Por horario, la
    // siguiente es la 2.
    const desordenado = [JORNADA[0], JORNADA[2], JORNADA[1]]
    assert.equal(resolveHomeSchedule(desordenado, '06:30:00').nextStep.step, 2)
  })

  it('no muta el arreglo original', () => {
    const original = [JORNADA[2], JORNADA[0], JORNADA[1]]
    const copia = [...original]
    resolveHomeSchedule(original, '06:30:00')

    assert.deepEqual(original, copia)
    assert.equal(original[0].step, 3, 'el orden original debe seguir intacto')
  })
})

describe('resolveHomeSchedule — dos vueltas de la misma línea', () => {
  it('la siguiente vuelta puede repetir la línea actual', () => {
    // El caso real: el bus hace la misma ruta varias veces al día. Buscar «una
    // línea con nombre distinto» no encontraría nada.
    const mismaLinea = [
      lap(1, '06:00:00', '07:00:00', 'A2', 8),
      lap(2, '08:00:00', '09:00:00', 'A2', 8),
    ]
    const result = resolveHomeSchedule(mismaLinea, '06:30:00')

    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep.step, 2)
    assert.equal(result.nextStep.line.name, result.currentStep.line.name)
    // Y son vueltas distintas, no el mismo objeto.
    assert.notEqual(result.nextStep, result.currentStep)
    assert.notEqual(result.nextStep.code, result.currentStep.code)
  })
})

describe('resolveHomeSchedule — antes de la primera vuelta', () => {
  it('no hay vuelta en curso y se anuncia la primera programada', () => {
    const result = resolveHomeSchedule(JORNADA, '05:00:00')

    assert.equal(result.phase, BEFORE_FIRST)
    assert.equal(result.currentStep, null, 'nada puede estar en curso todavía')
    assert.equal(result.previousStep, null)
    assert.equal(result.nextStep.step, 1)
  })

  it('el mensaje dice que el recorrido aún no inicia', () => {
    assert.match(currentLapMessage(BEFORE_FIRST), /aún no inicia/i)
    assert.match(pointsMessage(BEFORE_FIRST), /aún no inicia/i)
  })
})

describe('resolveHomeSchedule — entre vueltas', () => {
  it('no hay vuelta en curso y se anuncia la próxima', () => {
    const result = resolveHomeSchedule(JORNADA, '07:30:00')

    assert.equal(result.phase, BETWEEN)
    assert.equal(result.currentStep, null)
    assert.equal(result.nextStep.step, 2)
  })

  it('la vuelta anterior queda como contexto, marcada como finalizada', () => {
    const result = resolveHomeSchedule(JORNADA, '07:30:00')

    assert.equal(result.previousStep.step, 1)
    assert.ok(isFinishedContext(result.phase), 'debe etiquetarse como finalizada')
    assert.match(pointsMessage(BETWEEN), /sin vuelta en curso/i)
  })

  it('la anterior es la última que empezó, no la primera del día', () => {
    const result = resolveHomeSchedule(JORNADA, '09:30:00')
    assert.equal(result.previousStep.step, 2)
    assert.equal(result.nextStep.step, 3)
  })
})

describe('resolveHomeSchedule — jornada terminada', () => {
  it('ni vuelta en curso ni siguiente', () => {
    const result = resolveHomeSchedule(JORNADA, '23:00:00')

    assert.equal(result.phase, AFTER_LAST)
    assert.equal(result.currentStep, null, 'el último tramo NO se presenta como activo')
    assert.equal(result.nextStep, null)
    assert.equal(result.previousStep.step, 3)
  })

  it('los mensajes dicen que el itinerario del día finalizó', () => {
    assert.match(currentLapMessage(AFTER_LAST), /finalizó/i)
    assert.match(nextLapMessage(AFTER_LAST), /no hay más vueltas/i)
    assert.ok(isFinishedContext(AFTER_LAST))
  })

  it('se distingue del día sin itinerario', () => {
    // Confundirlos haría creer al conductor que ya terminó cuando en realidad
    // nunca se cargó nada.
    assert.notEqual(currentLapMessage(AFTER_LAST), currentLapMessage(NO_SCHEDULE))
    assert.match(currentLapMessage(NO_SCHEDULE), /volver a cargar itinerario/i)
  })
})

describe('resolveHomeSchedule — el límite entre dos vueltas', () => {
  // Vueltas pegadas: la 1 cierra a las 07:00:00 y la 2 abre a las 07:00:00.
  const PEGADAS = [lap(1, '06:00:00', '07:00:00'), lap(2, '07:00:00', '08:00:00')]

  it('el segundo compartido pertenece a la vuelta que TERMINA', () => {
    const result = resolveHomeSchedule(PEGADAS, '07:00:00')
    assert.equal(result.phase, ACTIVE)
    assert.equal(result.currentStep.step, 1)
  })

  it('en ese instante las dos tarjetas NO muestran el mismo step', () => {
    const result = resolveHomeSchedule(PEGADAS, '07:00:00')

    assert.equal(result.nextStep.step, 2)
    assert.notEqual(result.currentStep.step, result.nextStep.step)
    assert.notEqual(result.currentStep, result.nextStep)
  })

  it('un segundo después manda la vuelta nueva', () => {
    const result = resolveHomeSchedule(PEGADAS, '07:00:01')
    assert.equal(result.currentStep.step, 2)
    assert.equal(result.nextStep, null)
  })

  it('un segundo antes todavía manda la vuelta vieja', () => {
    assert.equal(resolveHomeSchedule(PEGADAS, '06:59:59').currentStep.step, 1)
  })

  it('el inicio y el fin exactos de una vuelta aislada cuentan como en curso', () => {
    const sola = [lap(1, '06:00:00', '07:00:00')]
    assert.equal(resolveHomeSchedule(sola, '06:00:00').phase, ACTIVE)
    assert.equal(resolveHomeSchedule(sola, '07:00:00').phase, ACTIVE)
    assert.equal(resolveHomeSchedule(sola, '07:00:01').phase, AFTER_LAST)
    assert.equal(resolveHomeSchedule(sola, '05:59:59').phase, BEFORE_FIRST)
  })

  it('dos vueltas con el mismo inicio no se duplican', () => {
    // Dato degenerado, pero la respuesta debe ser determinista igual.
    const gemelas = [lap(1, '06:00:00', '07:00:00'), lap(2, '06:00:00', '07:00:00')]
    const result = resolveHomeSchedule(gemelas, '06:30:00')

    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep.step, 2)
    assert.notEqual(result.currentStep, result.nextStep)
  })
})

describe('resolveHomeSchedule — sin itinerario', () => {
  it('lista vacía', () => {
    for (const value of [[], null, undefined, 'texto', 42, {}]) {
      const result = resolveHomeSchedule(value, '06:30:00')
      assert.equal(result.phase, NO_SCHEDULE, JSON.stringify(value))
      assert.equal(result.currentStep, null)
      assert.equal(result.nextStep, null)
      assert.deepEqual(result.steps, [])
    }
  })

  it('el mensaje invita a recargar, no anuncia el fin de la jornada', () => {
    const message = currentLapMessage(NO_SCHEDULE)
    assert.match(message, /no hay un itinerario cargado/i)
    assert.ok(!/finaliz/i.test(message))
  })
})

describe('resolveHomeSchedule — horarios ausentes o inválidos', () => {
  it('una vuelta sin horario nunca está en curso', () => {
    const rotas = [
      { step: 1, code: 'G801', line: line('A2', 8), checkpoints: [] },
      lap(2, '25:00:00', '99:99:99'),
      lap(3, '', ''),
    ]
    const result = resolveHomeSchedule(rotas, '06:30:00')

    assert.equal(result.phase, UNSCHEDULED)
    assert.equal(result.currentStep, null)
    assert.equal(result.nextStep, null)
    assert.equal(nextLapMessage(UNSCHEDULED), 'Horario no disponible')
  })

  it('una vuelta sin horario NO se elige como próxima por quedar al final', () => {
    // `sortStepsBySchedule` manda los horarios ilegibles al final. Tomar «la
    // siguiente de la lista» las escogería por accidente.
    const mixto = [lap(1, '06:00:00', '07:00:00'), lap(9, null, null)]
    const result = resolveHomeSchedule(mixto, '06:30:00')

    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep, null, 'una vuelta sin horario no puede ser «la próxima»')
  })

  it('las vueltas con horario siguen funcionando junto a las rotas', () => {
    const mixto = [lap(9, 'no-es-hora', null), lap(1, '06:00:00', '07:00:00'), lap(2, '08:00:00', '09:00:00')]
    const result = resolveHomeSchedule(mixto, '06:30:00')

    assert.equal(result.currentStep.step, 1)
    assert.equal(result.nextStep.step, 2)
  })

  it('una vuelta con inicio legible y fin ilegible no puede estar en curso', () => {
    // Sin fin no hay ventana: afirmar que está en curso sería inventarla.
    const media = [lap(1, '06:00:00', 'basura')]
    const result = resolveHomeSchedule(media, '06:30:00')

    assert.equal(result.currentStep, null)
    assert.equal(result.phase, AFTER_LAST, 'ya empezó y no sigue en curso')
    assert.equal(result.previousStep.step, 1)
  })

  it('hasUsableSchedule exige los dos extremos', () => {
    assert.ok(hasUsableSchedule(lap(1, '06:00:00', '07:00:00')))
    assert.ok(!hasUsableSchedule(lap(1, '06:00:00', null)))
    assert.ok(!hasUsableSchedule(lap(1, null, '07:00:00')))
    assert.ok(!hasUsableSchedule(null))
  })
})

describe('resolveHomeSchedule — hora ilegible', () => {
  it('no elige ninguna vuelta', () => {
    for (const value of [null, undefined, '', 'mediodía', '25:00:00']) {
      const result = resolveHomeSchedule(JORNADA, value)
      assert.equal(result.phase, UNKNOWN_TIME, JSON.stringify(value))
      assert.equal(result.currentStep, null)
      assert.equal(result.nextStep, null)
    }
  })

  it('lo dice en vez de fingir una secuencia', () => {
    assert.match(currentLapMessage(UNKNOWN_TIME), /hora actual/i)
  })
})

describe('resolveHomeSchedule — una recarga cambia la siguiente vuelta', () => {
  it('el resultado depende solo de los datos recibidos', () => {
    const antes = resolveHomeSchedule(JORNADA, '06:30:00')
    assert.equal(antes.nextStep.step, 2)

    // El servidor devuelve un itinerario distinto: la vuelta 2 desaparece.
    const recargado = [JORNADA[0], lap(7, '09:30:00', '10:30:00', 'B1', 3)]
    const despues = resolveHomeSchedule(recargado, '06:30:00')

    assert.equal(despues.currentStep.step, 1)
    assert.equal(despues.nextStep.step, 7)
    assert.equal(despues.nextStep.line.name, 'B1')
  })

  it('una recarga que vacía el itinerario vuelve a NO_SCHEDULE', () => {
    assert.equal(resolveHomeSchedule([], '06:30:00').phase, NO_SCHEDULE)
  })
})
