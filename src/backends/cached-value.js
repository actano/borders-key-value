import { EVENT_INVOKE } from 'borders'
import { listenerName } from 'borders/backends'
import { CACHED, CACHE_STATS, GET, INSERT, REMOVE, REPLACE, UPSERT } from '../commands'
import { isPromise } from '../utils'
import CachedValueConfig from './cached-value-config'

const merge = (target, src) => src.forEach(k => target.add(k))

const DEFAULT_CONFIG = new CachedValueConfig()
  .markRead(GET)
  .markTouched(REMOVE, INSERT, REPLACE, UPSERT)
  .ignore(CACHED, CACHE_STATS)
  .config()

export default class CachedValue {
  constructor(config) {
    this._cache = new Map()
    this._deps = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evicts: 0,
    }

    this.mark = config ? Object.assign({}, DEFAULT_CONFIG, config.config()) : DEFAULT_CONFIG
  }

  _markTouched(key) {
    if (this._used) {
      throw new Error('Cannot modify KV store in a cache-calculation')
    }
    const { _cache, _deps } = this
    const revDeps = _deps.get(key)
    if (revDeps) {
      for (const k of Object.keys(revDeps)) {
        if (_cache.delete(k)) {
          this.stats.evicts += 1
        }
      }
      _deps.delete(key)
    }
  }

  _markHit(key) {
    this.stats.hits += 1
    if (!this._used) return
    const { deps } = this._cache.get(key)
    if (deps) merge(this._used, deps)
  }

  _markRead(key) {
    if (!this._used) return
    this._used.add(key)
  }

  * _calculate(calculator, key) {
    this.stats.misses += 1
    const value = yield* calculator(key)
    const entry = {
      value,
      deps: this._used,
    }

    const { _deps } = this
    entry.deps.forEach((k) => {
      if (_deps.has(k)) {
        _deps.get(k)[key] = true
      } else {
        _deps.set(k, { [key]: true })
      }
    })

    this._cache.set(key, entry)
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
    const entry = this._cache.get(key)
    if (entry) {
      this._markHit(key)
      return entry.value
    }
    const subcontext = Object.create(this, {
      _used: {
        value: new Set(),
      },
    })
    const result = await ctx.execute(subcontext._calculate(calculator, key), subcontext)
    if (this._used) {
      merge(this._used, subcontext._used)
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
