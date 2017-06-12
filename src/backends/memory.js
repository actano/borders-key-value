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

export default () => {
  const store = {}

  return {
    [GET](key) {
      const value = store[key]
      if (!value) throw new KeyNotFoundError(key)
      return value
    },

    [REMOVE](key) {
      store[key] = null
    },

    [INSERT]({ key, value }) {
      if (store[key]) throw new KeyAlreadyExistsError(key)
      store[key] = value
    },

    [REPLACE]({ key, value }) {
      if (!store[key]) throw new KeyNotFoundError(key)
      store[key] = value
    },

    [UPSERT]({ key, value }) {
      store[key] = value
    },
  }
}

