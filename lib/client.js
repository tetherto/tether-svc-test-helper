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

    // Get the RPC public key from worker status
    this.rpcPublicKey = this.worker.status?.rpcPublicKey
    if (!this.rpcPublicKey) {
      console.warn('Warning: RPC public key not found on worker. RPC requests may fail.')
    } else {
      console.log('** Using worker\'s RPC public key **')
    }

    this.conf = {
      timeout: 10000,
      ...opts
    }

    // Debug worker properties
    // console.log('** Worker keys:', Object.keys(this.worker))
    // console.log('** Worker rpcPublicKey:', Object.keys(this.worker.status.rpcPublicKey))
  }

  async connect () {
    if (!this.net) {
      throw new Error('Network facility not found on worker')
    }

    // Check if worker is fully active - only proceed when it is
    if (!this.worker.active) {
      console.log('** Waiting for worker to become active **')
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
      console.log('** RPC not initialized, starting it now **')
      try {
        await this.net.startRpc()
        console.log('** RPC started successfully **')
        if (this.net.rpc) {
          console.log('** RPC is ready for requests **')
        } else {
          console.warn('Warning: RPC could not be initialized. Requests may fail.')
        }
      } catch (err) {
        console.error(`Failed to start RPC: ${err.message}`)
        throw err
      }
    }

    console.log(`** Client connected to worker "${this.workerName}" **`)
    return Promise.resolve()
  }

  async request (method, data, opts = {}) {
    if (!this.net) {
      throw new Error('Network facility not found on worker')
    }

    if (!this.net.rpc) {
      throw new Error('RPC not initialized. Call connect() first.')
    }

    try {
      console.log(`** Attempting RPC request to "${this.worker.wtype}" with method "${method}" **`)

      // Use a Promise with timeout to handle potential channel issues
      const requestPromise = this.net.jRequest(this.rpcPublicKey, method, data, opts)

      // Add a timeout in case the request hangs
      const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timed out'))
        }, this.conf.timeout || 10000)

        // Clean up timeout if request completes
        requestPromise.then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId))
      })

      // Race the request against the timeout
      const response = await Promise.race([requestPromise, timeoutPromise])
      return response
    } catch (err) {
      console.error(`Error making request to "${this.worker.wtype}": ${err.message}`)
      throw err
    }
  }

  async stop () {
    console.log(`** Client disconnected from worker "${this.workerName}" **`)
    this.net = null

    // Allow time for resources to be cleaned up
    await new Promise(resolve => setTimeout(resolve, 200))

    return Promise.resolve()
  }
}

function createClient (worker, opts) {
  return new Client(worker, opts)
}

module.exports = createClient
