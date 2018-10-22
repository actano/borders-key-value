import cached from './cached'

const defaultArgsToKey = (...args) => args.join(':')

let namespaceKey = 0

const withCache = (calculator, argsToKey = defaultArgsToKey) => {
  namespaceKey += 1
  const namespace = `${namespaceKey}:`
  return (...args) => {
    const key = `${namespace}.${argsToKey(...args)}`
    return cached(key, () => calculator(...args))
  }
}

export default withCache
