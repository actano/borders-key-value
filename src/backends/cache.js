import { GET, REMOVE, INSERT, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'

class State {
  constructor() {
    this.cache = {}
  }

  promisedUpdate(key, value, result) {
    if (!isPromise(result)) {
      this.cache[key] = value
      return result
    }
    this.cache[key] = null
    return result.then((returnValue) => {
      this.cache[key] = value
      return returnValue
    })
  }
}

export default () => Object.assign(Object.create(new State()), {
  [GET](payload, { next }) {
    const { key } = payload
    let value = this.cache[key]
    if (!value) {
      this.cache[key] = next()
      value = this.cache[key]
      if (isPromise(value)) {
        return value.then((v) => {
          this.cache[key] = v
          return v
        })
      }
    }
    return value
  },

  [REMOVE](payload, { next }) {
    const { key } = payload
    return this.promisedUpdate(key, null, next())
  },

  [INSERT](payload, { next }) {
    const { key, value } = payload
    return this.promisedUpdate(key, value, next())
  },

  [REPLACE](payload, { next }) {
    const { key, value } = payload
    return this.promisedUpdate(key, value, next())
  },

  [UPSERT](payload, { next }) {
    const { key, value } = payload
    return this.promisedUpdate(key, value, next())
  },
})
