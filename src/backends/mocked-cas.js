import {
  GET, REMOVE, INSERT, REPLACE, UPSERT, GET_CAS,
} from '../commands'

class MockCasBackend {
  constructor() {
    this._casMap = {}
  }

  mockCas(key, cas) {
    this._casMap[key] = cas
  }

  // eslint-disable-next-line class-methods-use-this
  [GET](payload, { next }) {
    return next()
  }

  // eslint-disable-next-line class-methods-use-this
  [REMOVE](payload, { next }) {
    return next()
  }

  // eslint-disable-next-line class-methods-use-this
  [INSERT](payload, { next }) {
    return next()
  }

  // eslint-disable-next-line class-methods-use-this
  [REPLACE](payload, { next }) {
    return next()
  }

  // eslint-disable-next-line class-methods-use-this
  [UPSERT](payload, { next }) {
    return next()
  }

  // this backend is a noop implementation and needs no access to `this`
  // eslint-disable-next-line class-methods-use-this
  [GET_CAS]({ key }) {
    return this._casMap[key]
  }
}

export default MockCasBackend
