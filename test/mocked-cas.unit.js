import Context from 'borders'
import { expect } from 'chai'

import { MockCasBackend } from '../src/backends'
import { getCas, insert, get } from '../src/commands'
import MemoryBackend from '../src/backends/memory'

describe('borders-key-value/mocked-cas-backend', () => {
  let mockedCas
  let backends
  beforeEach(() => {
    mockedCas = new MockCasBackend()
    backends = [mockedCas, new MemoryBackend()]
  })

  const execute = generatorFunction => () => {
    const context = new Context().use(...backends)
    return context.execute(generatorFunction())
  }

  it('should return mocked cas values', execute(function* test() {
    yield insert('id1', 'some value')
    yield insert('id2', 'some value')
    mockedCas.mockCas('id1', 10)
    mockedCas.mockCas('id2', 20)

    expect(yield getCas('id1')).to.equal(10)
    expect(yield getCas('id2')).to.equal(20)
  }))

  it('should forward other commands', execute(function* test() {
    yield insert('id1', 'some value')

    expect(yield get('id1')).to.equal('some value')
  }))
})
