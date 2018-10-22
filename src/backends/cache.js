import { GET, REMOVE, INSERT, REPLACE, UPSERT, CACHE_STATS } from '../commands'
import { isPromise } from '../utils'

class CacheBackend {
  constructor() {
    this._cache = new Map()
  }

  _promisedUpdate(key, value, result) {
    if (!isPromise(result)) {
      this._cache.set(key, value)
      return result
    }
    this._cache.delete(key)
    return result.then((returnValue) => {
      this._cache.set(key, value)
      return returnValue
    })
  }

  [GET](payload, { next }) {
    const { key } = payload
    let value = this._cache.get(key)
    if (!value) {
      value = next()
      this._cache.set(key, value)
      if (isPromise(value)) {
        return value.then((v) => {
          this._cache.set(key, v)
          return v
        })
      }
    }
    return value
  }

  [REMOVE](payload, { next }) {
    const { key } = payload
    return this._promisedUpdate(key, null, next())
  }

  [INSERT](payload, { next }) {
    const { key, value } = payload
    return this._promisedUpdate(key, value, next())
  }

  [REPLACE](payload, { next }) {
    const { key, value } = payload
    return this._promisedUpdate(key, value, next())
  }

  [UPSERT](payload, { next }) {
    const { key, value } = payload
    return this._promisedUpdate(key, value, next())
  }

  [CACHE_STATS]() {
    return {
      count: this._cache.size,
    }
  }
}

export default () => new CacheBackend()
