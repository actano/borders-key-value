import {
  GET,
  REMOVE,
  INSERT,
  REPLACE,
  UPSERT,
  GET_CAS,
} from '../commands'

import {
  KeyNotFoundError,
  KeyAlreadyExistsError,
} from '../errors'

export default class MemoryBackend {
  constructor() {
    this._store = new Map()
  }

  [GET]({ key }) {
    if (!this._store.has(key)) throw new KeyNotFoundError(key)
    return this._store.get(key)
  }

  [REMOVE]({ key }) {
    this._store.delete(key)
  }

  [INSERT]({ key, value }) {
    if (this._store.has(key)) throw new KeyAlreadyExistsError(key)
    this._store.set(key, value)
  }

  [REPLACE]({ key, value }) {
    if (!this._store.has(key)) throw new KeyNotFoundError(key)
    this._store.set(key, value)
  }

  [UPSERT]({ key, value }) {
    this._store.set(key, value)
  }

  // this backend is a noop implementation and needs no access to `this`
  // eslint-disable-next-line class-methods-use-this
  [GET_CAS]() {
    return null
  }
}
