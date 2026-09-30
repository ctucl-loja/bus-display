import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { formatVersion } from '../src/utils/version.js'

describe('formatVersion', () => {
  it('versión con etiqueta de entrega', () => {
    assert.equal(formatVersion('1.5.2', 'LTS'), 'v1.5.2 LTS')
  })

  it('sin etiqueta no deja espacios colgando', () => {
    assert.equal(formatVersion('1.5.2'), 'v1.5.2')
    assert.equal(formatVersion('1.5.2', '  '), 'v1.5.2')
  })

  it('sin versión utilizable no inventa una', () => {
    assert.equal(formatVersion(''), null)
    assert.equal(formatVersion(undefined, 'LTS'), null)
  })

  it('package.json identifica esta entrega como v1.5.2 LTS', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
    assert.equal(formatVersion(pkg.version, pkg.releaseLabel), 'v1.5.2 LTS')
  })
})
