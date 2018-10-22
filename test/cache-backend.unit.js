import { expect } from 'chai'
import { spy } from 'sinon'
import Context from 'borders'
import { cacheStats } from '../src/commands'
import asyncBackend from '../src/spec/async-backend.spec'
import testBackend from '../src/spec/keyvalue-backend.spec'
import inMemory from '../src/backends/memory'
import CacheBackend from '../src/backends/cache'
import insert from '../src/commands/insert'
import get, { TYPE as GET } from '../src/commands/get'

describe('borders-key-value/cache-backend', () => {
  const ID = 'test'
  const value = {}

  let store
  let getSpy

  const insertDirectly = (key, val) => {
    const { type, payload } = insert(key, val)
    return store[type](payload)
  }

  const testCache = (createBackends) => {
    testBackend(createBackends)

    const execute = generatorFunction => () =>
      new Context().use(...createBackends()).execute(generatorFunction())

    it('should call store only once if get called two times', execute(function* test() {
      insertDirectly(ID, value)
      expect(yield get(ID)).to.equal(value)
      expect(yield get(ID)).to.equal(value)
      expect(getSpy.callCount).to.equal(1)
    }))

    it('should not call store if just inserted', execute(function* test() {
      yield insert(ID, value)
      expect(yield get(ID)).to.equal(value)
      expect(getSpy.callCount).to.equal(0)
    }))


    it('should get cacheStats', execute(function* test() {
      yield insert('id1', 'value')
      yield insert('id2', 'value')
      yield get('id1', 'value')
      expect(yield cacheStats()).to.deep.equal({
        count: 2,
      })
    }))
  }

  beforeEach(() => {
    store = inMemory()
    getSpy = spy(store, GET)
  })

  describe('with sync backend', () => {
    testCache(() => [new CacheBackend(), store])
  })

  describe('with async backend', () => {
    testCache(() => [new CacheBackend(), asyncBackend(store), store])
  })
})
