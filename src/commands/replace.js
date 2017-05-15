export const TYPE = 'KV_REPLACE'

export default (key, value) => ({ type: TYPE, payload: { key, value } })
