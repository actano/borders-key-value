import { GET, REMOVE, INSERT, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'

export default (backend) => {
  const cache = {}

  const promisedUpdate = (key, value, result) => {
    if (!isPromise(result)) {
      cache[key] = value
      return result
    }
    cache[key] = null
    return result.then((returnValue) => {
      cache[key] = value
      return returnValue
    })
  }

  return Object.assign({}, backend, {
    [GET](key) {
      let value = cache[key]
      if (!value) {
        cache[key] = backend[GET](key)
        value = cache[key]
        if (isPromise(value)) {
          return value.then((v) => {
            cache[key] = v
            return v
          })
        }
      }
      return value
    },

    [REMOVE](key) {
      return promisedUpdate(key, null, backend[REMOVE](key))
    },

    [INSERT](payload) {
      const { key, value } = payload
      return promisedUpdate(key, value, backend[INSERT](payload))
    },

    [REPLACE](payload) {
      const { key, value } = payload
      return promisedUpdate(key, value, backend[REPLACE](payload))
    },

    [UPSERT](payload) {
      const { key, value } = payload
      return promisedUpdate(key, value, backend[UPSERT](payload))
    },
  })
}
