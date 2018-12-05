import { expect } from 'chai'
import Context from 'borders'

import MemoryBackend from '../src/backends/memory'
import NoCasBackend from '../src/backends/no-cas'
import getCas from '../src/commands/get-cas'
import insert from '../src/commands/insert'

const execute = generatorFunction => () =>
  new Context()
    .use(new NoCasBackend())
    .use(new MemoryBackend())
    .execute(generatorFunction())

describe('borders-key-value/no-cas-backend', () => {
  it('should return null as check-and-set value', execute(function* test() {
    yield insert('id1', 'value1')
    const cas = yield getCas('id1')

    expect(cas).to.equal(null)
  }))
})
