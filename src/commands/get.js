export const TYPE = 'KV_GET'

export default id => ({ type: TYPE, payload: id })

export class KeyNotFoundError extends Error {
  constructor(key) {
    super(String(key))
  }
}

KeyNotFoundError.prototype.name = 'KeyNotFoundError'
