import { getCommands } from 'borders'

export default (backend) => {
  const result = {}

  for (const op of getCommands(backend)) {
    result[op] = async (payload, { next }) => Promise.resolve(next())
  }

  return result
}
