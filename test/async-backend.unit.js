import { expect } from 'chai'
import Context from 'borders'
import asyncBackend from '../src/spec/async-backend.spec'

describe('borders-key-value/async-backend', () => {
  context('when base backend returns a non-promise value', () => {
    let baseBackend
    let context

    beforeEach(() => {
      baseBackend = {
        get() {
          return 42
        },
      }

      context = new Context()
      context.use(asyncBackend(baseBackend), baseBackend)
    })

    it('should return the same value as the base backend', async () => {
      await context.execute(function* test() {
        const value = yield { type: 'get' }

        expect(value).to.equal(42)
      }())
    })
  })

  context('when base backend triggers a side-effect', () => {
    let baseBackend
    let context

    beforeEach(() => {
      baseBackend = {
        set(value) {
          baseBackend.value = value
        },
        value: null,
      }

      context = new Context()
      context.use(asyncBackend(baseBackend), baseBackend)
    })

    it('should trigger the same side-effects as the base backend', async () => {
      await context.execute(function* test() {
        yield { type: 'set', payload: 'foobar' }

        expect(baseBackend.value).to.equal('foobar')
      }())
    })
  })

  context('when base backend returns a promise', () => {
    let baseBackend
    let context

    beforeEach(() => {
      baseBackend = {
        getPromise() {
          return Promise.resolve(111)
        },
      }

      context = new Context()
      context.use(asyncBackend(baseBackend), baseBackend)
    })

    it('should return the resolved value', async () => {
      await context.execute(function* test() {
        const value = yield { type: 'getPromise' }

        expect(value).to.equal(111)
      }())
    })
  })
})
