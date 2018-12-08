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
  constructor(key, cycle) {
    super(`Cycle detected when entering ${key}`)
    this.cycle = Array.from(cycle)
  }

  toString() {
    return `${super.toString()} [${this.cycle}]`
  }
}
CycleError.prototype.name = CycleError.name
