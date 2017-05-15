export const TYPE = 'KV_UPSERT'

export default (key, value) => ({ type: TYPE, payload: { key, value } })
