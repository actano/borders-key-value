/* eslint-env mocha */
import { expect } from 'chai'

import Context from 'borders'
import {
  insert,
  get,
  remove,
  replace,
  upsert,
} from '../commands'

import {
  KeyAlreadyExistsError,
  KeyNotFoundError,
} from '../errors'

export default (createBackend) => {
  const execute = generatorFunction => () => {
    const context = new Context().use(createBackend())
    return context.execute(generatorFunction())
  }

  const KEY = 'key'
  const VALUE = { name: 'name' }
  const VALUE2 = { name: 'name2' }

  function* expectGetKeyNotFound() {
    let expectedErrorThrown = false
    try {
      yield get(KEY)
    } catch (e) {
      if (e instanceof KeyNotFoundError) {
        expectedErrorThrown = true
      } else {
        throw e
      }
    }
    expect(expectedErrorThrown, 'KeyNotFoundError not thrown').to.eq(true)
  }

  function* expectReplaceKeyNotFound() {
    let expectedErrorThrown = false
    try {
      yield replace(KEY, VALUE2)
    } catch (e) {
      if (e instanceof KeyNotFoundError) {
        expectedErrorThrown = true
      } else {
        throw e
      }
    }
    expect(expectedErrorThrown, 'KeyNotFoundError not thrown').to.eq(true)
  }

  it('should throw KeyNotFoundError for non-existing key', execute(function* test() {
    yield* expectGetKeyNotFound()
  }))

  it('should insert and get a value', execute(function* test() {
    yield insert(KEY, VALUE)
    const returnedValue = yield get(KEY)
    expect(returnedValue).to.eql(VALUE)
  }))

  it('should throw KeyAlreadyExistsError when inserting an existing key and leave old value intact', execute(function* test() {
    yield insert(KEY, VALUE)
    let expectedErrorThrown = false
    try {
      yield insert(KEY, VALUE2)
    } catch (e) {
      expectedErrorThrown = e instanceof KeyAlreadyExistsError
    }
    expect(expectedErrorThrown, 'KeyAlreadyExistsError not thrown').to.eq(true)
    const value = yield get(KEY)
    expect(value).to.eql(VALUE)
  }))

  it('should remove a key', execute(function* test() {
    yield insert(KEY, VALUE)
    yield remove(KEY)
    yield* expectGetKeyNotFound()
  }))

  it('should no-op when removing a non-existing key', execute(function* test() {
    yield remove(KEY)
  }))

  it('should replace a key', execute(function* test() {
    yield insert(KEY, VALUE)
    yield replace(KEY, VALUE2)
    expect(yield get(KEY)).to.eql(VALUE2)
  }))

  it('should fail to replace a non-existing key', execute(function* test() {
    yield* expectReplaceKeyNotFound()
  }))

  it('should upsert a non-existing key', execute(function* test() {
    yield upsert(KEY, VALUE)
    expect(yield get(KEY)).to.eql(VALUE)
  }))

  it('should upsert an existing key', execute(function* test() {
    yield upsert(KEY, VALUE)
    yield upsert(KEY, VALUE2)
    expect(yield get(KEY)).to.eql(VALUE2)
  }))
}
