import { EVENT_INVOKE } from 'borders'
import { listenerName } from 'borders/backends'
import {
  CACHED, CACHED_VALUE_STATS, GET, INSERT, REMOVE, REPLACE, UPSERT,
} from '../commands'
import CachedValueConfig from './cached-value-config'

const DEFAULT_CONFIG = new CachedValueConfig()
  .markRead(GET)
  .markTouched(REMOVE, INSERT, REPLACE, UPSERT)
  .ignore(CACHED, CACHED_VALUE_STATS)
  .config()

export class CycleError extends Error {
  constructor(chain) {
    super()
    this.message = 'Cycle detected'
    this.chain = Array.from(chain)
  }
}
CycleError.prototype.name = CycleError.name

export default class CachedValue {
  constructor(config) {
    // the cache itself
    this._cache = new Map() // key -> CacheEntry
    // reverse dependencies, if write to a key in this map, all cache entries in set must be cleared
    this._deps = new Map() // key -> Set(key)
    this.stats = {
      hits: 0,
      misses: 0,
      evicts: 0,
    }
    this.chain = new Set()

    this.mark = config ? Object.assign({}, DEFAULT_CONFIG, config.config()) : DEFAULT_CONFIG
  }

  _markTouched(key) {
    if (this.trackUsage) {
      throw new Error('Cannot modify KV store in a cache-calculation')
    }
    const { _cache, _deps } = this
    const revDeps = _deps.get(key)
    if (revDeps) {
      for (const k of revDeps) {
        if (_cache.delete(k)) {
          this.stats.evicts += 1
        }
      }
      _deps.delete(key)
    }
  }

  _markRead(key) {
    if (!this.trackUsage) return
    this.trackUsage(key)
  }

  _hit(key) {
    const entry = this._cache.get(key)
    this.stats.hits += 1
    if (this.trackUsage) {
      for (const k of entry.deps) {
        this.trackUsage(k)
      }
    }
    return entry.value
  }

  [CACHED]({ key, calculator }, { execute }) {
    if (this.chain.has(key)) {
      throw new CycleError(this.chain)
    }
    if (this._cache.has(key)) {
      return this._hit(key)
    }

    const trackUsageInParent = this.trackUsage || (() => {})
    const trackRevDep = (k) => {
      if (this._deps.has(k)) {
        this._deps.get(k).add(key)
      } else {
        const set = new Set([key])
        this._deps.set(k, set)
      }
    }

    this.stats.misses += 1
    const deps = new Set()
    const entry = { deps }
    const trackUsage = (k) => { deps.add(k) }
    const chain = new Set(this.chain)
    chain.add(key)
    const subcontext = Object.create(this, {
      trackUsage: {
        value: (k) => {
          trackUsage(k)
          trackUsageInParent(k)
          trackRevDep(k)
        },
      },
      chain: {
        value: chain,
      },
    })
    this._cache.set(key, entry)
    entry.value = execute(calculator(key), subcontext)
    return entry.value
  }

  [CACHED_VALUE_STATS]() {
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
