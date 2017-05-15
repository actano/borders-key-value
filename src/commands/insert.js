export const TYPE = 'KV_INSERT'

export default (key, value) => ({ type: TYPE, payload: { key, value } })

export class KeyAlreadyExistsError extends Error {
  constructor(key) {
    super(String(key))
  }
}

KeyAlreadyExistsError.prototype.name = 'KeyAlreadyExistsError'
