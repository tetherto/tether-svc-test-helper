'use strict'

class RpcClient {
  constructor (ctx) {
    if (!ctx || !ctx.net_r0) {
      throw new Error('ERR_RPC_MISSING_CONTEXT_OR_NET')
    }

    this.ctx = ctx
  }

  // Perform an RPC call
  async call (rpcKey, payload) {
    if (!rpcKey) {
      throw new Error('ERR_RPC_MISSING_KEY')
    }

    return new Promise((resolve, reject) => {
      this.ctx.net_r0.jRequest(rpcKey, payload, (err, res) => {
        if (err) {
          return reject(new Error(`ERR_RPC_CALL_FAILED: ${err.message}`))
        }
        resolve(res)
      })
    })
  }
}

module.exports = RpcClient
