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

  markTouched(payload) {
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

  markHit(key) {
    this.stats.hits += 1
    if (!this.used || !this.cache[key]) return
    const { deps } = this.cache[key]
    if (deps) Object.assign(this.used, deps)
  }

  markRead(payload) {
    if (!this.used) return
    const { key } = payload
    this.used[key] = true
  }

  * calculate(calculator, key) {
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

export default backend => Object.assign(new State(), {
  async [CACHED](payload, ctx) {
    const { key, calculator } = payload
    if (this.cache[key]) {
      this.markHit(key)
      return this.cache[key].value
    }
    const subcontext = Object.create(this, {
      used: {
        value: {},
      },
    })
    const result = await ctx.execute(subcontext.calculate(calculator, key), subcontext)
    if (this.used) {
      Object.assign(this.used, subcontext.used)
    }
    return result
  },

  [GET](payload) {
    this.markRead(payload)
    return backend[GET](payload)
  },

  [REMOVE](payload) {
    this.markTouched(payload)
    return backend[REMOVE](payload)
  },

  [INSERT](payload) {
    this.markTouched(payload)
    return backend[INSERT](payload)
  },

  [REPLACE](payload) {
    this.markTouched(payload)
    return backend[REPLACE](payload)
  },

  [UPSERT](payload) {
    this.markTouched(payload)
    return backend[UPSERT](payload)
  },

  [CACHE_STATS]() {
    const { hits, misses, evicts } = this.stats
    return { hits, misses, evicts }
  },
})
