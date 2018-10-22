import { expect } from 'chai'
import sinon from 'sinon'

import withCache from '../src/commands/with-cache'

describe('with-cache', () => {
  const key = cmd => cmd.payload.key
  const calculator = cmd => cmd.payload.calculator

  it('should generate string key', () => {
    const createCommand = withCache()
    const a = createCommand(0)
    expect(key(a)).to.a('string')
  })

  it('should create same keys for same args', () => {
    const createCommand = withCache()
    const a = createCommand(0)
    const b = createCommand(0)
    expect(key(a)).to.equal(key(b))
  })

  it('should create different keys for different args', () => {
    const createCommand = withCache()
    const a = createCommand(0)
    const b = createCommand(1)
    const c = createCommand(0, 1)
    expect(key(a)).to.not.equal(key(b))
    expect(key(a)).to.not.equal(key(c))
    expect(key(b)).to.not.equal(key(c))
  })

  it('should create different keys for different commands with same agrs', () => {
    const a = withCache()
    const b = withCache()
    expect(key(a(0))).to.not.equal(key(b(0)))
  })

  describe('calculator', () => {
    it('should pass args to function', () => {
      const calc = sinon.spy()
      const args = ['a', 1, 'test', {}]
      const _calc = calculator(withCache(calc)(...args))
      _calc()
      expect(calc.calledOnceWith(...args)).to.equal(true)
    })

    it('should return result of function', () => {
      const calc = () => 'result'
      const _calc = calculator(withCache(calc)())
      expect(_calc()).to.equal('result')
    })
  })

  describe('argsTokey', () => {
    it('should pass args to function', () => {
      const keyGen = sinon.spy()
      const args = ['a', 1, 'test', {}]
      withCache(null, keyGen)(...args)
      expect(keyGen.calledOnceWith(...args)).to.equal(true)
    })

    it('should include result in key', () => {
      const keyGen = arg => `___${arg}___`
      expect(key(withCache(null, keyGen)('test'))).to.include(keyGen('test'))
    })
  })
})
