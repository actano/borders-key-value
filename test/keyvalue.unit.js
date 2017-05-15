import testBackend from '../src/spec/keyvalue-backend.spec'
import inMemory from '../src/backends/memory'

describe('borders-key-value/key-value-commands', () => {
  testBackend(inMemory)
})
