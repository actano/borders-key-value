import {
  GET,
  REMOVE,
  INSERT,
  REPLACE,
  UPSERT,
} from '../commands'

import {
  KeyNotFoundError,
  KeyAlreadyExistsError,
} from '../errors'

class InMemory {
  constructor() {
    this.store = {}
  }

  [GET]({ key }) {
    const value = this.store[key]
    if (!value) throw new KeyNotFoundError(key)
    return value
  }

  [REMOVE]({ key }) {
    this.store[key] = null
  }

  [INSERT]({ key, value }) {
    if (this.store[key]) throw new KeyAlreadyExistsError(key)
    this.store[key] = value
  }

  [REPLACE]({ key, value }) {
    if (!this.store[key]) throw new KeyNotFoundError(key)
    this.store[key] = value
  }

  [UPSERT]({ key, value }) {
    this.store[key] = value
  }
}

export default () => new InMemory()
