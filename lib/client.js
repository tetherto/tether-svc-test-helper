'use strict'

class Client {
  constructor (worker, opts = {}) {
    // Store reference to the worker and its name
    this.worker = worker.worker // The actual worker instance
    this.workerName = worker.name
    this.net = this.worker.net_r0

    if (!this.net) {
      console.warn('Warning: net_r0 facility not found on worker. RPC requests may fail.')
    }

    this.rpcPublicKey = this.worker.getRpcKey()

    if (!this.rpcPublicKey) {
      throw new Error('RPC public key not found on worker')
    }

    this.conf = {
      timeout: 10000,
      ...opts
    }
  }

  async start () {
    if (!this.net) {
      throw new Error('Network facility not found on worker')
    }

    // Wait for worker to become active
    if (!this.worker.active) {
      await new Promise(resolve => {
        const checkActive = () => {
          if (this.worker.active) {
            resolve()
          } else {
            setTimeout(checkActive, 100)
          }
        }
        checkActive()
      })
    }

    // Initialize RPC if needed
    if (!this.net.rpc) {
      try {
        await this.net.startRpc()
      } catch (err) {
        console.error(`Failed to start RPC: ${err.message}`)
        throw err
      }
    }
  }

  async request (method, data, opts = {}) {
    const maxRetries = opts.maxRetries || 3
    let attempts = 0

    while (attempts < maxRetries) {
      attempts++
      try {
        return await this.net.jRequest(this.rpcPublicKey, method, data, opts)
      } catch (err) {
        if (err.message.includes('CHANNEL_CLOSED') && attempts < maxRetries) {
          await this.net.startRpc()
          // Add a small delay to ensure connection establishment
          await new Promise(resolve => setTimeout(resolve, 100))
          continue // Retry immediately
        }

        throw err
      }
    }
  }

  async stop () {
    await this.net.stop()
    this.rpcPublicKey = null
    this.net = null
  }
}

function createClient (worker, opts) {
  return new Client(worker, opts)
}

module.exports = createClient
