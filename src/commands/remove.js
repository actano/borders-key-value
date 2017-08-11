import commandWithStackFrame from 'borders/command-with-stackframe'

export const TYPE = 'KV_REMOVE'

export default commandWithStackFrame(id => ({ type: TYPE, payload: id }))
