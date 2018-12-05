export const TYPE = 'KV_GET_CAS'

const getCas = key => ({ type: TYPE, payload: { key } })

export default getCas
