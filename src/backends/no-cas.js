import { GET_CAS } from '../commands'

export default class NoCasBackend {
  // this backend is a noop implementation and needs no access to `this`
  // eslint-disable-next-line class-methods-use-this
  [GET_CAS]() {
    return null
  }
}
