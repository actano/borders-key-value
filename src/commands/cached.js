import commandWithStackFrame from 'borders/command-with-stackframe'

export const TYPE = 'KV_CACHED_VALUE'

const cachedValue = (key, calculator) => ({ type: TYPE, payload: { key, calculator } })

export default commandWithStackFrame(cachedValue)
