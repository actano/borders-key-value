import assert from 'assert'

export const isPromise = value => !!value && value.then
export const assertNoArgs = fn => (...args) => {
  assert(args.length === 0, `${fn.name} must be called with no args`)
  return fn()
}
