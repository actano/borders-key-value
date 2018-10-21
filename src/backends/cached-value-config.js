const isString = value => typeof value === 'string'

const IGNORE = () => {}
const DEFAULT_KEY_GENERATOR = ({ key }) => key

export default class CachedValueConfig {
  constructor() {
    this._config = {}
  }

  _setup(commands, fn) {
    commands.forEach((command) => {
      this._config[command] = fn
    })
    return this
  }

  markRead(keyGenerator, ...commands) {
    if (isString(keyGenerator)) {
      return this.markRead(DEFAULT_KEY_GENERATOR, keyGenerator, ...commands)
    }
    return this._setup(commands, (backend, payload) => backend._markRead(keyGenerator(payload)))
  }

  markTouched(keyGenerator, ...commands) {
    if (isString(keyGenerator)) {
      return this.markTouched(DEFAULT_KEY_GENERATOR, keyGenerator, ...commands)
    }
    return this._setup(commands, (backend, payload) => backend._markTouched(keyGenerator(payload)))
  }

  ignore(...commands) {
    return this._setup(commands, IGNORE)
  }

  config() {
    return Object.assign({}, this._config)
  }
}
