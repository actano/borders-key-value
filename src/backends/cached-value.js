import { EVENT_INVOKE } from 'borders'
import { listenerName } from 'borders/backends'
import { CACHED, CACHE_STATS, GET, INSERT, REMOVE, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'

const MARK_READ = '_markRead'
const MARK_TOUCHED = '_markTouched'
const MARK_IGNORE = '_markIgnore'

class CachedValue {
  constructor() {
    this.cache = {}
    this.deps = {}
    this.stats = {
      hits: 0,
      misses: 0,
      evicts: 0,
    }
    this.mark = {
      [GET]: MARK_READ,
      [REMOVE]: MARK_TOUCHED,
      [INSERT]: MARK_TOUCHED,
      [REPLACE]: MARK_TOUCHED,
      [UPSERT]: MARK_TOUCHED,
      [CACHED]: MARK_IGNORE,
      [CACHE_STATS]: MARK_IGNORE,
    }
  }

  [MARK_TOUCHED](payload) {
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

  [MARK_READ](payload) {
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
    if (mark === MARK_IGNORE) return
    if (mark) {
      this[mark](payload)
    }
  }
}

export default () => new CachedValue()
