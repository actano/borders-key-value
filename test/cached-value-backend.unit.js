import Context from 'borders'
import { expect } from 'chai'
import { spy } from 'sinon'
import CachedValueBackend, { CycleError } from '../src/backends/cached-value'
import MemoryBackend from '../src/backends/memory'
import {
  get, insert, replace, cached, cachedValueStats,
} from '../src/commands'

describe('borders-key-value/cached-value-backend', () => {
  const KEY = 'ID'
  const OTHER_KEY = 'OTHER_ID'

  let store
  let backend
  let squareSpy
  let addedSquareSpy

  const execute = generatorFunction => () =>
    new Context().use(store).use(backend).execute(generatorFunction())

  function* square(key) {
    const value = yield get(key)
    return value * value
  }

  function* addedSquare(key) {
    const value1 = yield cached(`${key}^2`, () => squareSpy(key))
    const value2 = yield cached(`${OTHER_KEY}^2`, () => squareSpy(OTHER_KEY))
    return value1 + value2
  }

  beforeEach(() => {
    store = new MemoryBackend()
    backend = new CachedValueBackend()
    squareSpy = spy(square)
    addedSquareSpy = spy(addedSquare)
  })

  it('should return cached value on subsequent calls', execute(function* test() {
    yield insert(KEY, 2)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(squareSpy.callCount).to.equal(1)
    expect(yield cachedValueStats()).to.include({ hits: 1, misses: 1, evicts: 0 })
  }))

  it('should return different value for different keys', execute(function* test() {
    yield insert(KEY, 2)
    yield insert(OTHER_KEY, 3)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    expect(yield cached(OTHER_KEY, squareSpy)).to.equal(9)
    expect(squareSpy.callCount).to.equal(2)
    expect(yield cachedValueStats()).to.include({ hits: 0, misses: 2, evicts: 0 })
  }))

  it('should invalidate value when used document is changed', execute(function* test() {
    yield insert(KEY, 2)
    expect(yield cached(KEY, squareSpy)).to.equal(4)
    yield replace(KEY, 3)
    expect(yield cached(KEY, squareSpy)).to.equal(9)
    expect(yield cached(KEY, squareSpy)).to.equal(9)
    expect(squareSpy.callCount).to.equal(2)
    expect(yield cachedValueStats()).to.include({ hits: 1, misses: 2, evicts: 1 })
  }))

  it('should invalidate value when used cache-document is changed', execute(function* test() {
    yield insert(KEY, 2)
    yield insert(OTHER_KEY, 5)
    const k = `${KEY}^2 + ${OTHER_KEY}^2`
    // 1. miss ID^2 + OTHER_ID^2
    // 2. miss ID^2
    // 3. miss OTHER_ID^2
    expect(yield cached(k, () => addedSquareSpy(KEY))).to.equal(29)
    expect(yield cachedValueStats()).to.include({ hits: 0, misses: 3, evicts: 0 })
    // 1. hit ID^2 + OTHER_ID^2
    expect(yield cached(k, () => addedSquareSpy(KEY))).to.equal(29)
    expect(yield cachedValueStats()).to.include({ hits: 1, misses: 3, evicts: 0 })

    // 1. evict ID^2 + OTHER_ID^2
    // 2. evict ID^2
    yield replace(OTHER_KEY, 6)
    expect(yield cachedValueStats()).to.include({ hits: 1, misses: 3, evicts: 2 })

    // 4. miss ID^2 + OTHER_ID^2
    // 2. hit ID^2
    // 5. miss OTHER_ID^2
    expect(yield cached(k, () => addedSquareSpy(KEY))).to.equal(40)
    expect(yield cachedValueStats()).to.include({ hits: 2, misses: 5, evicts: 2 })
    // 3. hit ID^2 + OTHER_ID^2
    expect(yield cached(k, () => addedSquareSpy(KEY))).to.equal(40)
    expect(yield cachedValueStats()).to.include({ hits: 3, misses: 5, evicts: 2 })
    expect(addedSquareSpy.callCount).to.equal(2)
  }))

  it('should cache recursive calculations', execute(function* () {
    yield insert('doc-1', 1)
    yield insert('doc-2', 2)
    yield insert('doc-3', 3)
    yield insert('doc-4', 4)

    function* sum(n) {
      const key = `doc-${n}`
      return yield cached(key, function* () {
        const value = yield get(key)

        if (n > 1) {
          // eslint-disable-next-line no-use-before-define
          return value + (yield* sumSpy(n - 1))
        }

        return value
      })
    }

    const sumSpy = spy(sum)

    expect(yield* sumSpy(3)).to.equal(6)
    expect(sumSpy.withArgs(3).callCount).to.equal(1)
    expect(sumSpy.withArgs(2).callCount).to.equal(1)
    expect(sumSpy.withArgs(1).callCount).to.equal(1)

    sumSpy.resetHistory()

    expect(yield* sumSpy(4)).to.equal(10)
    expect(sumSpy.withArgs(4).callCount).to.equal(1)
    expect(sumSpy.withArgs(3).callCount).to.equal(1)
    expect(sumSpy.withArgs(2).callCount).to.equal(0)
    expect(sumSpy.withArgs(1).callCount).to.equal(0)
  }))

  it('should throw on cycles', execute(function* () {
    const calc = key => cached(String(key), function* () {
      return yield calc(2 - key)
    })
    try {
      yield calc(1)
    } catch (e) {
      expect(e).to.be.instanceOf(CycleError)
    }
  }))
})
