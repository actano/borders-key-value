import Context from 'borders'
import { expect } from 'chai'
import { spy } from 'sinon'
import cachedValueBackend from '../src/backends/cached-value'
import inMemory from '../src/backends/memory'
import { get, insert, replace, cached, cacheStats } from '../src/commands'
import testBackend from '../src/spec/keyvalue-backend.spec'

describe('borders-key-value/cached-value-backend', () => {
  const KEY = 'ID'
  const OTHER_KEY = 'OTHER_ID'

  let store
  let backend
  let squareSpy
  let addedSquareSpy

  const execute = generatorFunction => () =>
    new Context().use(backend, store).execute(generatorFunction())

  testBackend(() => [backend, store])

  function* square(key) {
    const value = yield get(key)
    return value * value
  }

  function* addedSquare(key) {
    const value1 = yield cached(key, squareSpy)
    const value2 = yield cached(OTHER_KEY, squareSpy)
    return value1 + value2
  }

  beforeEach(() => {
    store = inMemory()
    backend = cachedValueBackend()
    squareSpy = spy(square)
    addedSquareSpy = spy(addedSquare)
  })

  it('should return cached value on subsequent calls', execute(function* test() {
    yield insert(KEY, 2)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(squareSpy.callCount).to.equal(1)
    expect(yield cacheStats()).to.include({ hits: 1, misses: 1, evicts: 0 })
  }))

  it('should return different value for different keys', execute(function* test() {
    yield insert(KEY, 2)
    yield insert(OTHER_KEY, 3)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(yield cached(OTHER_KEY, squareSpy)).to.equal(9)
    expect(squareSpy.callCount).to.equal(2)
    expect(yield cacheStats()).to.include({ hits: 0, misses: 2, evicts: 0 })
  }))

  it('should invalidate value when used document is changed', execute(function* test() {
    yield insert(KEY, 2)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    yield replace(KEY, 3)
    expect(yield cached(KEY, squareSpy)).to.equal(9)
    expect(yield cached(KEY, squareSpy)).to.equal(9)
    expect(squareSpy.callCount).to.equal(2)
    expect(yield cacheStats()).to.include({ hits: 1, misses: 2, evicts: 1 })
  }))

  it('should invalidate value when used cache-document is changed', execute(function* test() {
    yield insert(KEY, 2)
    yield insert(OTHER_KEY, 5)
    expect(yield cached(KEY, addedSquareSpy)).to.equal(29)
    expect(yield cached(KEY, addedSquareSpy)).to.equal(29)
    expect(yield cacheStats()).to.include({ hits: 1, misses: 3, evicts: 0 })

    yield replace(OTHER_KEY, 6)
    expect(yield cacheStats()).to.include({ hits: 1, misses: 3, evicts: 2 })

    expect(yield cached(KEY, addedSquareSpy)).to.equal(40)
    expect(yield cached(KEY, addedSquareSpy)).to.equal(40)
    expect(yield cacheStats()).to.include({ hits: 2, misses: 6, evicts: 2 })
    expect(addedSquareSpy.callCount).to.equal(2)
  }))
})
