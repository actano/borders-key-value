import { CACHED, CACHE_STATS, GET, INSERT, REMOVE, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'

class State {
  constructor() {
    this.cache = {}
    this.deps = {}
    this.stats = {
      hits: 0,
      misses: 0,
      evicts: 0,
    }
  }

  _markTouched(payload) {
    if (this.used) {
      throw new Error('Cannot modify KV store in a cache-calculation')
    }
    const { key } = payload
    const revDeps = this.deps[key]
    if (revDeps) {
      const { cache } = this
      for (const k of Object.keys(revDeps)) {
        if (cache[k]) {
          this.stats.evicts += 1
          cache[k] = null
        }
      }
      this.deps[key] = null
    }
  }

  _markHit(key) {
    this.stats.hits += 1
    if (!this.used || !this.cache[key]) return
    const { deps } = this.cache[key]
    if (deps) Object.assign(this.used, deps)
  }

  _markRead(payload) {
    if (!this.used) return
    const { key } = payload
    this.used[key] = true
  }

  * _calculate(calculator, key) {
    this.stats.misses += 1
    const value = yield* calculator(key)
    const entry = {
      value,
      deps: this.used,
    }

    for (const k of Object.keys(entry.deps)) {
      const map = this.deps[k] || (this.deps[k] = {})
      map[key] = true
    }

    this.cache[key] = entry
    if (isPromise(value)) {
      return value.then((v) => {
        entry.value = v
        return v
      })
    }
    return value
  }
}

export default () => Object.assign(Object.create(new State()), {
  async [CACHED](payload, ctx) {
    const { key, calculator } = payload
    if (this.cache[key]) {
      this._markHit(key)
      return this.cache[key].value
    }
    const subcontext = Object.create(this, {
      used: {
        value: {},
      },
    })
    const result = await ctx.execute(subcontext._calculate(calculator, key), subcontext)
    if (this.used) {
      Object.assign(this.used, subcontext.used)
    }
    return result
  },

  [GET](payload, { next }) {
    this._markRead(payload)
    return next()
  },

  [REMOVE](payload, { next }) {
    this._markTouched(payload)
    return next()
  },

  [INSERT](payload, { next }) {
    this._markTouched(payload)
    return next()
  },

  [REPLACE](payload, { next }) {
    this._markTouched(payload)
    return next()
  },

  [UPSERT](payload, { next }) {
    this._markTouched(payload)
    return next()
  },

  [CACHE_STATS]() {
    const { hits, misses, evicts } = this.stats
    return { hits, misses, evicts }
  },
})
