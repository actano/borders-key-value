export class KeyNotFoundError extends Error {
  constructor(key) {
    super(String(key))
  }
}

KeyNotFoundError.prototype.name = 'KeyNotFoundError'


export class KeyAlreadyExistsError extends Error {
  constructor(key) {
    super(String(key))
  }
}

KeyAlreadyExistsError.prototype.name = 'KeyAlreadyExistsError'
