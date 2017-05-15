import { isPromise } from '../utils'

const promisify = fn => (...args) => {
  let result
  try {
    result = fn(...args)
  } catch (e) {
    return Promise.reject(e)
  }
  if (isPromise(result)) return result
  return Promise.resolve(result)
}

export default (backend) => {
  const result = {}

  for (const op of Object.keys(backend)) {
    result[op] = promisify(backend[op])
  }

  return result
}
