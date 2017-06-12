export const TYPE = 'KV_INSERT'

export default (key, value) => ({ type: TYPE, payload: { key, value } })
