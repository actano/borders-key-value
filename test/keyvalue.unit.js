import testBackend from '../src/spec/keyvalue-backend.spec'
import MemoryBackend from '../src/backends/memory'

describe('borders-key-value/key-value-commands', () => {
  testBackend(() => [new MemoryBackend()])
})
