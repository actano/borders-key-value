import { EVENT_INVOKE } from 'borders'
import { listenerName } from 'borders/backends'
import { CACHED, CACHE_STATS, GET, INSERT, REMOVE, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'
import CachedValueConfig from './cached-value-config'

const DEFAULT_CONFIG = new CachedValueConfig()
  .markRead(GET)
  .markTouched(REMOVE, INSERT, REPLACE, UPSERT)
  .ignore(CACHED, CACHE_STATS)
  .config()

export default class CachedValue {
  constructor(config) {
    this.cache = {}
    this.deps = {}
    this.stats = {
      hits: 0,
      misses: 0,
      evicts: 0,
    }

    this.mark = config ? Object.assign({}, DEFAULT_CONFIG, config.config()) : DEFAULT_CONFIG
  }

  _markTouched(key) {
    if (this.used) {
      throw new Error('Cannot modify KV store in a cache-calculation')
    }
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

  _markRead(key) {
    if (!this.used) return
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
  }

  [CACHE_STATS]() {
    const { hits, misses, evicts } = this.stats
    return { hits, misses, evicts }
  }

  [listenerName(EVENT_INVOKE)](type, payload) {
    const mark = this.mark[type]
    if (mark) {
      mark(this, payload)
    }
  }
}
