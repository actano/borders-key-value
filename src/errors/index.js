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

export class CycleError extends Error {
  constructor(cycle) {
    super('Cycle detected')
    this.cycle = Array.from(cycle)
  }
}
CycleError.prototype.name = CycleError.name
