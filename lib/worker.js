'use strict'

const worker = require('bfx-svc-boot-js/lib/worker')

class Worker {
  constructor (conf, ctx) {
    this.conf = conf
    this.ctx = ctx
    this.name = ctx.wtype
    this.worker = null
  }

  async start (cb = () => { }) {
    return new Promise((resolve, reject) => {
      try {
        this.worker = worker(this.conf)

        // Wait for worker to be fully initialized before resolving
        const checkReady = () => {
          if (!this.worker.active) {
            setTimeout(checkReady, 100)
            return
          }

          // For HTTP workers, additionally check if HTTP facility is active
          if (this.worker.httpd_h0) {
            if (!this.worker.httpd_h0.active) {
              setTimeout(checkReady, 100)
              return
            }
          }

          // Check network facility if it exists
          if (this.worker.net_r0) {
            if (!this.worker.net_r0.active || !this.worker.net_r0.rpcServer) {
              setTimeout(checkReady, 100)
              return
            }
          }

          if (cb) cb(null)
          resolve()
        }

        // Start checking if worker is ready
        checkReady()
      } catch (err) {
        if (cb) cb(err)
        reject(err)
      }
    })
  }

  async stop (cb = () => { }) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        if (cb) cb(null)
        return resolve()
      }

      try {
        // Only call stop if we have a worker instance
        this.worker.stop((err) => {
          if (err) {
            if (cb) cb(err)
            return reject(err)
          }
          if (cb) cb(null)
          resolve()
        })
      } catch (err) {
        if (cb) cb(err)
        reject(err)
      }
    })
  }
}

function createWorker (conf) {
  // Construct the context object
  const ctx = {
    env: conf.env || 'test',
    wtype: conf.wtype,
    root: conf.serviceRoot,
    port: conf?.port,
    chain: conf?.chain
  }

  return new Worker(conf, ctx)
}

module.exports = {
  Worker,
  createWorker
}
