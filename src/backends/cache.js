import {
  GET, REMOVE, INSERT, REPLACE, UPSERT, CACHE_STATS, GET_CAS,
} from '../commands'
import isPromise from '../is-promise'

export default class CacheBackend {
  constructor() {
    this._cache = new Map()
    this._cacheHits = 0
    this._cacheMisses = 0
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
      this._cacheMisses += 1
      value = next()
      this._cache.set(key, value)
      if (isPromise(value)) {
        return value.then((v) => {
          this._cache.set(key, v)
          return v
        })
      }
    } else {
      this._cacheHits += 1
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
      cacheHits: this._cacheHits,
      cacheMisses: this._cacheMisses,
    }
  }

  // This method doesn't need `this`, but satisfies the interface of the class.
  // eslint-disable-next-line class-methods-use-this
  [GET_CAS](payload, { next }) {
    return next()
  }
}
