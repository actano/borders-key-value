import assert from 'assert'
import { deprecate } from 'util'

export const isPromise = value => !!value && value.then
export const assertNoArgs = deprecate(fn => (...args) => {
  assert(args.length === 0, `${fn.name} must be called with no args`)
  return fn()
}, 'assertNoArgs will be dropped')
