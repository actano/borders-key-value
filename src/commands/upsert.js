import commandWithStackFrame from 'borders/command-with-stackframe'

export const TYPE = 'KV_UPSERT'

export default commandWithStackFrame((key, value) => ({ type: TYPE, payload: { key, value } }))
